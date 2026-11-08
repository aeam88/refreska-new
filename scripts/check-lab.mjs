import { chromium } from 'playwright';
const b = await chromium.launch();
for (const vp of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 800 }]) {
  const p = await b.newPage({ viewport: vp });
  await p.goto('http://localhost:4321/dev/lab', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2200);
  const data = await p.evaluate(() => {
    const blk = document.querySelector('.hero .p-block');
    const h1 = document.querySelector('.hero h1');
    const lh = parseFloat(getComputedStyle(h1.querySelector('.line > span')).lineHeight);
    const lines = [...document.querySelectorAll('.hero .line > span')].map((s) => ({
      text: s.textContent,
      visualLines: Math.round(s.getBoundingClientRect().height / lh),
      w: Math.round(s.getBoundingClientRect().width),
    }));
    return { blockW: Math.round(blk.getBoundingClientRect().width), h1Font: getComputedStyle(h1).fontSize, lines };
  });
  console.log(vp.width + 'px →', JSON.stringify(data));
  await p.close();
}
await b.close();
