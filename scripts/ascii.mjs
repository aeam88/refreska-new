import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4321/');
const art = await p.evaluate(async ({ url, x0, y0, w, h, cols, rows }) => {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const data = x.getImageData(x0, y0, w, h).data;
  const cw = w / cols, ch = h / rows;
  let out = '';
  for (let r = 0; r < rows; r++) {
    for (let cc = 0; cc < cols; cc++) {
      let teal = 0, n = 0;
      for (let y = Math.floor(r * ch); y < (r + 1) * ch; y++) {
        for (let X = Math.floor(cc * cw); X < (cc + 1) * cw; X++) {
          const i = (y * w + X) * 4;
          const rr = data[i], g = data[i + 1], bl = data[i + 2];
          if (g > 100 && g > rr + 20) teal++;
          n++;
        }
      }
      const ratio = teal / n;
      out += ratio > 0.28 ? '#' : ratio > 0.12 ? '+' : ratio > 0.04 ? '.' : ' ';
    }
    out += '\n';
  }
  return out;
}, { url: 'http://localhost:4321/_shots/mono-1794147514289.png', x0: 220, y0: 180, w: 440, h: 520, cols: 88, rows: 42 });
console.log(art);
await b.close();
