import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4321/');
const res = await p.evaluate(async (url) => {
  const img = new Image(); img.src = url; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  // píxeles "de partículas" (teal/verde brillantes) en la zona izquierda-media (monograma)
  const d = x.getImageData(200, 150, 500, 600).data;
  let teal = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], bl = d[i+2];
    if (g > 120 && bl > 90 && g > r + 30) teal++;
  }
  return { teal };
}, 'http://localhost:4321/_shots/mono-1794147514289.png');
console.log('zona monograma — píxeles teal:', JSON.stringify(res));
await b.close();
