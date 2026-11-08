import { chromium } from 'playwright';

const slug = process.argv[2] ?? 'branding';
const widths = [1440, 390];

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

for (const width of widths) {
  const p = await b.newPage({ viewport: { width, height: 900 } });
  await p.goto(`http://localhost:4321/${slug}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);

  const r = await p.evaluate(() => {
    const cs = (el) => getComputedStyle(el);
    const h1 = document.querySelector('.head h1');
    const lead = document.querySelector('.head .lead');
    const h2 = document.querySelector('.prose h2');
    const h2p = h2?.nextElementSibling;

    // nº de líneas del h1 (rects de rango) + solapamiento vertical entre líneas
    const range = document.createRange();
    range.selectNodeContents(h1);
    const rects = [...range.getClientRects()].filter((x) => x.height > 4);
    const tops = [...new Set(rects.map((x) => Math.round(x.top)))].sort((a, b) => a - b);
    let overlap = 0;
    for (let i = 1; i < tops.length; i++) {
      const prev = rects.find((x) => Math.round(x.top) === tops[i - 1]);
      const cur = rects.find((x) => Math.round(x.top) === tops[i]);
      if (prev.bottom > cur.top + 0.5) overlap = Math.round(prev.bottom - cur.top);
    }

    const imgLists = [...document.querySelectorAll('.prose ul')].filter((u) => u.querySelector('img'));
    const listInfo = imgLists.map((u) => {
      const lis = [...u.children];
      const cols = new Set(lis.map((li) => Math.round(li.getBoundingClientRect().left))).size;
      const marker = getComputedStyle(lis[0], '::before').content;
      return {
        items: lis.length,
        cols,
        listStyle: getComputedStyle(u).listStyleType,
        markerContent: marker,
        colWidth: Math.round(lis[0].getBoundingClientRect().width),
        imgH: Math.round(u.querySelector('img').getBoundingClientRect().height),
      };
    });

    const gap = (a, bEl) => (a && bEl ? Math.round(bEl.getBoundingClientRect().top - a.getBoundingClientRect().bottom) : null);

    return {
      h1: {
        fontSize: cs(h1).fontSize,
        lineHeight: cs(h1).lineHeight,
        lines: tops.length,
        descenderOverlapPx: overlap,
        gapToLead: gap(h1, lead),
      },
      h2: h2
        ? { fontSize: cs(h2).fontSize, lineHeight: cs(h2).lineHeight, gapToP: gap(h2, h2p) }
        : null,
      lists: listInfo,
      docH: document.documentElement.scrollHeight,
    };
  });

  console.log(`\n=== ${slug} @ ${width}px ===`);
  console.log(JSON.stringify(r, null, 2));
  await p.close();
}

await b.close();
