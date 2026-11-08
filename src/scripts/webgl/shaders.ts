/**
 * Shaders del sistema de partículas:
 * morph entre formas con stagger, sway en tránsito, entrada desde scatter,
 * repulsión por mouse, burst al click y colores por acento.
 */

export const vertexShader = /* glsl */ `
attribute vec3 p0;
attribute vec3 p1;
attribute vec3 p2;
attribute vec3 p3;
attribute vec3 p4;
attribute vec3 pS;
attribute float aRand;

uniform float uProg, uTime, uSize, uPR, uBurst, uIntro, uMS;
uniform vec3 uMouse;

varying vec3 vCol;
varying float vA;

vec3 pick(float i) {
  if (i < .5) return p0;
  if (i < 1.5) return p1;
  if (i < 2.5) return p2;
  if (i < 3.5) return p3;
  return p4;
}

// Signed distance a un triángulo equilátero (punta arriba), centrado en 0
float sdTriangle(vec2 p) {
  float k = 1.7320508;
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  float seg = clamp(floor(uProg), 0., 4.);
  float t = clamp(uProg - seg, 0., 1.);
  float tt = smoothstep(0., 1., clamp((t - aRand * .35) / .65, 0., 1.));

  vec3 a = pick(seg);
  vec3 b = pick(min(seg + 1., 4.));
  vec3 pos = mix(a, b, tt);

  // sway mientras las partículas viajan entre formas
  float mid = sin(tt * 3.14159);
  vec3 sw = vec3(
    sin(uTime * .9 + aRand * 40. + pos.y * 1.3),
    cos(uTime * .7 + aRand * 31. + pos.x * 1.1),
    sin(uTime * .6 + aRand * 23. + pos.z)
  );
  pos += sw * (.035 + mid * 1.6);

  // entrada desde la nube dispersa
  float it = smoothstep(0., 1., clamp((uIntro - aRand * .4) / .6, 0., 1.));
  pos = mix(pS, pos, it);

  vec4 wp = modelMatrix * vec4(pos, 1.);

  // repulsión bajo el cursor, con máscara en forma de triángulo
  vec2 d = wp.xy - uMouse.xy;
  float tMask = sdTriangle(d / (1.1 * uMS));
  float push = smoothstep(0., 1., clamp(-tMask / 0.3, 0., 1.));
  wp.xy += normalize(d + 1e-4) * push * 1.1;
  wp.z += push * .8;

  // ráfaga radial al hacer click
  wp.xyz += normalize(wp.xyz + 1e-4) * uBurst * (.6 + aRand * 4.);

  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPR * (.5 + aRand * .9) * (10. / -mv.z) * (1. + push * 1.4);

  // degradado turquesa → lima con chispas blanco cálido
  float g = clamp(wp.x * .11 + .5 + sin(uTime * .25 + wp.y * .2) * .18, 0., 1.);
  vCol = mix(vec3(.18, .902, .784), vec3(.722, .949, .29), g);
  vCol = mix(vCol, vec3(1., .953, .839), step(.94, aRand));
  vCol += push * .6;
  vA = (.7 + .6 * aRand) * (.35 + .65 * it);
}
`;

export const fragmentShader = /* glsl */ `
varying vec3 vCol;
varying float vA;

void main() {
  float d = length(gl_PointCoord - .5);
  if (d > .5) discard;
  float a = pow(1. - d * 2., 1.8);
  gl_FragColor = vec4(vCol * a * vA * 1.35, a * vA);
}
`;
