import { chromium } from 'playwright';

const slug = process.argv[2] ?? 'branding';
const width = Number(process.argv[3] ?? 1440);
const out = process.argv[4] ?? `scripts/shots/servicio-${slug}-${width}`;

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width, height: 900 } });
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text()); });
await p.goto(`http://localhost:4321/${slug}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);

const doc = await p.evaluate(() => ({
  h: document.documentElement.scrollHeight,
  h1s: [...document.querySelectorAll('h1')].map((e) => e.textContent.trim().slice(0, 60)),
  lists: [...document.querySelectorAll('.prose ul')].map((u) => ({
    n: u.children.length,
    imgs: u.querySelectorAll('img').length,
    first: u.children[0]?.textContent.trim().slice(0, 50),
  })),
}));
console.log(JSON.stringify(doc, null, 2));

const step = 800;
let i = 0;
for (let y = 0; y < doc.h; y += step, i++) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}-${String(i).padStart(2, '0')}.png` });
}
await b.close();
console.log(`shots: ${i} → ${out}-*.png`);
