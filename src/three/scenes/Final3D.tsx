import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { PILOTOS } from '../../data/contenido';
import { S } from '../../store';
import { logoGeometria, materialIridiscente } from '../logoGeo';

// 10 — Los cuatro universos se integran en un solo ecosistema alrededor del logo.
export default function Final3D() {
  const { texto, esquina } = useMemo(() => logoGeometria(), []);
  const mat = useMemo(() => materialIridiscente('#d8dbe4'), []);
  const lim = useMemo(() => { const m = materialIridiscente('#C7FF27'); m.emissive = new THREE.Color('#C7FF27'); m.emissiveIntensity = 0.35; return m; }, []);
  const logo = useRef<THREE.Group>(null!);
  const orb = useRef<THREE.Group>(null!);
  const red = useMemo(() => {
    const p: number[] = [];
    const pts = Array.from({ length: 4 }, (_, i) => { const a = (i / 4) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 46, 0, Math.sin(a) * 46); });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) p.push(...pts[i].toArray(), ...pts[j].toArray());
    pts.forEach((q) => p.push(0, 0, 0, ...q.toArray()));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
  }, []);
  useFrame((_, dt) => {
    logo.current.rotation.y += dt * 0.35;
    orb.current.rotation.y -= dt * 0.06;
  });
  return (
    <group>
      <group ref={logo} scale={0.05} position={[0, 4, 0]}>
        <mesh geometry={texto} material={mat} />
        <mesh geometry={esquina} material={lim} />
      </group>
      <group ref={orb}>
        <lineSegments geometry={red}><lineBasicMaterial color="#A99BCB" transparent opacity={0.6} /></lineSegments>
        {PILOTOS.map((p, i) => {
          const a = (i / 4) * Math.PI * 2;
          return <group key={p.id} position={[Math.cos(a) * 46, 0, Math.sin(a) * 46]}><Mini i={i} color={p.color} /></group>;
        })}
      </group>
    </group>
  );
}

function Mini({ i, color }: { i: number; color: string }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { g.current.rotation.y += dt * 0.3; g.current.position.y = Math.sin(S.t + i) * 1.5; });
  const hijos = useMemo(() => {
    const out: JSX.Element[] = [];
    if (i === 0) for (let x = 0; x < 4; x++) for (let z = 0; z < 4; z++) if (x === 0 || z === 0 || x === 3 || z === 3) for (let y = 0; y < 1 + ((x + z) % 3); y++) out.push(<mesh key={`${x}${y}${z}`} position={[(x - 1.5) * 2.2, y * 2.2 + 1.1, (z - 1.5) * 2.2]}><boxGeometry args={[2, 2, 2]} /><meshStandardMaterial color="#F5F3EB" /></mesh>);
    if (i === 1) for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) { const h = 1 + ((x * 7 + z * 3) % 6) * 1.3; out.push(<mesh key={`${x}${z}`} position={[(x - 2) * 2.6, h / 2, (z - 2) * 2.6]}><boxGeometry args={[1.8, h, 1.8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>); }
    if (i === 2) {
      const n = 1500; const p = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { const t = Math.random(); p.set([(Math.random() - 0.5) * 8, t * 10 * (Math.random() > 0.8 ? 1.5 : 1), (Math.random() - 0.5) * 12 * (1 - t * 0.3)], k * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
      out.push(<points key="p" geometry={g}><pointsMaterial color="#F5F3EB" size={0.18} /></points>);
    }
    if (i === 3) {
      const g = new THREE.PlaneGeometry(16, 12, 40, 30); g.rotateX(-Math.PI / 2);
      const pp = g.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < pp.count; k++) { const x = pp.getX(k), z = pp.getZ(k); pp.setY(k, Math.max(0, (1 - (x * x) / 64 - (z * z) / 36)) * 4 + Math.sin(x) * 0.2); }
      g.computeVertexNormals();
      out.push(<mesh key="t" geometry={g}><meshStandardMaterial color={color} wireframe /></mesh>);
    }
    return out;
  }, [i, color]);
  return <group ref={g}>{hijos}</group>;
}
