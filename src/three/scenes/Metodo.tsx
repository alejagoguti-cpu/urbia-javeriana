import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { METODO } from '../../data/contenido';
import { S, localDe, useSt, clamp, smooth } from '../../store';
import { abrirFoco } from '../../lib/nav';
import { FUENTE_B, MONO } from './Red';

// 04 — Modelo arquitectónico explotado en cinco capas metodológicas.
// El scroll separa las capas; un clic acerca la cámara, aparta las demás y revela su contenido.
function contenidoCapa(i: number) {
  const g = new THREE.Group();
  const lin = (pts: number[][], color: string, op = 1) => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p[0], 0.7, p[1])));
    g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: op })));
  };
  const W = 40, D = 26;
  if (i === 0) { // necesidad: planta con zonas de duda marcadas
    const s: number[][] = [];
    for (let x = -W / 2; x <= W / 2; x += 5) s.push([x, -D / 2], [x, D / 2]);
    for (let z = -D / 2; z <= D / 2; z += 6.5) s.push([-W / 2, z], [W / 2, z]);
    lin(s, '#8C929C', 0.5);
    [[-8, -3], [10, 6]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.8, 48), new THREE.MeshBasicMaterial({ color: '#D5FF3F', side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.8, z); g.add(r); });
  }
  if (i === 1) { // tecnología: nodos de herramientas
    for (let k = 0; k < 24; k++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), new THREE.MeshStandardMaterial({ color: k % 5 === 0 ? '#D5FF3F' : '#304FFE', emissive: k % 5 === 0 ? '#D5FF3F' : '#304FFE', emissiveIntensity: 0.4 })); m.position.set((Math.random() - 0.5) * W * 0.9, 1.6, (Math.random() - 0.5) * D * 0.9); g.add(m); }
  }
  if (i === 2) { // ejercicio guiado: recorrido paso a paso
    const pts: number[][] = []; let x = -W / 2 + 3, z = -D / 2 + 3;
    for (let k = 0; k < 10; k++) { const nx = x + 3.6, nz = k % 2 ? -D / 2 + 3 : D / 2 - 3; pts.push([x, z], [nx, nz]); x = nx; z = nz; }
    lin(pts, '#F4F3EF', 0.9);
  }
  if (i === 3) { // aplicación al proyecto: volumetría
    for (let k = 0; k < 18; k++) { const h = 2 + Math.random() * 7; const m = new THREE.Mesh(new THREE.BoxGeometry(4, h, 4), new THREE.MeshPhysicalMaterial({ color: '#F4F3EF', roughness: 0.4, transparent: true, opacity: 0.85 })); m.position.set(-W / 2 + 4 + (k % 6) * 6.4, h / 2 + 0.6, -D / 2 + 5 + Math.floor(k / 6) * 8); g.add(m); }
  }
  if (i === 4) { // evaluar y documentar: nube de puntos de registro
    const n = 1400; const p = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) p.set([(Math.random() - 0.5) * W, 0.8 + Math.random() * 2.5 * Math.random(), (Math.random() - 0.5) * D], k * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#D5FF3F', size: 0.25 })));
  }
  return g;
}

export default function Metodo() {
  const capa = useSt((s) => s.capa);
  const grupos = useRef<THREE.Group[]>([]);
  const contenidos = useMemo(() => METODO.capas.map((_, i) => contenidoCapa(i)), []);
  useFrame(() => {
    const lp = clamp(localDe(4));
    const sep = 2 + smooth(lp * 1.4) * 12;
    grupos.current.forEach((g, i) => {
      if (!g) return;
      let y = (i - 2) * sep;
      let x = 0, rx = 0;
      if (capa !== null) {
        y = (i - 2) * 14 + (i < capa ? -14 : i > capa ? 14 : 0);
        x = i === capa ? 6 : -10;
        rx = i === capa ? 0.25 : 0;
      }
      g.position.y += (y - g.position.y) * 0.08;
      g.position.x += (x - g.position.x) * 0.08;
      g.rotation.x += (rx - g.rotation.x) * 0.08;
      g.rotation.y += (S.mx * 0.15 + (capa === null ? Math.sin(S.t * 0.3 + i) * 0.04 : 0) - g.rotation.y) * 0.05;
      const op = capa === null || capa === i ? 1 : 0.18;
      g.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material & { opacity: number }; if (m && 'opacity' in m) { m.transparent = true; m.opacity += ((op * ((m as any).userData?.base ?? 1)) - m.opacity) * 0.1; } });
    });
  });
  return (
    <group>
      {METODO.capas.map((c, i) => (
        <group key={i} ref={(r) => { if (r) grupos.current[i] = r; }}>
          <mesh
            onClick={(e) => { e.stopPropagation(); abrirFoco('capa', i, { capa: i }); }}
            onPointerOver={() => (document.body.dataset.cursor = 'activo')}
            onPointerOut={() => (document.body.dataset.cursor = '')}
          >
            <boxGeometry args={[42, 1.2, 28]} />
            <meshPhysicalMaterial color={i === capa ? '#1a2366' : '#111319'} metalness={0.3} roughness={0.35} clearcoat={1} transparent opacity={1} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(42, 1.2, 28)]} />
            <lineBasicMaterial color={i === capa ? '#D5FF3F' : '#8C929C'} transparent opacity={1} />
          </lineSegments>
          <primitive object={contenidos[i]} />
          <Text font={MONO} fontSize={1.3} position={[-22.5, 0.2, 14.5]} color="#D5FF3F" anchorX="right" anchorY="middle">{c.n}</Text>
          <Text font={FUENTE_B} fontSize={1.5} position={[22.5, 1.5, 14.2]} color="#F4F3EF" anchorX="right" anchorY="bottom" maxWidth={30} textAlign="right">{c.t}</Text>
        </group>
      ))}
    </group>
  );
}
