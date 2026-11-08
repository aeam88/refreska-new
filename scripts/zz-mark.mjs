import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:4321/dev/lab', { waitUntil: 'networkidle' });
await p.waitForTimeout(5500);
const mark = async (label) => {
  const y = await p.evaluate(() => Math.round(scrollY));
  const hud = await p.evaluate(() => document.getElementById('hud-num')?.textContent);
  await p.evaluate(({ label, y, hud }) => {
    let d = document.getElementById('mark');
    if (!d) { d = document.createElement('div'); d.id = 'mark'; document.body.appendChild(d); }
    Object.assign(d.style, { position: 'fixed', top: '70px', right: '16px', background: '#f0f', color: '#000', font: 'bold 34px monospace', padding: '8px 14px', zIndex: 99999 });
    d.textContent = `${label} y=${y} hud=${hud}`;
  }, { label, y, hud });
  await p.waitForTimeout(300);
  const file = `scripts/shots/mark-${label}-${Date.now()}.png`;
  await p.screenshot({ path: file });
  console.log(label, 'log y=' + y, 'hud=' + hud, '->', file);
};
await mark('A-top');
await p.evaluate(() => window.scrollTo(0, 2700));
await p.waitForTimeout(4000);
await mark('B-sec3');
await b.close();
