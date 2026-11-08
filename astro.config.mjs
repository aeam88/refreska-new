// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { defineHastPlugin } from 'satteri';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

/**
 * ¿Es un <p> que contiene únicamente imágenes (y espacios en blanco)?
 * @param {any} node
 * @returns {boolean}
 */
const esSoloImagenes = (node) =>
  node.type === 'element' &&
  node.tagName === 'p' &&
  node.children.some((/** @type {any} */ c) => c.type === 'element' && c.tagName === 'img') &&
  node.children.every(
    (/** @type {any} */ c) =>
      (c.type === 'element' && c.tagName === 'img') ||
      (c.type === 'text' && !c.value.trim())
  );

/**
 * Plugin hast (Sätteri): agrupa las imágenes sueltas consecutivas del markdown
 * en un contenedor `.img-grid` para que se rendericen en grilla de 2 por fila.
 * El markdown de origen queda intacto.
 */
const imgGrid = defineHastPlugin({
  name: 'img-grid',
  after(root, ctx) {
    const kids = root.children;
    if (!Array.isArray(kids)) return;

    /** Nodo de relleno entre bloques (saltos de línea del markdown) */
    const esRelleno = (/** @type {any} */ n) => n.type === 'text' && !n.value.trim();

    /** @type {any[]} */
    const out = [];
    let i = 0;
    while (i < kids.length) {
      if (!esSoloImagenes(kids[i])) {
        out.push(kids[i]);
        i++;
        continue;
      }
      // Racha de párrafos de imagen, saltando los nodos de texto en blanco
      let j = i;
      /** @type {any[]} */
      const imgs = [];
      while (j < kids.length) {
        const n = /** @type {any} */ (kids[j]);
        if (esSoloImagenes(n)) {
          imgs.push(...n.children.filter((/** @type {any} */ c) => c.type === 'element'));
        } else if (!esRelleno(n)) {
          break;
        }
        j++;
      }
      if (imgs.length > 1) {
        out.push({
          type: 'element',
          tagName: 'div',
          properties: { className: ['img-grid'] },
          children: imgs,
        });
      } else {
        // Una sola imagen: se queda como está (párrafo suelto)
        out.push(...kids.slice(i, j));
      }
      i = j;
    }
    ctx.setField(root, 'children', out);
  },
});

// https://astro.build/config
export default defineConfig({
  site: 'https://www.refreska.cl',
  integrations: [sitemap()],
  adapter: vercel(),
  markdown: {
    processor: satteri({ hastPlugins: [imgGrid] }),
  },
});
