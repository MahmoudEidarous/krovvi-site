// Krovvi's mark for the pictures the site's files hold (favicon, home screen icons, the share image): the Heavy k, the
// owner's pick of 31 October 2026 on catch8 design/krovvi-new-look-2026-10-28/the-k.html, in the same strokes as the
// app's icon (icon-gen.cjs kAt) and the site's own components/look/brand.tsx. Units: baseline 78.3, x-height 32, the
// top of the k 15.5, the Heavy stroke 14.3.
const B = 78.3;
const X = 32;
const T = 15.5;
const W = 14.3;
const f = (n) => (+n).toFixed(2);
const stroke = (d, w, c) => `<path fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;

function kAt(x, w, c) {
  const r = w / 2;
  const s = x + r;
  const J = [s, 68];
  const A = [s + 26.55, X + r];
  const lt = 0.48;
  const L0 = [J[0] + lt * (A[0] - J[0]), J[1] + lt * (A[1] - J[1])];
  const L1 = [s + 27.6, B - r];
  return {
    svg: stroke(`M${f(s)} ${f(T + r)}V${f(B - r)}`, w, c) + stroke(`M${f(J[0])} ${f(J[1])}L${f(A[0])} ${f(A[1])}M${f(L0[0])} ${f(L0[1])}L${f(L1[0])} ${f(L1[1])}`, w * 0.96, c),
    right: L1[0] + r,
  };
}

/** The k in a square of `size`, `share` percent of it tall, optically centred as on the logo page (50.8, 48.4). */
export function kIn(size, share, color) {
  const k = kAt(0, W, color);
  const sc = (share * size) / 100 / (B - T);
  const tx = (50.8 * size) / 100 - (k.right / 2) * sc;
  const ty = (48.4 * size) / 100 - ((T + B) / 2) * sc;
  return `<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(sc)})">${k.svg}</g>`;
}

/** The app icon's tile: Krovvi's purple lit from the top left, as icon-gen.cjs draws it; rounded or full bleed. */
export function tile(size, rounded) {
  return `<defs><radialGradient id="g" cx="30%" cy="0%" r="120%" fx="30%" fy="0%" gradientTransform="scale(1 .75)"><stop offset="0" stop-color="#978BFF"/><stop offset=".42" stop-color="#7B6BFF"/><stop offset="1" stop-color="#5B49F2"/></radialGradient>
  <filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${f(size * 0.011)}" stdDeviation="${f(size * 0.013)}" flood-color="#160C5C" flood-opacity=".26"/></filter></defs>
  <rect width="${size}" height="${size}" ${rounded ? `rx="${f(size * 0.225)}"` : ""} fill="url(#g)"/>`;
}

/** The whole icon: the white k on the tile, its soft shadow under it at sizes big enough to show one. */
export function icon(size, rounded) {
  const k = kIn(size, 60, "#FFFFFF");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${tile(size, rounded)}${size >= 64 ? `<g filter="url(#s)">${k}</g>` : k}</svg>`;
}
