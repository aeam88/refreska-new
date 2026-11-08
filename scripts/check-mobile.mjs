import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await p.goto('http://localhost:4321/dev/lab', { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
console.log(JSON.stringify(await p.evaluate(() => {
  const h1 = document.querySelector('.hero h1');
  const lh = parseFloat(getComputedStyle(h1.querySelector('.line > span')).lineHeight);
  return [...document.querySelectorAll('.hero .line > span')].map((s) => ({
    t: s.textContent, lines: Math.round(s.getBoundingClientRect().height / lh), w: Math.round(s.getBoundingClientRect().width),
  }));
})));
await b.close();
