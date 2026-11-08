/**
 * Integración de motion: Lenis (smooth scroll) + GSAP ScrollTrigger.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const isReduced = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth scroll con Lenis; null si reduced-motion */
export function initSmoothScroll() {
  if (isReduced()) return null;
  const lenis = new Lenis({ lerp: 0.08 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t: number) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

interface RevealOptions {
  /** Secciones que anima el intro (se excluyen del reveal por scroll) */
  skipIntro?: boolean;
}

/**
 * Reveals por sección: líneas (.line > span) entran desde abajo con stagger,
 * el resto (.eyebrow, .lead, .tags, .btn, [data-reveal-item]) sube con fade.
 * Reversible al salir de la sección (toggleActions).
 */
export function initSectionReveals({ skipIntro = false }: RevealOptions = {}) {
  if (isReduced()) return;

  const sections = [...document.querySelectorAll<HTMLElement>('section[data-reveal]')];
  sections.forEach((s) => {
    if (skipIntro && s.hasAttribute('data-intro')) return;

    const lines = s.querySelectorAll<HTMLElement>('.line > span');
    const rest = s.querySelectorAll<HTMLElement>(
      '.eyebrow, .lead, .tags span, .btn, [data-reveal-item]'
    );

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: s,
        start: 'top 65%',
        end: 'bottom 35%',
        toggleActions: 'play reverse play reverse',
      },
    });

    if (lines.length) {
      tl.from(lines, {
        yPercent: 110,
        rotate: 4,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.08,
      });
    }
    if (rest.length) {
      tl.from(
        rest,
        { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 },
        '<0.15'
      );
    }
  });
}

export { gsap, ScrollTrigger };
