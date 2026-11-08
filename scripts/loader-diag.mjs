import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const t0 = Date.now();
await p.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
// muestrear el estado del loader y del pulso
const samples = [];
for (let i = 0; i < 45; i++) {
  const s = await p.evaluate(() => {
    const l = document.getElementById('loader');
    const svg = document.querySelector('.pulse svg');
    return {
      loader: !!l,
      op: l ? getComputedStyle(l).opacity : '-',
      pulse: svg ? getComputedStyle(svg).transform : '-',
      particles: (() => { const c = document.getElementById('gl'); return c ? c.width + 'x' + c.height : '-'; })(),
      uIntroVisible: !!document.querySelector('section[data-intro]'),
    };
  });
  samples.push(`${((Date.now() - t0) / 1000).toFixed(1)}s loader=${s.loader} op=${s.op} pulse=${s.pulse.slice(0, 30)} canvas=${s.particles}`);
  await p.waitForTimeout(200);
}
console.log(samples.join('\n'));
await b.close();
