# Self-writing name: how the data is made

`src/components/handwriting.ts` holds each word as a filled outline plus the "pen strokes" that uncover it.
You only need this if you change the words (e.g. a different name or greeting).

1. Get the font file (WOFF) — e.g. `npm pack @fontsource/great-vibes` and use `files/great-vibes-latin-400-normal.woff`.
2. `npm i opentype.js@1.3.4 playwright` in a scratch folder, and `pip install scikit-image scipy pillow numpy`.
3. `node words.cjs <font.woff> words.json Myself Dheeraj Panthangi` — outlines + a preview HTML
4. `node rast.cjs words.html rast Myself Dheeraj Panthangi` — renders each word to PNG
5. `python3 strokes.py words.json rast strokes.json` — skeletonises the letters into ordered pen strokes
6. Paste the result into `src/components/handwriting.ts` (same shape: d, w, h, pen, base, strokes[[d, length]]).

Fonts: Great Vibes and Mrs Saint Delafield, both SIL Open Font License 1.1.
