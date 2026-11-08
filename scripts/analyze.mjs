import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:4321/');
for (const f of process.argv.slice(2)) {
  const name = f.split('/').pop();
  const res = await p.evaluate(async (url) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    let magenta = 0;
    const d = x.getImageData(1000, 60, 440, 80).data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 200 && d[i + 1] < 60 && d[i + 2] > 200) magenta++;
    }
    const c2 = x.getImageData(400, 400, 600, 300).data;
    let lum = 0;
    for (let i = 0; i < c2.length; i += 4) lum += (c2[i] + c2[i + 1] + c2[i + 2]) / 3;
    return { magenta, lum: Math.round(lum / (c2.length / 4)) };
  }, `http://localhost:4321/_shots/${name}`);
  console.log(name, JSON.stringify(res));
}
await b.close();
