# Plan de desarrollo — Refreska.cl (reconstrucción)

Reconstrucción completa de **https://www.refreska.cl** en Astro, con animaciones **GSAP** y escenas **Three.js**, inspirada en el diseño de https://particle-morph-inshaal.vercel.app/ (loader de partículas, morph por scroll, tipografía display a pantalla completa, grain/vignette, cursor custom, HUD de progreso).

## Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Alcance | Sitio completo (home, servicios, proyectos, blog, legales) |
| Contenido | Content Collections de Astro (proyectos, posts, servicios, testimonios) |
| Formulario | Endpoint propio (API route de Astro) reenviando por correo (Resend u otro) |
| Deploy | Vercel (misma ruta/URLs que el sitio actual, sin perder SEO) |
| Stack | Astro 7 + GSAP (ScrollTrigger) + Three.js + Lenis (smooth scroll) |

---

## Dirección visual (síntesis del sitio de inspiración adaptado a Refreska)

- **Canvas WebGL fijo** (`position:fixed`) detrás de todo el contenido; las partículas hacen **morph entre una forma por sección** (texto "REFRESKA", botella/lata de packaging, globo, toroide, scatter) según el progreso del scroll.
- **Loader** con contador 0→100% ("Armando partículas") que libera el hero con una transición tipo `expo.inOut`.
- **Tipografía display** enorme (Syne o similar) con líneas que entran por `yPercent:110` dentro de `overflow:hidden`, palabras clave con degradado.
- **Capas de atmósfera**: grain SVG animado + viñeta radial + polvo de fondo (dust).
- **Micro-interacción**: cursor custom (punto + anillo), repulsión de partículas bajo el mouse, "burst" al hacer click, HUD de sección (01 / barra / 05).
- **Textura de contenido**: eyebrow con línea, tags con `backdrop-filter`, CTA pill con degradado, grid editorial alternando alineación izquierda/derecha.
- **Paleta**: derivada de la identidad actual de Refreska (a confirmar en Fase 0: violetas/rosa del sitio actual + acento). Se mantiene fondo oscuro para que el WebGL brille (`AdditiveBlending`).
- **Accesibilidad**: `prefers-reduced-motion` desactiva morph, lenis y animaciones fuertes; cursor custom solo en desktop.

## Estructura objetivo del proyecto

```
src/
  assets/img/            # imágenes migradas (proyectos, clientes, marcas)
  components/
    layout/  (Header, Footer, SEO, Cursor, HUD, Grain, Vignette)
    ui/      (Button, Tag, Eyebrow, SectionHeading, Accordion, Marquee)
    sections/(Hero, ServicesGrid, ProjectsShowcase, Approach, BrandsMarquee,
              Testimonials, Faq, CtaBanner, ContactForm)
  content/
    proyectos/  *.md     # colección
    posts/      *.md     # blog
    servicios/  *.md
    testimonios/ *.json (o md)
  layouts/BaseLayout.astro, PageLayout.astro, ProjectLayout.astro, PostLayout.astro
  pages/
    index.astro
    proyectos/index.astro
    [slug].astro  (servicios y proyectos — igual que el sitio actual)
    blog/index.astro, blog/[slug].astro
    contacto.astro, sobre-refreska.astro, privacidad.astro
    api/contacto.ts      # endpoint del formulario
  scripts/
    webgl/scene.ts, shapes.ts, shaders.ts   # módulo Three.js
    motion/scroll.ts, intro.ts, cursor.ts   # módulo GSAP
  styles/tokens.css, base.css, typography.css
public/assets/img/...     # imágenes finales + fonts
```

**Mapa de rutas (idéntico al sitio actual para no romper SEO):**
`/`, `/branding`, `/diseno`, `/packaging`, `/digital`, `/cervecero`, `/diseno-para-restaurantes`, `/proyectos`, 11 proyectos (`/madcharlie`, `/bloombox`, `/merken-street-food`, `/x-analytic`, `/avianti`, `/check360`, `/digitaldeals`, `/hybrid`, `/mi-caleta`, `/fluidmain`), `/blog` + 6 artículos, `/contacto`, `/sobre-refreska`, `/privacidad`.

---

## Fase 0 — Fundamentos y design system
**Objetivo:** base técnica y visual sobre la que se construye todo.

1. Dependencias: `gsap`, `three`, `@studio-freight/lenis` (o `lenis`), `@astrojs/sitemap`, `@astrojs/rss`; adapter `@astrojs/vercel` (server para el endpoint del formulario).
2. Estructura de carpetas, `astro.config.mjs` (site URL, sitemap, adapter Vercel, i18n no aplica).
3. Tokens CSS: paleta (bg oscuro, acento, gradientes), escalas tipográficas, spacing, `clamp()` para fluides, fuentes (Syne display + Inter text, self-hosted woff2).
4. `BaseLayout.astro`: head SEO completo (OG, Twitter, canonical, schema JSON-LD LocalBusiness), Header fijo con `mix-blend-mode:difference`, Footer, capas Grain/Vignette/Cursor.
5. Componentes UI base: `Eyebrow`, `Btn` (pill con degradado), `Tag`, `LineReveal` (líneas con overflow hidden), `SectionHeading`.
6. Configurar `npm run dev` con el script `astro dev --background` de AGENTS.md y verificar build.

**Entregable:** `astro build` sin errores, header/footer/tokens funcionando en una página dummy.
**Criterio:** design tokens + componentes UI revisados y aprobados visualmente.

## Fase 1 — Migración de contenido a Content Collections
**Objetivo:** todo el contenido del sitio actual, estructurado y versionado.

1. Descargar assets del sitio actual (`/assets/img/*`: proyectos .avif, clientes .webp, marcas, logos) → optimizar (sharp/`astro:assets`) y clasificar en carpetas.
2. Colecciones (schemas con `zod`):
   - `proyectos`: título, slug, cliente, sector, servicios[], año, resumen, cover, galería[], destacado, orden.
   - `posts`: título, descripción, fecha, cover, tags, tiempo de lectura.
   - `servicios`: título, slug, hero, lead, bullets, CTA.
   - `testimonios`, `marcas` (trayectoria), `faq`, `sitio` (datos generales: enlaces sociales, RUT, datos de contacto).
3. Transcribir textos del sitio actual: home (todos los bloques), 6 servicios, 11 proyectos, 6 posts, sobre-refreska, privacidad, FAQ, testimonios.
4. Páginas mínimas que consuman cada colección (listados simples, sin animación) para validar datos.

**Entregable:** colecciones completas + páginas estáticas con todo el contenido real.
**Criterio:** cobertura 100% de las ~30 URLs con contenido, sin lorem ipsum.

## Fase 2 — Core WebGL (Three.js) y motion (GSAP)
**Objetivo:** el motor de efectos, desacoplado de las páginas.

1. `scene.ts`: renderer (DPR limitado, `high-performance`), cámara con `camZ` responsive, resize, dispose.
2. `shapes.ts`: generadores de formas (muestreo sobre canvas 2D y matemáticas):
   - `textShape("REFRESKA")` (canvas con la fuente display),
   - **botella/lata de packaging** (cilindro + etiqueta, alineado al rubro de Refreska),
   - **globo terráqueo** (con value-noise para continentes),
   - **toroide/nudo** (torus knot), **scatter** (esfera dispersa).
3. Shader de morph: atributos por forma (`p0..p4`), interpolación con stagger por `aRand`, sway en tránsito, intro desde scatter, repulsión por mouse (raycast a plano), burst en click, colores por mix de acentos + `AdditiveBlending`.
4. Dust de fondo + rotación/offset por sección (las partículas se corren al lado contrario del texto, como en el sitio de inspiración).
5. `intro.ts`: loader con contador, secuencia de entrada (loader out → partículas in → líneas del hero → nav/HUD).
6. `scroll.ts`: Lenis + ScrollTrigger, progreso global → `uProg` (con lerp), HUD de sección, timelines de reveal (`yPercent:110`, stagger, `toggleActions` reversible).
7. `cursor.ts`: punto + anillo con lerp, estado `big` sobre enlaces, click burst.
8. Fallbacks: sin WebGL o `prefers-reduced-motion` → estático (imagen/gradiente), móvil reduce partículas (≈9.000) y escala.

**Entregable:** página `/dev/lab` de prueba con 5 formas y scroll de ejemplo.
**Criterio:** 60 fps en desktop, ~30+ fps en móvil medio, sin errores de consola, fallbacks OK.

## Fase 3 — Home (página principal)
**Objetivo:** la landing completa con todas las secciones animadas, siguiendo la estructura del sitio actual.

1. **Hero**: eyebrow, titular en líneas con degradado, prueba social (4 fotos de clientes + nombres de marcas), CTA al formulario, scroll cue, meta de datos.
2. **Proyectos destacados**: grid editorial con hover (reveal de imagen, parallax con ScrollTrigger).
3. **Enfoque / manifiesto**: texto grande con palabras destacadas animadas por scroll.
4. **Testimonios**: slider/carrusel con transiciones GSAP (auto + drag/arrow).
5. **Trayectoria (marcas)**: marquee infinito de logos (pausa en hover), bloque "¿Y tu marca?".
6. **CTA + formulario** (mini): ancla `#Form` con el formulario completo (Fase 6 lo conecta).
7. **Sobre Refreska + FAQ**: acordeón animado.
8. **Footer**: 3 columnas de enlaces + sociales.
9. Mapeo scroll → morph: 5–6 "anclas" de sección que disparan cada forma.

**Entregable:** home final, responsive (desktop/tablet/móvil), con copy real.
**Criterio:** iguala o supera al sitio actual en claridad de mensaje; Lighthouse perf ≥ 85.

## Fase 4 — Páginas internas
**Objetivo:** servicios, proyectos y páginas institucionales con el mismo lenguaje.

1. **Servicios (6)**: template compartido desde colección — hero con forma WebGL propia (cada servicio dispara una forma distinta), bullets, proceso, casos relacionados, CTA.
2. **Listado `/proyectos`**: grid filtrable por categoría (animación de filtrado con GSAP Flip).
3. **Template de proyecto** `[slug]`: hero cover, metadata (cliente/servicios/año), galería con reveals, siguiente proyecto (transición).
4. **`/sobre-refreska`**: historia, proceso en pasos (scroll-linked), Alexander Mallea, CTA.
5. **`/contacto`**: página dedicada al formulario + datos de contacto.
6. **`/privacidad`**: texto legal estático.

**Entregable:** las ~20 páginas internas publicadas.
**Criterio:** navegación completa sin enlaces rotos, cada página con meta tags propios.

## Fase 5 — Blog
**Objetivo:** blog con SEO sólido.

1. `/blog` listado con tarjetas animadas.
2. `blog/[slug]`: plantilla de artículo (tipografía de lectura, imagen hero, tabla de contenidos opcional, CTA final), render MD/MDX.
3. Generación de `sitemap`, `rss.xml`, JSON-LD `Article`, Open Graph images.

**Entregable:** 6 artículos publicados con SEO completo.
**Criterio:** artículos indexables, OG previews correctos.

## Fase 6 — Formulario (backend)
**Objetivo:** captar leads de verdad.

1. `POST /api/contacto` (Astro server endpoint en Vercel): validación Zod, honeypot, rate limiting básico, sanitización.
2. Envío por **Resend** (o servicio elegido): correo al estudio + acuse automático al interesado.
3. UI: estados loading/éxito/error animados con GSAP, validación inline, campos select del sitio actual (etapa, necesidad, presupuesto, plazo).
4. Consentimiento de privacidad + nota de tratamiento con IA (igual que el texto actual).
5. Variables de entorno en Vercel (`RESEND_API_KEY`, `TO_EMAIL`…).

**Entregable:** formulario funcional en staging con correo real recibido.
**Criterio:** submissions llegan, validaciones funcionan, sin spam.

## Fase 7 — QA, performance y accesibilidad
**Objetivo:** pulido antes de lanzar.

1. Responsive real: iOS Safari, Android Chrome, desktop; revisar que el canvas no tape el contenido (tocables, `pointer-events`).
2. Performance: lazy del WebGL en páginas internas, `content-visibility`, imágenes `astro:assets` (AVIF/WebP), preload de fuentes, presupuesto de JS (< 250 KB gz sin three en páginas que no lo usen).
3. Accesibilidad: `prefers-reduced-motion`, contraste AA, foco visible, semántica, skip-link, form labels.
4. SEO técnico: canonical, OG, sitemap, robots.txt, redirecciones 301 si cambia alguna ruta, JSON-LD.
5. Cross-browser: Safari/Firefox/Chrome, sin errores de consola.

**Entregable:** checklist QA cerrado.
**Criterio:** Lighthouse (perf/a11y/SEO) ≥ 90 en home y ≥ 95 en páginas de contenido.

## Fase 8 — Deploy y lanzamiento
**Objetivo:** sitio en producción.

1. Proyecto en Vercel + adapter, dominio `refreska.cl` / `www.refreska.cl`, HTTPS.
2. Variables de entorno, dominios, `site` correcto en `astro.config.mjs`.
3. Smoke test post-deploy: 30 URLs, formulario, analytics (medição/consentimiento igual que actual si aplica).
4. Handoff: README con comandos, estructura de colecciones (cómo agregar proyecto/post), backup del sitio anterior.

**Entregable:** sitio vivo en refreska.cl + documentación.
**Criterio:** todas las URLs viejas responden 200 y el formulario opera.

---

## Estimación orientativa

| Fase | Días aprox. |
|---|---|
| 0 Fundamentos | 1–2 |
| 1 Contenido | 2–3 |
| 2 Core WebGL/motion | 3–5 |
| 3 Home | 3–4 |
| 4 Internas | 4–6 |
| 5 Blog | 1–2 |
| 6 Formulario | 1–2 |
| 7 QA | 2–3 |
| 8 Deploy | 0.5–1 |
| **Total** | **~18–28 días** |

## Riesgos y mitigación

- **WebGL pesado en móviles**: cap de partículas por breakpoint, DPR ≤ 1.5, pausar rAF con `IntersectionObserver`/`visibilitychange`.
- **Pérdida de SEO**: mantener rutas idénticas, contenido en HTML (no solo canvas), mismos H1/meta.
- **Contenido desactualizado**: colecciones como única fuente de verdad; nada hardcodeado en layouts.
- **Sobrecarga visual sobre el texto**: capa de viñeta/gradientes de contraste y `pointer-events:none` en el canvas.
- **Scope creep**: el motor WebGL (Fase 2) se congela antes de las páginas; nuevos efectos se agregan como variantes de `shapes.ts`.
