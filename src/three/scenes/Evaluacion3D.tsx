import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useRef } from 'react';
import { INDICADORES } from '../../data/contenido';
import { S, useSt } from '../../store';
import { MONO } from './Red';

// 08 — Ocho instrumentos de medición en anillo. El indicador seleccionado se eleva y se
// convierte en un "medidor" vacío: se muestra cómo se medirá, no un resultado.
export default function Evaluacion3D() {
  const ind = useSt((s) => s.indicador);
  return (
    <group position={[22, 0, 0]}>
      {INDICADORES.map((d, i) => <Medidor key={d.id} i={i} sel={ind === d.id} id={d.id} />)}
      <mesh rotation-x={-Math.PI / 2}><ringGeometry args={[21.6, 22, 128]} /><meshBasicMaterial color="#304FFE" /></mesh>
    </group>
  );
}

function Medidor({ i, sel, id }: { i: number; sel: boolean; id: string }) {
  const g = useRef<THREE.Group>(null!);
  const anillo = useRef<THREE.Mesh>(null!);
  const a = (i / INDICADORES.length) * Math.PI * 2;
  useFrame((_, dt) => {
    const y = sel ? 9 : 0;
    g.current.position.y += (y - g.current.position.y) * 0.08;
    g.current.rotation.y += dt * (sel ? 0.8 : 0.15);
    anillo.current.scale.setScalar(1 + (sel ? Math.sin(S.t * 3) * 0.06 + 0.4 : 0));
  });
  return (
    <group position={[Math.cos(a) * 22, 0, Math.sin(a) * 22]}>
      <group ref={g}
        onClick={(e) => { e.stopPropagation(); useSt.getState().set({ indicador: id }); }}
        onPointerOver={() => (document.body.dataset.cursor = 'activo')}
        onPointerOut={() => (document.body.dataset.cursor = '')}
      >
        <mesh ref={anillo}><torusGeometry args={[3, 0.18, 12, 64]} /><meshStandardMaterial color={sel ? '#D5FF3F' : '#8C929C'} emissive={sel ? '#D5FF3F' : '#000'} emissiveIntensity={0.6} /></mesh>
        <mesh><torusGeometry args={[3, 0.05, 6, 64, Math.PI * 2]} /><meshBasicMaterial color="#F4F3EF" wireframe /></mesh>
        <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[2.2, 2.2, 0.2, 48, 1, true]} /><meshBasicMaterial color={sel ? '#304FFE' : '#1a1d24'} side={THREE.DoubleSide} transparent opacity={0.6} /></mesh>
      </group>
      <Text font={MONO} fontSize={1.1} color={sel ? '#D5FF3F' : '#8C929C'} position={[0, -1.6, 0]} anchorX="center">{String(i + 1).padStart(2, '0')}</Text>
    </group>
  );
}
