const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2000, height: 400 }, deviceScaleFactor: 1 });
await p.goto('file://' + process.argv[2]);
for (const w of process.argv.slice(4)) await p.locator('#' + w).screenshot({ path: process.argv[3] + '/' + w + '.png' });
await b.close(); })();
