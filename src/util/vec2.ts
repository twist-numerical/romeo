export type vec2 = [number, number];

export function length(a: vec2): number {
  return Math.hypot(a[0], a[1]);
}

export function multiplyScalar(a: vec2, f: number): vec2 {
  return [a[0] * f, a[1] * f];
}

export function normalized(a: vec2): vec2 {
  return multiplyScalar(a, 1 / length(a));
}

export function dot(a: vec2, b: vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function sum(...a: vec2[]): vec2 {
  const r = [0, 0] as vec2;
  a.forEach(([x, y]) => {
    r[0] += x;
    r[1] += y;
  });
  return r;
}

export function negate(a: vec2): vec2 {
  return [-a[0], -a[1]];
}
