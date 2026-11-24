import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LOGO_TEXTO, LOGO_ESQUINA } from '../lib/logoPath';

let cache: { texto: THREE.BufferGeometry; esquina: THREE.BufferGeometry; ancho: number } | null = null;

/** logo urbia extruido a partir de los trazos reales del SVG (Manrope 700) */
export function logoGeometria(prof = 34) {
  if (cache) return cache;
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${LOGO_TEXTO}"/></svg>`);
  const shapes: THREE.Shape[] = [];
  data.paths.forEach((p) => shapes.push(...SVGLoader.createShapes(p)));
  const opt = { depth: prof, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.2, bevelSegments: 4, curveSegments: 10 };
  const texto = new THREE.ExtrudeGeometry(shapes, opt);
  // esquina-flecha: trazo de 17 px de M646 76 h57 v57
  const { x, y, w, h, trazo } = LOGO_ESQUINA;
  const s = new THREE.Shape();
  const t = trazo / 2;
  s.moveTo(x, y - t); s.lineTo(x + w + t, y - t); s.lineTo(x + w + t, y + h); s.lineTo(x + w - t, y + h);
  s.lineTo(x + w - t, y + t); s.lineTo(x, y + t); s.closePath();
  const esquina = new THREE.ExtrudeGeometry(s, opt);
  const todo = mergeGeometries([texto.clone(), esquina.clone()]);
  todo.computeBoundingBox();
  const c = new THREE.Vector3(); todo.boundingBox!.getCenter(c);
  const ancho = todo.boundingBox!.max.x - todo.boundingBox!.min.x;
  for (const g of [texto, esquina]) {
    g.translate(-c.x, -c.y, -c.z);
    g.scale(1, -1, 1); // SVG y hacia abajo
    g.computeVertexNormals();
  }
  // corregir caras invertidas por el espejo
  for (const g of [texto, esquina]) {
    const idx = g.index;
    if (idx) { for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a); } }
    else {
      const pos = g.attributes.position as THREE.BufferAttribute; const nor = g.attributes.normal as THREE.BufferAttribute; const uv = g.attributes.uv as THREE.BufferAttribute;
      for (const at of [pos, nor, uv]) { if (!at) continue; const k = at.itemSize; const arr = at.array as Float32Array; for (let i = 0; i < at.count; i += 3) { for (let j = 0; j < k; j++) { const tmp = arr[(i + 1) * k + j]; arr[(i + 1) * k + j] = arr[(i + 2) * k + j]; arr[(i + 2) * k + j] = tmp; } } at.needsUpdate = true; }
    }
    g.computeVertexNormals();
  }
  cache = { texto, esquina, ancho };
  return cache;
}

export function materialIridiscente(color = '#c9ccd6') {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 1, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [200, 900],
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6,
  });
}
