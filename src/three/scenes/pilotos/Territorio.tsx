import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { useSt, smooth, clamp, esMovil } from '../../../store';
import { presencia } from '../Pilotos';

// Piloto 04 — Tierra Bomba con relieve y silueta REALES, tomados de la tesis de las autoras
// (tesis_tercer_corte: teselas Terrarium z12 y línea de costa de OpenStreetMap; ver tools/tierrabomba.mjs).
// El relieve Terrarium tiene varios metros de error vertical y se exagera para leerlo.
// Las estrategias son ILUSTRATIVAS: transforman el territorio visualmente, sin resultados cuantitativos.
// Transición: red → curvas de nivel → topografía → paisaje.
export const W = 84, D = 150; // unidades de escena (≈6,8 km × 12,1 km)
const HMAX = 7;
function alea(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

type TBData = { w: number; h: number; m: number; maxH: number; alt: Int16Array; mas: Uint8Array };
let TB: TBData | null = null;
let promesa: Promise<void> | null = null;
function useTB() {
  if (TB) return TB;
  if (!promesa) promesa = fetch('./datos/tierrabomba.bin').then((r) => r.arrayBuffer()).then((buf) => {
    const head = new Float32Array(buf, 0, 4); const w = head[0], h = head[1];
    const alt = new Int16Array(buf, 16, w * h); const mas = new Uint8Array(buf, 16 + w * h * 2, w * h);
    TB = { w, h, m: head[2], maxH: head[3], alt, mas };
  });
  throw promesa;
}

/** altura en unidades de escena (exagerada) en (x, z); negativa en el mar */
export function altura(x: number, z: number) {
  if (!TB) return -1;
  const u = (x / W + 0.5) * TB.w - 0.5, v = (z / D + 0.5) * TB.h - 0.5;
  const i = Math.max(0, Math.min(TB.w - 2, Math.floor(u))), j = Math.max(0, Math.min(TB.h - 2, Math.floor(v)));
  const fx = Math.max(0, Math.min(1, u - i)), fy = Math.max(0, Math.min(1, v - j));
  const g = (a: number, b: number) => TB!.alt[b * TB!.w + a] / 10;
  const m = (g(i, j) * (1 - fx) + g(i + 1, j) * fx) * (1 - fy) + (g(i, j + 1) * (1 - fx) + g(i + 1, j + 1) * fx) * fy;
  return m >= 0 ? (m / TB.maxH) * HMAX : Math.max(-4, m * 0.25);
}

const vert = /* glsl */ `
attribute float aH;
uniform float uU; uniform float uClima;
varying float vH; varying vec3 vP; varying vec3 vN;
void main(){
  float k = smoothstep(0.3, 0.75, uU);
  vec3 p = position; p.y = aH * k;
  vH = aH; vP = p; vN = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
}`;
const frag = /* glsl */ `
uniform float uU; uniform float uClima; uniform float uT; uniform float uAgua;
varying float vH; varying vec3 vP;
void main(){
  vec3 dx = dFdx(vP), dy = dFdy(vP); vec3 n = normalize(cross(dx, dy));
  float l = 0.35 + 0.75*max(0.0, dot(n, normalize(vec3(0.4,0.9,0.3))));
  // etapa 1: red digital
  vec2 g = abs(fract(vP.xz/6.0 - 0.5) - 0.5) / fwidth(vP.xz/6.0);
  float red = 1.0 - min(min(g.x, g.y), 1.0);
  // etapa 2: curvas de nivel
  float cv = abs(fract(vH*1.2) - 0.5) / fwidth(vH*1.2);
  float curva = (1.0 - min(cv, 1.0)) * step(0.0, vH);
  // etapa 3: paisaje
  vec3 arena = vec3(0.78,0.72,0.58), verde = vec3(0.22,0.36,0.2), seco = vec3(0.46,0.45,0.32), fondo = vec3(0.05,0.12,0.18);
  vec3 paisaje = vH < 0.0 ? mix(fondo, vec3(0.1,0.3,0.35), clamp(1.0+vH*0.3,0.0,1.0)) : vH < 0.3 ? arena : mix(verde, seco, smoothstep(3.0, 7.0, vH));
  paisaje *= l;
  // condiciones ambientales (ilustrativo): calor en zonas bajas expuestas
  float calor = uClima * smoothstep(2.0, 0.2, vH) * step(0.0, vH);
  paisaje = mix(paisaje, vec3(1.0,0.36,0.2), calor*0.55);
  float s1 = smoothstep(0.0, 0.35, uU), s2 = smoothstep(0.35, 0.7, uU), s3 = smoothstep(0.65, 1.0, uU);
  vec3 c = vec3(0.04);
  c = mix(c, vec3(0.19,0.31,1.0)*1.4, red * s1 * (1.0 - s2*0.8));
  c = mix(c, vec3(0.84,1.0,0.25), curva * s2 * (1.0 - s3*0.65));
  c = mix(c, paisaje, s3 * (1.0 - curva*0.3));
  // en el paisaje el mar lo dibuja el plano de agua: el terreno sumergido se desvanece
  float a = vH < 0.0 ? 1.0 - s3 : 1.0;
  if (a < 0.02) discard;
  gl_FragColor = vec4(c, a);
}`;

function dispersar(n: number, cond: (x: number, z: number, h: number) => boolean, seed: number) {
  const r = alea(seed); const out: THREE.Vector3[] = []; let t = 0;
  while (out.length < n && t < n * 60) { t++; const x = (r() - 0.5) * W, z = (r() - 0.5) * D; const h = altura(x, z); if (cond(x, z, h)) out.push(new THREE.Vector3(x, h, z)); }
  return out;
}

function Instancias({ pts, geo, color, s = 1 }: { pts: THREE.Vector3[]; geo: THREE.BufferGeometry; color: string; s?: number }) {
    const ref = useRef<THREE.InstancedMesh>(null!);
    useEffect(() => {
      if (!ref.current) return; const o = new THREE.Object3D();
      pts.forEach((p, i) => { o.position.copy(p); const k = s * (0.6 + ((i * 37) % 10) / 12); o.scale.set(k, k, k); o.rotation.y = i; o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix); });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [pts]);
    return <instancedMesh ref={ref} args={[geo, undefined, pts.length]} frustumCulled={false}><meshStandardMaterial color={color} roughness={0.9} flatShading /></instancedMesh>;
  };

export default function Territorio() {
  useTB();
  const est = useSt((s) => s.terr);
  const geo = useMemo(() => {
    const seg = esMovil ? 110 : 170;
    const g = new THREE.PlaneGeometry(W, D, seg, Math.round(seg * D / W)); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute; const h = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) h[i] = altura(p.getX(i), p.getZ(i));
    g.setAttribute('aH', new THREE.BufferAttribute(h, 1));
    return g;
  }, []);
  const uni = useMemo(() => ({ uU: { value: 0 }, uClima: { value: 0 }, uT: { value: 0 }, uAgua: { value: 0 } }), []);
  const pueblos = useMemo(() => [new THREE.Vector3(-42, 0, 22), new THREE.Vector3(6, 0, -2), new THREE.Vector3(44, 0, -24)].map((p) => p.setY(Math.max(0.3, altura(p.x, p.z)))), []);
  const capas = useMemo(() => {
    const manglar = dispersar(esMovil ? 300 : 700, (_x, _z, h) => h > 0.02 && h < 0.45, 3);
    const bosque = dispersar(esMovil ? 250 : 600, (_x, _z, h) => h > 1.5 && h < 7, 5);
    const reforest = dispersar(esMovil ? 300 : 700, (_x, _z, h) => h > 0.6 && h < 3.5, 9);
    const solar = dispersar(90, (x, z, h) => h > 0.8 && h < 3 && pueblos.some((p) => Math.hypot(p.x - x, p.z - z) < 16), 11);
    const agua = pueblos.map((p, i) => new THREE.Vector3(p.x + 7, Math.max(0.3, altura(p.x + 7, p.z - 5)), p.z - 5 + i));
    const casas = pueblos.flatMap((p, k) => dispersar(22, (x, z, h) => h > 0.2 && h < 3 && Math.hypot(p.x - x, p.z - z) < 7, 20 + k));
    return { manglar, bosque, reforest, solar, agua, casas };
  }, [pueblos]);
  const caminos = useMemo(() => {
    const curvas = [[0, 1], [1, 2]].map(([a, b]) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 30; i++) { const p = pueblos[a].clone().lerp(pueblos[b], i / 30); p.x += Math.sin((i / 30) * Math.PI) * 4; p.y = Math.max(0.3, altura(p.x, p.z)) + 0.4; pts.push(p); }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.45, 6, false);
    });
    return curvas;
  }, [pueblos]);
  const g = {
    veg: useRef<THREE.Group>(null!), ref: useRef<THREE.Group>(null!), sol: useRef<THREE.Group>(null!), agua: useRef<THREE.Group>(null!),
    inf: useRef<THREE.Group>(null!), eq: useRef<THREE.Group>(null!), base: useRef<THREE.Group>(null!),
  };
  const mar = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    const u = smooth(presencia(4));
    uni.uU.value += (u - uni.uU.value) * 0.05;
    uni.uT.value += dt;
    uni.uClima.value += ((est.clima ? 1 : 0) - uni.uClima.value) * 0.06;
    const lam = 1 - Math.exp(-dt * 4);
    const paisaje = smooth(clamp((uni.uU.value - 0.7) / 0.3));
    const sc = (r: React.MutableRefObject<THREE.Group>, on: boolean) => { const o = r.current; const s = o.scale.y + ((on ? 1 : 0.001) - o.scale.y) * lam; o.scale.set(1, s, 1); o.visible = s > 0.01; };
    sc(g.base, paisaje > 0.05);
    sc(g.veg, est.vegetacion);
    sc(g.ref, est.vegetacion);
    sc(g.sol, est.energia);
    sc(g.agua, est.agua);
    sc(g.inf, est.infraestructura);
    sc(g.eq, est.equipamientos);
    const mm = mar.current.material as THREE.MeshPhysicalMaterial;
    mm.opacity = 0.75 * paisaje;
    mar.current.position.y = -0.2 + Math.sin(uni.uT.value * 0.6) * 0.08;
  });
  const casaG = useMemo(() => new THREE.BoxGeometry(1.4, 1.2, 1.4).translate(0, 0.6, 0), []);
  const panelG = useMemo(() => new THREE.BoxGeometry(2.4, 0.12, 1.4).rotateX(-0.35).translate(0, 0.9, 0), []);
  const arbol = useMemo(() => new THREE.ConeGeometry(0.9, 2.6, 6).translate(0, 1.3, 0), []);
  const copa = useMemo(() => new THREE.IcosahedronGeometry(0.8, 0), []);
  return (
    <group>
      <mesh geometry={geo} frustumCulled={false}>
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uni} transparent extensions={{ derivatives: true } as any} />
      </mesh>
      <mesh ref={mar} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[D * 0.62, 96]} />
        <meshPhysicalMaterial color="#1c5f6e" transparent opacity={0} roughness={0.08} metalness={0.2} clearcoat={1} />
      </mesh>
      <group ref={g.base}>
        <Instancias pts={capas.manglar.slice(0, 160)} geo={copa} color="#2f5d3a" s={1.1} />
        <Instancias pts={capas.bosque.slice(0, 160)} geo={arbol} color="#3c5a34" />
        <Instancias pts={capas.casas} geo={casaG} color="#e9e1d3" />
      </group>
      <group ref={g.veg}><Instancias pts={capas.manglar} geo={copa} color="#2e7a45" s={1.3} /></group>
      <group ref={g.ref}><Instancias pts={capas.reforest} geo={arbol} color="#4f8f3a" s={1.1} /></group>
      <group ref={g.sol}>
        <Instancias pts={capas.solar} geo={panelG} color="#A99BCB" />
      </group>
      <group ref={g.agua}>
        {capas.agua.map((p, i) => (
          <group key={i} position={p}>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.25, 0]}><circleGeometry args={[3.2, 32]} /><meshPhysicalMaterial color="#6FA3AF" emissive="#1d6f69" emissiveIntensity={0.6} roughness={0.05} /></mesh>
            <mesh position={[0, 0.3, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[3.2, 3.7, 32]} /><meshBasicMaterial color="#F5F3EB" side={THREE.DoubleSide} /></mesh>
          </group>
        ))}
      </group>
      <group ref={g.inf}>
        {caminos.map((c, i) => <mesh key={i} geometry={c}><meshStandardMaterial color="#F5F3EB" emissive="#898D84" emissiveIntensity={0.4} /></mesh>)}
      </group>
      <group ref={g.eq}>
        {pueblos.map((p, i) => (
          <group key={i} position={p}>
            <mesh position={[3, 2.2, 3]}><boxGeometry args={[5, 4.4, 3.6]} /><meshStandardMaterial color="#E36C4B" emissive="#E36C4B" emissiveIntensity={0.35} /></mesh>
            <mesh position={[3, 4.6, 3]} rotation-z={0.25}><boxGeometry args={[6, 0.3, 4.6]} /><meshStandardMaterial color="#F5F3EB" /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
