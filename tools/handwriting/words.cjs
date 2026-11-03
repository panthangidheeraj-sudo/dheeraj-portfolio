const opentype = require('opentype.js'); const fs = require('fs');
const [,, fontFile, out] = process.argv;
const font = opentype.parse(fs.readFileSync(fontFile).buffer.slice(0));
const SIZE = 300, PAD = 40, res = {};
for (const w of process.argv.slice(4)) {
  const p0 = font.getPath(w, 0, 0, SIZE); const bb = p0.getBoundingBox();
  const p = font.getPath(w, PAD - bb.x1, PAD - bb.y1, SIZE);
  res[w] = { d: p.toPathData(2), w: Math.ceil(bb.x2 - bb.x1 + 2 * PAD), h: Math.ceil(bb.y2 - bb.y1 + 2 * PAD), baseline: PAD - bb.y1, adv: font.getAdvanceWidth(w, SIZE) };
}
fs.writeFileSync(out, JSON.stringify(res));
let html = '<html><body style="margin:0;background:#000">';
for (const [w, r] of Object.entries(res)) html += `<svg id="${w}" width="${r.w}" height="${r.h}" style="display:block"><path d="${r.d}" fill="#fff"/></svg>`;
fs.writeFileSync(out.replace('.json', '.html'), html + '</body></html>');
