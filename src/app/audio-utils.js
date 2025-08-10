export function normalizeToRms(x, target = 0.035) {
  if (!x || x.length === 0) return x;
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  const cur = Math.sqrt(s / x.length);
  if (!isFinite(cur) || cur < 1e-6) return x;
  const g = target / cur;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    let v = x[i] * g;
    if (v > 1) v = 1;
    else if (v < -1) v = -1;
    y[i] = v;
  }
  return y;
}
