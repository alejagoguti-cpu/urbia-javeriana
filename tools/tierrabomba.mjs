// Relieve REAL de Tierra Bomba a partir de los datos de la tesis tesis_tercer_corte:
// teselas Terrarium z12 (1187-1188, 1929-1930) y silueta OSM de la isla (ventana z15 de 1445x2578 px, ~4,7 m/px).
import fs from 'node:fs';
import { leerPNG } from './_png.mjs';
const MOS = { x0: 9502, y0: 15426 }, WIN = { left: 231, top: 1734, w: 1445, h: 2578 };
const mk = leerPNG('tools/tb/isla_mascara_osm.png');
const dem = new Float32Array(512 * 512);
for (const [tx, ty] of [[1187, 1929], [1188, 1929], [1187, 1930], [1188, 1930]]) {
  const t = leerPNG(`tools/tb/${tx}_${ty}.png`); const c = t.canales;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const i = (y * 256 + x) * c; const r = t.datos[i], g = t.datos[i + 1], b = t.datos[i + 2];
    dem[((ty - 1929) * 256 + y) * 512 + (tx - 1187) * 256 + x] = r * 256 + g + b / 256 - 32768;
  }
}
const muestra = (x, y) => { // bilineal
  x = Math.max(0, Math.min(510.999, x)); y = Math.max(0, Math.min(510.999, y));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const a = dem[y0 * 512 + x0], b = dem[y0 * 512 + x0 + 1], c = dem[(y0 + 1) * 512 + x0], d = dem[(y0 + 1) * 512 + x0 + 1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
};
const W = 180, H = Math.round(W * WIN.h / WIN.w);
const alt = new Int16Array(W * H), mas = new Uint8Array(W * H);
let maxH = 0;
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
  const u = (i + 0.5) / W, v = (j + 0.5) / H;
  const gx = MOS.x0 * 256 + WIN.left + u * WIN.w, gy = MOS.y0 * 256 + WIN.top + v * WIN.h; // píxel z15
  const x12 = gx / 8 - 1187 * 256, y12 = gy / 8 - 1929 * 256;
  const isla = mk.datos[Math.floor(v * mk.h) * mk.w + Math.floor(u * mk.w)] > 127 ? 1 : 0;
  let h = muestra(x12, y12);
  h = isla ? Math.max(0.4, h) : Math.min(-0.5, h);
  if (isla) maxH = Math.max(maxH, h);
  alt[j * W + i] = Math.round(h * 10); mas[j * W + i] = isla;
}
const mPorCelda = (WIN.w / W) * 4.7;
const head = new Float32Array([W, H, mPorCelda, maxH]);
fs.mkdirSync('public/datos', { recursive: true });
fs.writeFileSync('public/datos/tierrabomba.bin', Buffer.concat([Buffer.from(head.buffer), Buffer.from(alt.buffer), Buffer.from(mas.buffer)]));
console.log({ W, H, mPorCelda: mPorCelda.toFixed(1), maxH: maxH.toFixed(1), isla: mas.reduce((a, b) => a + b, 0) });
