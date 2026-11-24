import opentype from 'opentype.js';
import fs from 'fs';
const buf = fs.readFileSync('tools/manrope-latin-700-normal.woff');
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const size = 185, ls = -12; let x = 70; const y = 213;
let d = '';
for (const ch of 'urbia') {
  const g = font.charToGlyph(ch);
  d += g.getPath(x, y, size).toPathData(2);
  x += g.advanceWidth * size / font.unitsPerEm + ls;
}
const out = `// generado por tools/logo.mjs desde urbia-logo-monocromo.svg (Manrope 700)
export const LOGO_TEXTO = ${JSON.stringify(d)};
// esquina-flecha del logo: M646 76h57v57, trazo 17
export const LOGO_ESQUINA = { x: 646, y: 76, w: 57, h: 57, trazo: 17 };
export const LOGO_ANCHO_TEXTO = ${x.toFixed(1)};
`;
fs.writeFileSync('src/lib/logoPath.ts', out);
fs.writeFileSync('public-logo-test.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 320"><rect width="900" height="320" fill="#fff"/><path d="${d}" fill="#171916"/><path d="M646 76h57v57" stroke="#171916" stroke-width="17" fill="none"/></svg>`);
console.log('ok', x, d.length);
