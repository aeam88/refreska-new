import { chromium } from 'playwright';

const BASE = 'http://localhost:4321/contacto';
const OUT = 'scripts/shots/contacto';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

const settle = async (pg) => {
  await pg.waitForTimeout(1600);
  await pg.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
};
const errors = [];
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push(String(e)));

await p.goto(BASE, { waitUntil: 'networkidle' });
await settle(p);

const dom = await p.evaluate(() => {
  const q = (s) => document.querySelectorAll(s);
  const form = document.querySelector('#Form form');
  return {
    h1: [...q('h1')].map((e) => e.textContent.trim()),
    h2: [...q('h2')].map((e) => e.textContent.trim().slice(0, 60)),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    formAction: form?.getAttribute('action'),
    inputs: [...q('#Form input')].map((i) => i.name + (i.required ? '*' : '')),
    selects: [...q('#Form select')].map((s) => s.name + ':' + s.options.length),
    textarea: q('#Form textarea').length,
    honeypot: !!document.querySelector('#Form input[name="website"]'),
    avatars: q('.avatars img').length,
    pasos: [...q('.cards li h3')].map((e) => e.textContent.trim()),
    scrollMargin: getComputedStyle(document.querySelector('#Form')).scrollMarginTop,
    title: document.title,
  };
});
console.log('DOM:', JSON.stringify(dom, null, 1));
await p.screenshot({ path: `${OUT}-1440.png`, fullPage: true });

await p.goto(`${BASE}#Form`, { waitUntil: 'networkidle' });
await settle(p);
const anchor = await p.evaluate(() => {
  const r = document.querySelector('#Form').getBoundingClientRect();
  return { top: Math.round(r.top), visible: r.top >= 0 && r.top < 200 };
});
console.log('ANCLA #Form:', JSON.stringify(anchor));
await p.screenshot({ path: `${OUT}-anchor.png` });

await p.route('**/api/contacto', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.fill('#nombre', 'Brad Pitt');
await p.fill('#marca', 'Mad Charlies');
await p.fill('#whatsapp', '+56912345678');
await p.fill('#email', 'brad@madcharlie.cl');
await p.selectOption('#plazo', { index: 1 });
await p.fill('#rut', '76.123.456-7');
await p.selectOption('#etapa', { index: 2 });
await p.selectOption('#necesidad', { index: 1 });
await p.selectOption('#presupuesto', { index: 2 });
await p.fill('#mensaje', 'Queremos renovar la identidad y el packaging de la marca.');
await p.click('#Form button[type="submit"]');
await p.waitForSelector('[data-done]:not([hidden])', { timeout: 5000 });
console.log('ESTADO OK: panel de éxito visible');
await settle(p);
await p.screenshot({ path: `${OUT}-success.png` });

await p.unroute('**/api/contacto');
await p.route('**/api/contacto', (r) => r.fulfill({ status: 500, body: 'err' }));
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.fill('#nombre', 'Brad Pitt');
await p.fill('#marca', 'Mad Charlies');
await p.fill('#whatsapp', '+56912345678');
await p.fill('#email', 'brad@madcharlie.cl');
await p.selectOption('#plazo', { index: 1 });
await p.selectOption('#etapa', { index: 1 });
await p.selectOption('#necesidad', { index: 1 });
await p.selectOption('#presupuesto', { index: 1 });
await p.fill('#mensaje', 'Hola');
await p.click('#Form button[type="submit"]');
await p.waitForSelector('[data-fail]:not([hidden])', { timeout: 5000 });
console.log('ESTADO FAIL:', (await p.textContent('[data-fail]')).replace(/\s+/g, ' ').trim());
await settle(p);
await p.screenshot({ path: `${OUT}-fail.png` });

await p.unroute('**/api/contacto');
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelector('#Form form').requestSubmit());
await p.waitForTimeout(400);
console.log('VALIDACIÓN nativa → sigue en /contacto:', p.url().endsWith('/contacto'));

const m = await b.newPage({ viewport: { width: 390, height: 844 } });
m.on('console', (x) => { if (x.type() === 'error') errors.push('mobile: ' + x.text()); });
await m.goto(BASE, { waitUntil: 'networkidle' });
await settle(m);
const mOverflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log('MOBILE overflowX:', mOverflow);
await m.screenshot({ path: `${OUT}-390.png`, fullPage: true });

console.log('CONSOLE ERRORS:', errors.length ? errors : 'ninguno');
await b.close();
