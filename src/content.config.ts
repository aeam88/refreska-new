import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob, file } from 'astro/loaders';

/**
 * Rutas de imagen: se guardan como strings con la ruta pública
 * (ej: "/assets/img/proyectos/madcharlie/madcharlie-01-1024.avif").
 * Usar preferentemente la variante "-1024"; el componente
 * ResponsiveImage deriva -640/-1920 en build si existen.
 */

const imagen = z.object({
  src: z.string(),
  alt: z.string().optional(),
});

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(),
    client: z.string().optional(),
    sector: z.string().optional(),
    services: z.array(z.string()).default([]),
    year: z.string().optional(),
    cover: imagen,
    og: z.string().optional(),
    gallery: z.array(imagen).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    summary: z.string(),
  }),
});

const servicios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicios' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    lead: z.string(),
    hero: imagen.optional(),
    card: imagen.optional(),
    bullets: z.array(z.string()).default([]),
    process: z
      .array(
        z.object({
          step: z.string(),
          title: z.string(),
          desc: z.string(),
        })
      )
      .default([]),
    projects: z.array(z.string()).default([]), // slugs de proyectos relacionados
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(), // ISO: 2026-11-06
    cover: imagen,
    tags: z.array(z.string()).default([]),
    readingTime: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const paginas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paginas' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    cover: imagen.optional(),
  }),
});

const testimonios = defineCollection({
  loader: file('./src/data/testimonios.json'),
  schema: z.object({
    id: z.string(),
    quote: z.string(),
    name: z.string(),
    role: z.string(),
    avatar: z.string().optional(),
  }),
});

const marcas = defineCollection({
  loader: file('./src/data/marcas.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    logo: z.string(),
  }),
});

const faq = defineCollection({
  loader: file('./src/data/faq.json'),
  schema: z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  }),
});

/** Datos generales del sitio: contacto, redes, opciones del formulario */
const sitio = defineCollection({
  loader: file('./src/data/sitio.json'),
  schema: z.object({
    id: z.string(),
    nombre: z.string(),
    email: z.string(),
    instagram: z.string(),
    linkedin: z.string(),
    formOptions: z.object({
      plazo: z.array(z.string()),
      etapa: z.array(z.string()),
      necesidad: z.array(z.string()),
      presupuesto: z.array(z.string()),
    }),
  }),
});

export const collections = {
  proyectos,
  servicios,
  posts,
  paginas,
  testimonios,
  marcas,
  faq,
  sitio,
};
