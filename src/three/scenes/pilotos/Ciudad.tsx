import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { useSt, smooth, clamp } from '../../../store';
import { presencia } from '../Pilotos';

// Piloto 02 — Ciudad con capas de sistemas que se activan y relacionan entre sí.
// Transición: la cámara se eleva y los edificios se convierten en una red urbana.
const B = 10, C = 4, NB = 11; // manzana, calle, número
const paso = B + C;
const ext = (NB * paso) / 2;
const USOS = ['#F4F3EF', '#304FFE', '#D5FF3F', '#ff7a59'];
export const USOS_NOMBRE = ['Residencial', 'Comercio y servicios', 'Mixto', 'Institucional'];

function rnd(s: number) { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); }

export const relacionesCiudad = { n: 0, detalle: [] as string[] };

export default function Ciudad() {
  const capas = useSt((s) => s.urbano);
  const data = useMemo(() => {
    const ed: { x: number; z: number; w: number; d: number; h: number; uso: number; bloque: number }[] = [];
    const plazas: THREE.Vector3[] = [];
    const rio = (x: number) => Math.sin(x * 0.035) * 22 + 18;
    for (let i = 0; i < NB; i++) for (let j = 0; j < NB; j++) {
      const cx = -ext + i * paso + paso / 2, cz = -ext + j * paso + paso / 2;
      const k = i * NB + j;
      if (Math.abs(cz - rio(cx)) < 9) continue; // el río ocupa estas manzanas
      if (rnd(k * 3.1) > 0.86) { plazas.push(new THREE.Vector3(cx, 0, cz)); continue; }
      const sub = rnd(k) > 0.5 ? 2 : 1;
      for (let a = 0; a < sub; a++) for (let b = 0; b < sub; b++) {
        const w = B / sub - 1;
        const dc = Math.hypot(cx, cz) / ext;
        ed.push({
          x: cx + (a - (sub - 1) / 2) * (B / sub), z: cz + (b - (sub - 1) / 2) * (B / sub), w, d: w,
          h: 3 + Math.pow(rnd(k * 7 + a + b * 3), 2.2) * 34 * (1.2 - dc), uso: Math.floor(rnd(k * 11 + a) * 4), bloque: k,
        });
      }
    }
    const equip = [[-40, -50], [30, -30], [-10, 30], [55, 45], [-60, 20], [10, -70], [65, -60]].map(([x, z]) => new THREE.Vector3(x, 0, z));
    const rioPts: THREE.Vector3[] = [];
    for (let x = -ext - 10; x <= ext + 10; x += 4) rioPts.push(new THREE.Vector3(x, 0.4, rio(x)));
    return { ed, plazas, equip, rioPts, rio };
  }, []);

  // red de calles
  const calles = useMemo(() => {
    const p: number[] = [];
    for (let i = 0; i <= NB; i++) { const v = -ext + i * paso - C / 2 + C / 2; p.push(v, 0.2, -ext, v, 0.2, ext, -ext, 0.2, v, ext, 0.2, v); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
  }, []);
  const inst = useRef<THREE.InstancedMesh>(null!);
  const red = useRef<THREE.LineSegments>(null!);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  // red derivada de los edificios (cada edificio = nodo conectado a vecinos)
  const redEd = useMemo(() => {
    const p: number[] = [];
    data.ed.forEach((e, i) => {
      for (let j = i + 1; j < data.ed.length; j++) { const f = data.ed[j]; const d = Math.hypot(e.x - f.x, e.z - f.z); if (d < 16 && rnd(i * 13 + j) > 0.55) p.push(e.x, e.h * 0.5, e.z, f.x, f.h * 0.5, f.z); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
  }, [data]);

  // flujo de movilidad
  const flujo = useMemo(() => {
    const n = 900; const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const v = Array.from({ length: n }, (_, i) => ({ linea: Math.floor(rnd(i) * (NB + 1)), eje: i % 2, f: rnd(i * 3), vel: 0.03 + rnd(i * 5) * 0.06, dir: rnd(i * 9) > 0.5 ? 1 : -1 }));
    return { g, v, n };
  }, []);

  // relaciones entre sistemas
  const rel = useMemo(() => {
    const p: number[] = []; const det: string[] = [];
    let n = 0;
    if (capas.equipamientos && capas.usos) {
      let k = 0; data.equip.forEach((q) => data.ed.forEach((e) => { if (e.uso === 0 && Math.hypot(e.x - q.x, e.z - q.z) < 24) { p.push(q.x, 6, q.z, e.x, e.h, e.z); k++; } }));
      n += k; det.push(`${k} viviendas dentro del radio de un equipamiento`);
    }
    if (capas.equipamientos && capas.publico) {
      let k = 0; data.equip.forEach((q) => data.plazas.forEach((z) => { if (q.distanceTo(z) < 40) { p.push(q.x, 6, q.z, z.x, 1, z.z); k++; } }));
      n += k; det.push(`${k} enlaces equipamiento – espacio público`);
    }
    if (capas.publico && capas.ecologica) {
      let k = 0; data.plazas.forEach((z) => { const zr = data.rio(z.x); if (Math.abs(zr - z.z) < 45) { p.push(z.x, 1, z.z, z.x, 1, zr); k++; } });
      n += k; det.push(`${k} espacios públicos conectados a la estructura ecológica`);
    }
    if (capas.movilidad && capas.equipamientos) {
      let k = 0; data.equip.forEach((q) => { const sx = Math.round((q.x + ext) / paso) * paso - ext; p.push(q.x, 1, q.z, sx, 1, q.z); k++; });
      n += k; det.push(`${k} equipamientos conectados a la red de movilidad`);
    }
    relacionesCiudad.n = n; relacionesCiudad.detalle = det;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
  }, [capas, data]);

  const equipos = useRef<THREE.Group>(null!);
  const plazasG = useRef<THREE.Group>(null!);
  const rioG = useRef<THREE.Group>(null!);
  const flujoM = useRef<THREE.Points>(null!);
  const alturas = useRef(data.ed.map(() => 0));

  useFrame((_, dt) => {
    const u = smooth(presencia(2));
    const crec = smooth(clamp((u - 0.35) / 0.65));
    const lam = 1 - Math.exp(-dt * 4);
    data.ed.forEach((e, i) => {
      alturas.current[i] += (crec - alturas.current[i]) * lam;
      const h = Math.max(0.05, e.h * alturas.current[i]);
      tmp.position.set(e.x, h / 2, e.z); tmp.scale.set(e.w, h, e.d); tmp.updateMatrix();
      inst.current.setMatrixAt(i, tmp.matrix);
      col.set(capas.usos ? USOS[e.uso] : '#cfd3da');
      inst.current.setColorAt(i, col);
    });
    inst.current.instanceMatrix.needsUpdate = true;
    if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
    (red.current.material as THREE.LineBasicMaterial).opacity = 0.15 + (1 - crec) * 0.75;
    const vis = (g: THREE.Object3D, on: boolean) => { const s = g.scale.y + ((on ? 1 : 0.001) - g.scale.y) * lam; g.scale.set(1, s, 1); g.visible = s > 0.01; };
    vis(equipos.current, capas.equipamientos);
    vis(plazasG.current, capas.publico);
    vis(rioG.current, capas.ecologica);
    flujoM.current.visible = capas.movilidad;
    if (capas.movilidad) {
      const p = flujo.g.attributes.position as THREE.BufferAttribute;
      flujo.v.forEach((v, i) => {
        v.f = (v.f + dt * v.vel * v.dir + 1) % 1;
        const a = -ext + v.linea * paso; const b = -ext + v.f * ext * 2;
        if (v.eje) p.setXYZ(i, a, 0.6, b); else p.setXYZ(i, b, 0.6, a);
      });
      p.needsUpdate = true;
    }
  });

  const rioGeo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(data.rioPts), 200, 3.2, 8, false), [data]);
  const corredor = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(data.rioPts.map((p) => p.clone().setY(0.1))), 200, 8, 4, false), [data]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}><planeGeometry args={[ext * 2 + 30, ext * 2 + 30]} /><meshStandardMaterial color="#0c0e13" roughness={1} /></mesh>
      <lineSegments geometry={calles}><lineBasicMaterial color="#304FFE" transparent opacity={0.55} /></lineSegments>
      <instancedMesh ref={inst} args={[undefined, undefined, data.ed.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} metalness={0.1} />
      </instancedMesh>
      <lineSegments ref={red} geometry={redEd}><lineBasicMaterial color="#D5FF3F" transparent opacity={0.8} /></lineSegments>
      <points ref={flujoM} geometry={flujo.g} frustumCulled={false}>
        <pointsMaterial color="#F4F3EF" size={0.9} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <group ref={equipos}>
        {data.equip.map((q, i) => (
          <group key={i} position={q}>
            <mesh position={[0, 6, 0]}><cylinderGeometry args={[2.2, 2.2, 12, 24]} /><meshStandardMaterial color="#ff7a59" emissive="#ff7a59" emissiveIntensity={0.5} /></mesh>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.3, 0]}><ringGeometry args={[23.4, 24, 64]} /><meshBasicMaterial color="#ff7a59" transparent opacity={0.6} side={THREE.DoubleSide} /></mesh>
          </group>
        ))}
      </group>
      <group ref={plazasG}>
        {data.plazas.map((z, i) => (
          <mesh key={i} position={[z.x, 0.4, z.z]}><boxGeometry args={[B, 0.8, B]} /><meshStandardMaterial color="#9be15d" emissive="#4a7f1f" emissiveIntensity={0.4} /></mesh>
        ))}
      </group>
      <group ref={rioG}>
        <mesh geometry={rioGeo}><meshPhysicalMaterial color="#4FD1C5" emissive="#1a6d66" emissiveIntensity={0.6} roughness={0.1} /></mesh>
        <mesh geometry={corredor} scale={[1, 0.05, 1]}><meshBasicMaterial color="#2f7d3a" transparent opacity={0.5} /></mesh>
      </group>
      <lineSegments geometry={rel}><lineBasicMaterial color="#F4F3EF" transparent opacity={0.85} /></lineSegments>
    </group>
  );
}
