/**
 * Generadores de formas para el sistema de partículas.
 * Cada forma retorna un Float32Array de N*3 posiciones (centradas en el origen).
 * La forma 0 es siempre el texto "REFRESKA" (se usa como forma del hero).
 */

const TAU = Math.PI * 2;
const R = Math.random;
const rnd = (a: number, b: number) => a + R() * (b - a);
const smooth = (t: number) => t * t * (3 - 2 * t);

type Pt = [number, number, number];

function fromFn(N: number, fn: (i: number) => Pt): Float32Array {
  const arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const p = fn(i);
    arr[i * 3] = p[0];
    arr[i * 3 + 1] = p[1];
    arr[i * 3 + 2] = p[2];
  }
  return arr;
}

/** Texto rasterizado en canvas 2D → nube de puntos */
function textShape(str: string, width: number, N: number): Float32Array {
  const c = document.createElement('canvas');
  const W = 1600;
  const H = 400;
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  if (!x) return new Float32Array(N * 3);

  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  let fs = 300;
  x.font = `800 ${fs}px "Inter Variable", Inter, sans-serif`;
  while (x.measureText(str).width > W * 0.94 && fs > 40) {
    fs -= 6;
    x.font = `800 ${fs}px "Inter Variable", Inter, sans-serif`;
  }
  x.fillText(str, W / 2, H / 2);

  const d = x.getImageData(0, 0, W, H).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < H; y += 2) {
    for (let X = 0; X < W; X += 2) {
      if (d[(y * W + X) * 4 + 3] > 128) pts.push([X, y]);
    }
  }
  if (!pts.length) return new Float32Array(N * 3);

  const s = width / W;
  return fromFn(N, () => {
    const p = pts[(R() * pts.length) | 0];
    return [
      (p[0] - W / 2) * s + rnd(-0.02, 0.02),
      -(p[1] - H / 2) * s + rnd(-0.02, 0.02),
      rnd(-0.25, 0.25),
    ];
  });
}

/** Monograma triangular: contorno redondeado + triángulo interior + pata */
function logoShape(N: number): Float32Array {
  const pts = rasterMonogram();
  if (!pts.length) return new Float32Array(N * 3);
  return fromFn(N, () => {
    const p = pts[(R() * pts.length) | 0];
    return [
      p[0] + rnd(-0.015, 0.015),
      p[1] + rnd(-0.015, 0.015),
      rnd(-0.15, 0.15),
    ];
  });
}

/** Dibuja el monograma en canvas (triángulo grueso con esquinas
 *  redondeadas, triángulo interior fino y la "pata" que cruza hacia
 *  abajo con su canal de separación) y mapea los píxeles a mundo */
function rasterMonogram(): Pt[] {
  const S = 420;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const x = c.getContext('2d');
  if (!x) return [];

  x.strokeStyle = '#fff';
  x.fillStyle = '#fff';
  x.lineJoin = 'round';
  x.lineCap = 'round';

  const tri = (cx: number, cy: number, r: number): [number, number][] => {
    const v: [number, number][] = [];
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return v;
  };

  const strokePoly = (v: [number, number][], lw: number) => {
    x.lineWidth = lw;
    x.beginPath();
    x.moveTo(v[0][0], v[0][1]);
    x.lineTo(v[1][0], v[1][1]);
    x.lineTo(v[2][0], v[2][1]);
    x.closePath();
    x.stroke();
  };

  // 1) contorno exterior grueso (lineJoin round = esquinas redondeadas)
  strokePoly(tri(210, 250, 150), 44);
  // 2) triángulo interior fino
  strokePoly(tri(210, 243, 73), 15);
  // 3) canal de separación: borra el contorno alrededor de la pata
  x.globalCompositeOperation = 'destination-out';
  x.lineWidth = 34;
  x.beginPath();
  x.moveTo(210, 292);
  x.lineTo(223, 386);
  x.stroke();
  x.globalCompositeOperation = 'source-over';
  // 4) la pata: conecta el triángulo interior con el exterior
  x.lineWidth = 15;
  x.beginPath();
  x.moveTo(210, 283);
  x.lineTo(223, 386);
  x.stroke();

  const d = x.getImageData(0, 0, S, S).data;
  const px: [number, number][] = [];
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let y = 0; y < S; y += 2) {
    for (let X = 0; X < S; X += 2) {
      if (d[(y * S + X) * 4 + 3] > 128) {
        px.push([X, y]);
        if (X < minX) minX = X;
        if (X > maxX) maxX = X;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!px.length) return [];
  const worldH = 3.6;
  const gh = maxY - minY || 1;
  const s = worldH / gh;
  const ox = (minX + maxX) / 2;
  const oy = (minY + maxY) / 2;
  return px.map(([X, y]) => [(X - ox) * s, -(y - oy) * s, 0]);
}

/** Lata: cilindro con rims y tapa superior */
function canShape(N: number): Float32Array {
  const H = 3.5;
  const Rc = 0.98;
  return fromFn(N, () => {
    const y = rnd(-H / 2, H / 2);
    const t = (y + H / 2) / H;
    let r = Rc;
    if (t < 0.07 || t > 0.93) r = Rc * 0.87; // necking de los rims

    const k = R();
    if (t > 0.975 && k < 0.4) {
      const rr = Math.sqrt(R()) * Rc * 0.87;
      const a = rnd(0, TAU);
      return [Math.cos(a) * rr, H / 2, Math.sin(a) * rr];
    }
    if (t < 0.02 && k < 0.4) {
      const rr = Math.sqrt(R()) * Rc * 0.87;
      const a = rnd(0, TAU);
      return [Math.cos(a) * rr, -H / 2, Math.sin(a) * rr];
    }
    // banda de etiqueta ligeramente más salida
    if (t > 0.28 && t < 0.62 && k < 0.45) r *= 1.02;
    const a = rnd(0, TAU);
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  });
}

/** Ruido de valor 3D (para continentes del globo) */
function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = smooth(fx), v = smooth(fy), w = smooth(fz);
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  const h = (a: number, b: number, c: number) => hash3(ix + a, iy + b, iz + c);
  return L(
    L(L(h(0, 0, 0), h(1, 0, 0), u), L(h(0, 1, 0), h(1, 1, 0), u), v),
    L(L(h(0, 0, 1), h(1, 0, 1), u), L(h(0, 1, 1), h(1, 1, 1), u), v),
    w
  );
}

/** Globo terráqueo con continentes por ruido */
function globeShape(N: number): Float32Array {
  const r = 2.6;
  return fromFn(N, () => {
    const k = R();
    let p: Pt = [0, 0, 0];
    for (let t = 0; t < 20; t++) {
      const u = rnd(-1, 1);
      const a = rnd(0, TAU);
      const s = Math.sqrt(1 - u * u);
      p = [s * Math.cos(a), u, s * Math.sin(a)];
      const n =
        vnoise(p[0] * 2.2 + 5, p[1] * 2.2, p[2] * 2.2) * 0.65 +
        vnoise(p[0] * 5, p[1] * 5, p[2] * 5) * 0.35;
      if (n > 0.52 || k < 0.28) break;
    }
    const rr = k < 0.28 ? r * 0.985 : r;
    return [p[0] * rr, p[1] * rr, p[2] * rr];
  });
}

/** Toroide (nudo toroidal P=2 Q=3) */
function knotShape(N: number): Float32Array {
  const P = 2;
  const Q = 3;
  const scale = 1.15;
  return fromFn(N, () => {
    const t = rnd(0, TAU);
    const rad = scale * (2 + Math.cos(Q * t));
    const c: Pt = [
      rad * Math.cos(P * t),
      rad * Math.sin(P * t),
      scale * -Math.sin(Q * t),
    ];
    const a = rnd(0, TAU);
    const tube = 0.42 * Math.sqrt(R());
    return [
      c[0] + Math.cos(a) * tube,
      c[1] + Math.sin(a) * tube * 0.9,
      c[2] + Math.sin(a + 1) * tube,
    ];
  });
}

/** Nube dispersa usada para la entrada (intro) de las partículas */
export function scatterShape(N: number): Float32Array {
  return fromFn(N, () => {
    const u = rnd(-1, 1);
    const a = rnd(0, TAU);
    const s = Math.sqrt(1 - u * u);
    const r = rnd(6, 22);
    return [s * Math.cos(a) * r, u * r, s * Math.sin(a) * r];
  });
}

export interface ShapeOptions {
  N: number;
  mobile: boolean;
}

/**
 * Devuelve las formas en orden de morph:
 * [0] REFRESKA · [1] escudo/monograma · [2] lata · [3] globo · [4] nudo
 */
export function createShapes({ N, mobile }: ShapeOptions): Float32Array[] {
  return [
    textShape('REFRESKA', mobile ? 6.8 : 10, N),
    logoShape(N),
    canShape(N),
    globeShape(N),
    knotShape(N),
  ];
}
