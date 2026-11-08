/**
 * Intro con loader: espera a que las partículas estén listas (mínimo
 * un tiempo visible para que no parpadee), hace fade out del loader,
 * entra la nube de partículas (uIntro) y revela el hero.
 */
import gsap from 'gsap';

export interface IntroOptions {
  loaderEl: HTMLElement;
  /** Resuelve cuando las partículas están listas (fuentes + shapes) */
  ready: Promise<void>;
  uniforms: Record<string, { value: unknown }>;
  /** Animación de entrada del hero (líneas + elementos) */
  onReveal?: () => void;
}

const MIN_VISIBLE_MS = 1400;

export async function runIntro({
  loaderEl,
  ready,
  uniforms,
  onReveal,
}: IntroOptions) {
  const start = performance.now();

  await ready;

  const elapsed = performance.now() - start;
  if (elapsed < MIN_VISIBLE_MS) {
    await new Promise((r) => setTimeout(r, MIN_VISIBLE_MS - elapsed));
  }

  gsap.to(loaderEl, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => loaderEl.remove(),
  });
  // Las partículas se arman MIENTRAS el loader hace fade (sin hueco muerto)
  gsap.to(uniforms.uIntro, {
    value: 1,
    duration: 2.4,
    ease: 'power3.out',
  });
  onReveal?.();
}
