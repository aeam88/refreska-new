# Refreska.cl — Rediseño

Rediseño completo de **[refreska.cl](https://www.refreska.cl)**: un sitio nuevo de cero, con una dirección visual más moderna y dinámica, manteniendo las mismas rutas y contenido del sitio actual para no perder SEO.

Inspirado en experiencias con [partículas WebGL y morph por scroll]: loader animado, tipografía display a pantalla completa, texturas de grain/viñeta y micro-interacciones con cursor custom.

## ✨ Qué cambia con el rediseño

- **Experiencia WebGL en vivo**: canvas de partículas fijo detrás del contenido que hace *morph* entre formas (texto `REFRESKA`, packaging, globo, toroide, scatter) según el progreso del scroll.
- **Motion fluido**: scroll suave con Lenis + animaciones GSAP/ScrollTrigger (reveals por línea, stagger, parallax, HUD de sección `01 / 05`).
- **Loader de entrada**: contador 0→100 % que libera el hero con transición `expo.inOut`.
- **Atmósfera visual**: grano animado, viñeta radial, polvo de fondo y cursor custom con repulsión de partículas bajo el mouse.
- **Design system con tokens**: paleta oscura con acentos turquesa/lima/blanco cálido, escalas fluidas con `clamp()`, grid editorial y componentes reutilizables.
- **Contenido estructurado**: todo el copy vive en Content Collections (Markdown/JSON) validadas con Zod — nada hardcodeado en layouts.
- **Accesibilidad**: `prefers-reduced-motion` desactiva morph/animaciones fuertes, fallback sin WebGL, foco visible y semántica correcta.

## 🛠 Tecnologías

| Tecnología | Uso |
|---|---|
| [Astro 7](https://docs.astro.build) | Framework principal, SSR + Content Collections |
| [Three.js](https://threejs.org) | Escena WebGL: partículas, morph y shaders |
| [GSAP](https://gsap.com) (+ ScrollTrigger) | Animaciones, reveals y timelines de scroll |
| [Lenis](https://lenis.darkroom.engineering) | Smooth scroll |
| [Zod](https://zod.dev) | Schemas de las colecciones de contenido y validación del formulario |
| TypeScript | Tipado en todo el proyecto |
| [Vercel](https://vercel.com) | Deploy (adapter `@astrojs/vercel`, output server para API routes) |
| `@astrojs/sitemap` / `@astrojs/rss` | SEO técnico |
| Inter Variable | Tipografía única (display 800 / cuerpo 350) |

## 🚀 Comandos

Todos se ejecutan desde la raíz del proyecto (Node ≥ 22.23.4):

| Comandos | Acción |
| :--- | :--- |
| `npx astro dev --background` | Dev server en `http://localhost:4321` (en background) |
| `npx astro dev status` \| `logs` \| `stop` | Gestionar el dev server |
| `npm run build` | Build de producción en `./dist/` |
| `npm run preview` | Previsualizar el build |
| `npx astro check` | Typecheck (debe dar 0 errores) |
| `node scripts/check-lab.mjs` | QA de líneas del hero en 1280/1440/1920 (Playwright) |
| `node scripts/check-mobile.mjs` | Ídem a 390 px |
| `node scripts/shot-*.mjs` | Screenshots headless |

## 📁 Estructura

```text
src/
├── assets/              # imágenes migradas
├── components/
│   ├── layout/          # Header, Footer, SEO, Cursor, Grain, Vignette
│   ├── ui/              # Btn, Eyebrow, Tag, LineReveal, SectionHeading, Icon
│   ├── sections/        # Hero, formularios, etc.
│   └── webgl/           # ParticleCanvas, ParticleText
├── content/             # colecciones Markdown: proyectos, servicios, posts, paginas
├── data/                # colecciones JSON: testimonios, marcas, faq, sitio
├── layouts/             # BaseLayout (head SEO, capas de atmósfera)
├── pages/
│   ├── index.astro      # home
│   ├── [slug].astro     # servicios y proyectos
│   ├── blog/            # listado + [slug]
│   ├── proyectos/       # listado
│   ├── contacto.astro
│   └── dev/             # lab de diseño y pruebas
├── scripts/
│   ├── webgl/           # scene.ts, shapes.ts, shaders.ts
│   └── motion/          # intro.ts, scroll.ts
└── styles/              # tokens.css, base.css, typography.css
```

## 📦 Content Collections

El contenido se edita desde archivos, con schema validado por Zod (`src/content.config.ts`):

| Colección | Fuente | Qué guarda |
|---|---|---|
| `proyectos` | `src/content/proyectos/*.md` | título, cliente, sector, servicios, año, cover, galería, destacado |
| `servicios` | `src/content/servicios/*.md` | lead, hero, bullets, proceso, proyectos relacionados, meta SEO |
| `posts` | `src/content/posts/*.md` | título, descripción, fecha, cover, tags, tiempo de lectura |
| `paginas` | `src/content/paginas/*.md` | páginas institucionales (sobre, privacidad) |
| `testimonios`, `marcas`, `faq`, `sitio` | `src/data/*.json` | quotes, logos, preguntas frecuentes, datos de contacto y opciones del formulario |

**Para agregar un proyecto o artículo:** crear un `.md` en la carpeta correspondiente con los campos del schema, y listo — el listado, el detalle y el sitemap lo toman automáticamente.

## 🔍 SEO y despliegue

- Rutas idénticas al sitio actual (`/branding`, `/packaging`, `/proyectos`, `/blog`, …) para no perder posicionamiento.
- Head completo en `BaseLayout`: canonical, Open Graph, Twitter Cards y JSON-LD (`ProfessionalService`).
- Sitemap y RSS generados en cada build.
- Deploy en Vercel con `site: 'https://www.refreska.cl'` en `astro.config.mjs`.

## 📚 Docs

- [Documentación de Astro](https://docs.astro.build)
