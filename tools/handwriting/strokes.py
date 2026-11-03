"""Derive pen strokes (ordered centre-lines) from rendered script words, for a write-on mask."""
import json, math, sys
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize
from scipy import ndimage as ndi

src_json, rast_dir, out_json = sys.argv[1:4]
words = json.load(open(src_json))
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b - a
    L = np.hypot(*ab)
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        p = np.array(pts[i], float)
        q = p - a; d = abs(ab[0] * q[1] - ab[1] * q[0]) / L if L else np.hypot(*q)
        if d > best:
            best, idx = d, i
    if best > eps:
        return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def process(name):
    img = np.array(Image.open(f"{rast_dir}/{name}.png").convert('L')) > 110
    dist = ndi.distance_transform_edt(img)
    sk = skeletonize(img)
    H, W = sk.shape
    S = set(zip(*np.nonzero(sk)))

    def nb(p):
        return [(p[0] + dy, p[1] + dx) for dy, dx in N8 if (p[0] + dy, p[1] + dx) in S]

    # prune short spurs a few times
    for _ in range(3):
        ends = [p for p in S if len(nb(p)) == 1]
        for e in ends:
            path = [e]
            cur, prev = e, None
            while True:
                n = [q for q in nb(cur) if q != prev]
                if len(n) != 1 or len(path) > 14:
                    break
                prev, cur = cur, n[0]
                if len(nb(cur)) != 2:
                    break
                path.append(cur)
            if len(path) <= 12 and len(nb(cur)) >= 3:
                for q in path:
                    S.discard(q)

    deg = {p: len(nb(p)) for p in S}
    nodes = {p for p in S if deg[p] != 2}
    # cluster adjacent node pixels
    cl = {}
    cid = 0
    for p in nodes:
        if p in cl:
            continue
        stack = [p]
        cl[p] = cid
        while stack:
            q = stack.pop()
            for r in nb(q):
                if r in nodes and r not in cl:
                    cl[r] = cid
                    stack.append(r)
        cid += 1
    edges = []  # (a, b, pixels)
    seen = set()
    for p in nodes:
        for q in nb(p):
            if q in nodes or q in seen:
                continue
            path = [p, q]
            seen.add(q)
            prev, cur = p, q
            while True:
                n = [r for r in nb(cur) if r != prev and r not in path[-3:]]
                n2 = [r for r in n if r in nodes]
                if n2:
                    path.append(n2[0])
                    break
                n = [r for r in n if r not in seen]
                if not n:
                    break
                prev, cur = cur, n[0]
                seen.add(cur)
                path.append(cur)
            if path[-1] in nodes:
                edges.append([cl[p], cl[path[-1]], path])
            else:
                edges.append([cl[p], None, path])
    # pure loops (no nodes)
    rest = [p for p in S if p not in nodes and p not in seen]
    rest_set = set(rest)
    while rest_set:
        start = min(rest_set, key=lambda p: p[1])
        path = [start]
        rest_set.discard(start)
        cur = start
        while True:
            n = [r for r in nb(cur) if r in rest_set]
            if not n:
                break
            cur = n[0]
            rest_set.discard(cur)
            path.append(cur)
        path.append(start)
        cid += 1
        edges.append([cid, cid, path])

    edges = [e for e in edges if len(e[2]) >= 3]
    # component of each edge (union-find over cluster ids)
    par = {}

    def f(x):
        par.setdefault(x, x)
        while par[x] != x:
            par[x] = par[par[x]]
            x = par[x]
        return x

    for a, b, _ in edges:
        if b is not None:
            par[f(a)] = f(b)
        else:
            f(a)
    comps = {}
    for i, (a, b, px) in enumerate(edges):
        comps.setdefault(f(a), []).append(i)

    def direction(px, from_start=True, k=10):
        seg = px[:k] if from_start else px[-k:][::-1]
        if len(seg) < 2:
            return (0.0, 0.0)
        dy, dx = seg[-1][0] - seg[0][0], seg[-1][1] - seg[0][1]
        L = math.hypot(dx, dy) or 1
        return (dx / L, dy / L)

    order = []
    for key, idxs in comps.items():
        xs = [p[1] for i in idxs for p in edges[i][2]]
        ys = [p[0] for i in idxs for p in edges[i][2]]
        size = len(xs)
        order.append((min(xs), size, key, idxs, (min(ys), max(ys))))
    total = sum(o[1] for o in order)
    main = sorted([o for o in order if o[1] > 0.04 * total], key=lambda o: o[0])
    small = sorted([o for o in order if o[1] <= 0.04 * total], key=lambda o: o[0])

    strokes = []
    for _, _, _, idxs, _ in main + small:
        unused = set(idxs)
        # endpoints of each edge as cluster ids; start at leftmost pixel endpoint
        def ends_of(i):
            a, b, px = edges[i]
            return [(px[0], i, True), (px[-1], i, False)]
        while unused:
            cands = [e for i in unused for e in ends_of(i)]
            # prefer true pen starts: degree-1 endpoints on the left
            start = min(cands, key=lambda e: (e[0][1] + (0 if deg.get(e[0], 2) == 1 else 25)))
            _, i, fwd = start
            poly = []
            while True:
                px = edges[i][2] if fwd else edges[i][2][::-1]
                poly.extend(px if not poly else px[1:])
                unused.discard(i)
                end = px[-1]
                endc = cl.get(end)
                if endc is None:
                    break
                inc = direction(px, from_start=False)
                inc = (-inc[0], -inc[1])  # travel direction at the end
                best, bi, bf = None, None, None
                for j in unused:
                    a, b, pj = edges[j]
                    for side, fw in ((a, True), (b, False)):
                        if side == endc:
                            d = direction(pj if fw else pj[::-1])
                            turn = 1 - (inc[0] * d[0] + inc[1] * d[1])
                            if best is None or turn < best:
                                best, bi, bf = turn, j, fw
                if bi is None:
                    break
                i, fwd = bi, bf
            strokes.append(poly)

    rad = float(np.percentile(dist[img], 99.5))
    out = []
    for poly in strokes:
        pts = rdp([(p[1], p[0]) for p in poly], 0.9)
        if len(pts) < 2:
            continue
        d = 'M' + ' L'.join(f"{x:.0f} {y:.0f}" for x, y in pts)
        L = sum(math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) for k in range(len(pts) - 1))
        out.append({'d': d, 'len': round(L + 1)})
    return out, rad


result = {}
for w, info in words.items():
    st, rad = process(w)
    result[w] = {**info, 'strokes': st, 'pen': round(rad * 2 + 6)}
    print(w, len(st), 'strokes, pen', result[w]['pen'], 'lens', [s['len'] for s in st])
json.dump(result, open(out_json, 'w'))
