import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useEffect, useRef } from 'react';
import { materialIridiscente } from '../three/logoGeo';
import { useSt } from '../store';

// Íconos 3D cromados: mismo material y luces de marca que el logo del inicio.
// Un único WebGLRenderer compartido modela cada ícono como tubos de metal y copia
// el cuadro a un <canvas> 2D dentro de cada botón. En reposo oscilan; al pasar el
// cursor giran una vuelta completa.

export const ICONOS = {
  sonido: 'M4 9h4l5-4v14l-5-4H4z M16 8c1.5 1.2 1.5 6.8 0 8 M19 5c3 2.5 3 11.5 0 14',
  silencio: 'M4 9h4l5-4v14l-5-4H4z M16 9l5 6 M21 9l-5 6',
  reducido: 'M20 12a8 8 0 1 1-16 0a8 8 0 1 1 16 0 M8 12h8',
  pantalla: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
  menu: 'M4 8h16 M4 16h10',
  cerrar: 'M6 6l12 12 M18 6L6 18',
  izq: 'M14 6l-6 6 6 6',
  der: 'M10 6l6 6-6 6',
  diag: 'M7 17L17 7 M8 7h9v9',
  play: 'M8 5l11 7-11 7z',
  orbita: 'M20 12a8 8 0 1 1-16 0a8 8 0 1 1 16 0 M15.5 8.5l-2 5-5 2 2-5z',
  bajar: 'M12 4v12 M6 11l6 6 6-6 M5 20h14',
  inicio: 'M4 11l8-7 8 7 M6 9.5V20h12V9.5',
  esquina: 'M5 5h14v14',
} as const;
export type NombreIcono = keyof typeof ICONOS;

const RES = 112; // px del render (se escala al tamaño CSS)
let motor: {
  r: THREE.WebGLRenderer; esc: THREE.Scene; cam: THREE.PerspectiveCamera; mat: THREE.MeshPhysicalMaterial;
  matLima: THREE.MeshPhysicalMaterial; geos: Map<string, THREE.BufferGeometry>; malla: THREE.Mesh;
} | null = null;

function entornoMarca(r: THREE.WebGLRenderer) {
  // equivalente a los Lightformer de World.tsx, horneado una vez con PMREM
  const s = new THREE.Scene();
  s.background = new THREE.Color('#0E0F0D');
  const panel = (color: string, k: number, pos: [number, number, number], rot: [number, number, number], esc: [number, number]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); m.scale.set(esc[0], esc[1], 1); s.add(m);
  };
  panel('#F5F3EB', 6, [0, 6, -9], [0, 0, 0], [12, 2]);
  panel('#F5F3EB', 3, [0, 9, 0], [Math.PI / 2, 0, 0], [10, 10]);
  panel('#A99BCB', 2.4, [-8, 1, 3], [0, Math.PI / 2, 0], [10, 3]);
  panel('#C7FF27', 1.8, [8, -2, 2], [0, -Math.PI / 2, 0], [8, 1.5]);
  panel('#F5F3EB', 2.6, [0, 0, 10], [0, Math.PI, 0], [20, 1]);
  panel('#E36C4B', 1.2, [0, -6, 6], [Math.PI / 2, 0, 0], [5, 5]);
  const pm = new THREE.PMREMGenerator(r);
  const env = pm.fromScene(s, 0.02).texture;
  pm.dispose();
  return env;
}

function iniciarMotor() {
  if (motor) return motor;
  const c = document.createElement('canvas'); c.width = c.height = RES;
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(RES, RES, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.35;
  const esc = new THREE.Scene();
  esc.environment = entornoMarca(r);
  const luz = new THREE.DirectionalLight('#F5F3EB', 1.2); luz.position.set(3, 5, 6); esc.add(luz);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100); cam.position.set(0, 0, 4.1);
  const mat = materialIridiscente('#e2e4ea'); mat.roughness = 0.12; mat.envMapIntensity = 2;
  const matLima = materialIridiscente('#C7FF27'); matLima.metalness = 0.75; matLima.emissive = new THREE.Color('#C7FF27'); matLima.emissiveIntensity = 0.25;
  const malla = new THREE.Mesh(new THREE.BufferGeometry(), mat); esc.add(malla);
  motor = { r, esc, cam, mat, matLima, geos: new Map(), malla };
  return motor;
}

/** convierte el trazo SVG (24×24) en tubos de metal con uniones redondas */
function geometria(nombre: NombreIcono) {
  const m = iniciarMotor();
  const hit = m.geos.get(nombre); if (hit) return hit;
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${ICONOS[nombre]}"/></svg>`);
  const partes: THREE.BufferGeometry[] = [];
  const R = 1.55, k = 1 / 12; // radio del tubo en unidades del viewBox
  const v3 = (p: THREE.Vector2) => new THREE.Vector3((p.x - 12) * k, -(p.y - 12) * k, 0);
  data.paths.forEach((path) => path.subPaths.forEach((sp) => {
    const pts = sp.getPoints(10).map(v3);
    const lim: THREE.Vector3[] = [];
    pts.forEach((p) => { if (!lim.length || lim[lim.length - 1].distanceTo(p) > 1e-4) lim.push(p); });
    if (sp.autoClose && lim.length > 2 && lim[0].distanceTo(lim[lim.length - 1]) > 1e-4) lim.push(lim[0].clone());
    if (lim.length < 2) return;
    const curva = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < lim.length - 1; i++) curva.add(new THREE.LineCurve3(lim[i], lim[i + 1]));
    partes.push(new THREE.TubeGeometry(curva as any, Math.max(8, (lim.length - 1) * 6), R * k, 14, false));
    lim.forEach((p) => { const e = new THREE.SphereGeometry(R * k, 16, 12); e.translate(p.x, p.y, p.z); partes.push(e); });
  }));
  const g = mergeGeometries(partes.map((p) => { const q = p.index ? p.toNonIndexed() : p; q.deleteAttribute('uv'); return q; }));
  g.computeVertexNormals();
  m.geos.set(nombre, g);
  return g;
}

type Inst = { cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D; nombre: NombreIcono; lima: boolean; fase: number; giro: number; hover: boolean; t0: number };
const instancias = new Set<Inst>();
let raf = 0, ultimo = 0;
const reducido = () => useSt.getState().reducido || matchMedia('(prefers-reduced-motion: reduce)').matches;

function dibujar(i: Inst, t: number) {
  const m = iniciarMotor();
  m.malla.geometry = geometria(i.nombre);
  m.malla.material = i.lima ? m.matLima : m.mat;
  const red = reducido();
  const apar = Math.min(1, (t - i.t0) / 700);
  const osc = red ? 0.35 : Math.sin(t * 0.0011 + i.fase) * 0.42;
  m.malla.rotation.set(-0.28 + (red ? 0 : Math.cos(t * 0.0009 + i.fase) * 0.12), osc + i.giro, 0);
  const s = (0.82 + 0.18 * (1 - Math.pow(1 - apar, 3))) * (i.hover ? 1.08 : 1);
  m.malla.scale.setScalar(s);
  m.r.render(m.esc, m.cam);
  i.ctx.clearRect(0, 0, i.cv.width, i.cv.height);
  i.ctx.drawImage(m.r.domElement, 0, 0, i.cv.width, i.cv.height);
}

function bucle(t: number) {
  raf = requestAnimationFrame(bucle);
  if (t - ultimo < 33) return; // ~30 fps bastan para íconos
  const dt = Math.min(0.1, (t - ultimo) / 1000); ultimo = t;
  if (document.hidden) return;
  instancias.forEach((i) => {
    if (!i.cv.isConnected || i.cv.offsetParent === null) return;
    if (i.hover) i.giro += dt * 7; // vuelta completa rápida al pasar el cursor
    else if (i.giro !== 0) { const resto = i.giro % (Math.PI * 2); i.giro = resto > 0.05 && resto < Math.PI * 2 - 0.05 ? i.giro + dt * 6 : 0; }
    dibujar(i, t);
  });
}

export default function IconoCromo({ n, lima = false, className = '' }: { n: NombreIcono; lima?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null!);
  const inst = useRef<Inst | null>(null);
  useEffect(() => {
    const cv = ref.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const css = cv.getBoundingClientRect().width || 22;
    cv.width = cv.height = Math.round(css * dpr * 2); // margen para la rotación
    const i: Inst = { cv, ctx: cv.getContext('2d')!, nombre: n, lima, fase: Math.random() * 6, giro: 0, hover: false, t0: performance.now() };
    inst.current = i; instancias.add(i);
    const btn = cv.closest('button, a') as HTMLElement | null;
    const on = () => { i.hover = true; }, off = () => { i.hover = false; };
    btn?.addEventListener('pointerenter', on); btn?.addEventListener('pointerleave', off);
    btn?.addEventListener('focus', on); btn?.addEventListener('blur', off);
    try { dibujar(i, performance.now()); } catch { /* sin WebGL: queda vacío */ }
    if (!raf) raf = requestAnimationFrame(bucle);
    return () => {
      instancias.delete(i);
      btn?.removeEventListener('pointerenter', on); btn?.removeEventListener('pointerleave', off);
      btn?.removeEventListener('focus', on); btn?.removeEventListener('blur', off);
    };
  }, []);
  useEffect(() => { if (inst.current) { inst.current.nombre = n; inst.current.lima = lima; inst.current.giro = inst.current.giro || 0.06; } }, [n, lima]);
  return <canvas ref={ref} className={'cromo ' + className} aria-hidden="true" />;
}
