import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text()); });
await p.goto('http://localhost:4321/dev/lab', { waitUntil: 'networkidle' });
await p.waitForTimeout(5500); // loader + intro
await p.screenshot({ path: 'scripts/shots/0-hero.png' });
// sección 1 (escudo)
await p.evaluate(() => document.querySelectorAll('section')[1].scrollIntoView());
await p.waitForTimeout(3500); // morph
await p.screenshot({ path: 'scripts/shots/1-logo.png' });
// sección 2 (lata)
await p.evaluate(() => document.querySelectorAll('section')[2].scrollIntoView());
await p.waitForTimeout(3500);
await p.screenshot({ path: 'scripts/shots/2-can.png' });
await b.close();
console.log('ok');
