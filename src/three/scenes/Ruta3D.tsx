import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useRef } from 'react';
import { RUTA } from '../../data/contenido';
import { S, localDe, useSt, clamp } from '../../store';
import { FUENTE_B, MONO } from './Red';

// 09 — La ruta de implementación como un edificio que se construye piso a piso.
// El scroll avanza la obra; un clic en un piso lo selecciona.
const H = 6;
export default function Ruta3D() {
  const paso = useSt((s) => s.rutaPaso);
  useFrame(() => {
    const lp = clamp(localDe(9));
    const p = Math.min(RUTA.length - 1, Math.floor(lp * RUTA.length * 0.999));
    const st = useSt.getState();
    if (!st.foco && p !== st.rutaPaso && lp > 0 && lp < 1) st.set({ rutaPaso: p });
  });
  return (
    <group>
      {RUTA.map((r, i) => <Piso key={i} i={i} visible={i <= paso} sel={i === paso} t={r.t} />)}
      <Grua alto={(paso + 2) * H} />
      <gridHelper args={[90, 18, '#262a33', '#14161b']} />
    </group>
  );
}

function Piso({ i, visible, sel, t }: { i: number; visible: boolean; sel: boolean; t: string }) {
  const g = useRef<THREE.Group>(null!);
  const k = useRef(0);
  useFrame((_, dt) => {
    k.current += ((visible ? 1 : 0) - k.current) * (1 - Math.exp(-dt * 4));
    g.current.scale.set(1, Math.max(0.001, k.current), 1);
    g.current.position.y = i * H + (1 - k.current) * 14;
    g.current.visible = k.current > 0.01;
  });
  const cols: [number, number][] = [];
  for (const x of [-12, -4, 4, 12]) for (const z of [-7, 7]) cols.push([x, z]);
  const ancho = 30 - i * 1.6;
  return (
    <group ref={g}>
      <group onClick={(e) => { e.stopPropagation(); useSt.getState().set({ rutaPaso: i }); }}
        onPointerOver={() => (document.body.dataset.cursor = 'activo')}
        onPointerOut={() => (document.body.dataset.cursor = '')}>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[ancho, 0.6, 18]} /><meshPhysicalMaterial color={sel ? '#304FFE' : '#1a1d24'} emissive="#304FFE" emissiveIntensity={sel ? 0.5 : 0.05} clearcoat={1} roughness={0.3} /></mesh>
        {cols.map(([x, z], j) => (
          <mesh key={j} position={[x * (ancho / 30), H / 2, z]}><boxGeometry args={[0.7, H, 0.7]} /><meshStandardMaterial color="#F4F3EF" /></mesh>
        ))}
        <lineSegments position={[0, H / 2, 0]}><edgesGeometry args={[new THREE.BoxGeometry(ancho, H, 18)]} /><lineBasicMaterial color={sel ? '#D5FF3F' : '#3a3f4a'} /></lineSegments>
      </group>
      <Text font={MONO} fontSize={1.2} color="#D5FF3F" position={[ancho / 2 + 1.5, 1.5, 9]} anchorX="left">{String(i + 1).padStart(2, '0')}</Text>
      <Text font={FUENTE_B} fontSize={1.5} color="#F4F3EF" position={[ancho / 2 + 4, 1.5, 9]} anchorX="left" maxWidth={24}>{t}</Text>
    </group>
  );
}

function Grua({ alto }: { alto: number }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    g.current.position.y += (alto - g.current.position.y) * 0.05;
    g.current.rotation.y = Math.sin(S.t * 0.3) * 0.5;
  });
  return (
    <group position={[-24, 0, -8]}>
      <mesh position={[0, 30, 0]}><boxGeometry args={[0.4, 60, 0.4]} /><meshBasicMaterial color="#5a606b" wireframe /></mesh>
      <group ref={g}>
        <mesh position={[14, 0, 0]}><boxGeometry args={[34, 0.3, 0.3]} /><meshBasicMaterial color="#8C929C" /></mesh>
        <mesh position={[24, -6, 0]}><boxGeometry args={[0.08, 12, 0.08]} /><meshBasicMaterial color="#F4F3EF" /></mesh>
      </group>
    </group>
  );
}
