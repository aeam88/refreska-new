/**
 * Escena de partículas Three.js: renderer, cámara, morph por scroll,
 * repulsión de mouse, burst al click y polvo de fondo.
 * Devuelve null si no hay soporte WebGL o el usuario pidió reduced-motion.
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { createShapes, scatterShape } from './shapes';
import { vertexShader, fragmentShader } from './shaders';

export interface ParticlesHandle {
  /** Uniformes expuestos para que el intro (loader) anime uIntro */
  uniforms: Record<string, { value: unknown }>;
  /** Progreso absoluto de morph: 0 = forma hero, N-1 = última forma */
  setTargetProgress: (p: number) => void;
  /** Ráfaga radial (click) */
  burst: () => void;
  /** Resuelve cuando las formas están construidas (fuentes listas) */
  ready: Promise<void>;
  dispose: () => void;
}

export interface SceneOptions {
  /** Desplazamiento lateral por forma (desktop): opuesto al texto */
  sides?: number[];
  /** Desplazamiento vertical por forma */
  ys?: number[];
  /** Rotación [x, y] objetivo por forma */
  rotations?: [number, number][];
}

const DEFAULT_SIDES = [0, -3.4, 3.4, -3.4, 0];
// ys[0]: el texto queda justo debajo del navbar (zona superior)
const DEFAULT_YS = [2.15, 0, 0, 0, 0];
const DEFAULT_ROT: [number, number][] = [
  [0, 0],
  [0.35, -0.5],
  [0.15, 0.6],
  [0.25, -0.4],
  [0.4, 0],
];

export function createParticles(
  canvas: HTMLCanvasElement,
  options: SceneOptions = {}
): ParticlesHandle | null {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return null;

  const mobile = matchMedia('(max-width: 760px)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const N = mobile ? 9000 : 20000;
  const PR = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
  const SHAPE_COUNT = 5;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x06050c, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
  const camZ = () => (innerWidth / innerHeight < 1 ? 17 : 11);
  camera.position.set(0, 0, camZ());

  const U = {
    uProg: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: mobile ? 5.4 : 4.8 },
    uPR: { value: PR },
    uMouse: { value: new THREE.Vector3(99, 99, 0) },
    uBurst: { value: 0 },
    uIntro: { value: 0 },
    uMS: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader,
    fragmentShader,
  });

  let points: THREE.Points | null = null;
  let geometry: THREE.BufferGeometry | null = null;

  const ready = (async () => {
    try {
      await Promise.race([
        document.fonts.load('800 100px "Inter Variable"'),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
      await document.fonts.ready;
    } catch {
      /* sin fuentes: se usa la por defecto */
    }

    const shapes = createShapes({ N, mobile });
    const geo = new THREE.BufferGeometry();
    shapes.forEach((s, i) => geo.setAttribute(`p${i}`, new THREE.BufferAttribute(s, 3)));
    geo.setAttribute('position', new THREE.BufferAttribute(shapes[0], 3));
    geo.setAttribute('pS', new THREE.BufferAttribute(scatterShape(N), 3));

    const rand = new Float32Array(N);
    for (let i = 0; i < N; i++) rand[i] = Math.random();
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

    geometry = geo;
    points = new THREE.Points(geo, material);
    if (mobile) points.scale.setScalar(0.72);
    scene.add(points);
  })();

  // ---- polvo de fondo ----
  const dustGeo = new THREE.BufferGeometry();
  const dustN = mobile ? 600 : 1500;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 60;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
    dustPos[i * 3 + 2] = -Math.random() * 26 - 4;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      size: 0.05,
      color: 0x2ee6c8,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(dust);

  // ---- interacción ----
  const mouseNdc = new THREE.Vector2();
  const mouseTarget = new THREE.Vector3(99, 99, 0);
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  const onPointerMove = (e: PointerEvent) => {
    if (coarse) return;
    mouseNdc.x = (e.clientX / innerWidth) * 2 - 1;
    mouseNdc.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(mouseNdc, camera);
    ray.ray.intersectPlane(plane, mouseTarget);
  };
  const onPointerLeave = () => mouseTarget.set(99, 99, 0);
  const onClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement | null)?.closest('a, button, input, textarea, select, label'))
      return;
    burst();
  };

  addEventListener('pointermove', onPointerMove);
  document.addEventListener('mouseleave', onPointerLeave);
  addEventListener('click', onClick);

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    camera.position.z = camZ();
  };
  addEventListener('resize', onResize);

  // ---- estado del loop ----
  const sides = mobile ? [0, 0, 0, 0, 0] : (options.sides ?? DEFAULT_SIDES);
  const ys = mobile ? [4.8, 3.2, 3.2, 3.2, 3.4] : (options.ys ?? DEFAULT_YS);
  const rot = options.rotations ?? DEFAULT_ROT;

  let target = 0;
  let prog = 0;
  let raf = 0;
  let running = true;
  let last = performance.now();
  const elapsed = () => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    return dt;
  };

  function burst() {
    gsap.fromTo(
      U.uBurst,
      { value: 0 },
      {
        value: 1.4,
        duration: 0.35,
        ease: 'power3.out',
        onComplete: () =>
          gsap.to(U.uBurst, { value: 0, duration: 1.6, ease: 'elastic.out(1, .4)' }),
      }
    );
  }

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = elapsed();
    U.uTime.value += dt;

    prog += (target - prog) * 0.075;
    U.uProg.value = prog;
    U.uMouse.value.lerp(mouseTarget, 0.12);

    if (points) {
      const i = Math.min(SHAPE_COUNT - 2, Math.floor(prog));
      const f = Math.min(1, Math.max(0, prog - i));
      const a = rot[i];
      const b = rot[i + 1];
      const rx = a[0] + (b[0] - a[0]) * f;
      const ry = a[1] + (b[1] - a[1]) * f;

      points.rotation.x += (rx - points.rotation.x) * 0.06;
      points.rotation.y +=
        (ry + mouseNdc.x * 0.25 - points.rotation.y) * 0.06;

      const sx = sides[i] + (sides[i + 1] - sides[i]) * f;
      const sy = ys[i] + (ys[i + 1] - ys[i]) * f;
      points.position.x += (sx - points.position.x) * 0.08;
      points.position.y += (sy - points.position.y) * 0.08;
    }

    dust.rotation.y += dt * 0.01;
    renderer.render(scene, camera);
  }
  loop();

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      last = performance.now();
      loop();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    uniforms: U as unknown as Record<string, { value: unknown }>,
    setTargetProgress: (p) => {
      target = Math.max(0, Math.min(SHAPE_COUNT - 1, p));
    },
    burst,
    ready,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onPointerMove);
      removeEventListener('resize', onResize);
      removeEventListener('click', onClick);
      document.removeEventListener('mouseleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry?.dispose();
      dustGeo.dispose();
      dust.material.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
