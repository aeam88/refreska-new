import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [file, x0, y0, w, h] = process.argv.slice(2);
const X = Number(x0), Y = Number(y0), W = Number(w), H = Number(h);
const dataUrl = `data:image/png;base64,${readFileSync(file).toString('base64')}`;

const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4321/');
const out = await p.evaluate(async ({ dataUrl, X, Y, W, H }) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(X, Y, W, H).data;
  const rows = [];
  for (let y = 0; y < H; y++) {
    let ink = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (lum > 120) ink++;
    }
    rows.push(ink);
  }
  return { w: img.width, h: img.height, rows };
}, { dataUrl, X, Y, W, H });

console.log(`image ${out.w}x${out.h} · región x${X} y${Y} ${W}x${H}`);
const max = Math.max(...out.rows);
out.rows.forEach((v, i) => {
  const bar = '█'.repeat(Math.round((v / max) * 40));
  console.log(String(Y + i).padStart(5), String(v).padStart(4), bar);
});
await b.close();
