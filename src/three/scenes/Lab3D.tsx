import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { S, useSt } from '../../store';

// 07 — Laboratorio: torre paramétrica real. Pisos, giro y ahusamiento se controlan desde la
// interfaz; arrastrar sobre ella la hace girar. Es la demo "Modelos arquitectónicos 3D".
export default function Lab3D() {
  const inst = useRef<THREE.InstancedMesh>(null!);
  const bordes = useRef<THREE.InstancedMesh>(null!);
  const g = useRef<THREE.Group>(null!);
  const MAX = 60;
  const o = useMemo(() => new THREE.Object3D(), []);
  const arr = useRef({ on: false, x: 0 });
  const cur = useRef(Array.from({ length: MAX }, () => 0));
  useFrame((_, dt) => {
    const { pisos, giro, ahusar } = S.torre;
    const demo = useSt.getState().labDemo;
    for (let i = 0; i < MAX; i++) {
      const on = i < pisos ? 1 : 0;
      cur.current[i] += (on - cur.current[i]) * (1 - Math.exp(-dt * 8));
      const t = i / Math.max(1, pisos - 1);
      const s = (1 - ahusar * t) * Math.max(0.001, cur.current[i]);
      o.position.set(0, i * 1.25, 0);
      o.rotation.set(0, giro * t * Math.PI, 0);
      o.scale.set(14 * s, 0.35, 14 * s);
      o.updateMatrix();
      inst.current.setMatrixAt(i, o.matrix);
      o.scale.set(14 * s, 1.25, 14 * s); o.position.y += 0.6; o.updateMatrix();
      bordes.current.setMatrixAt(i, o.matrix);
    }
    inst.current.instanceMatrix.needsUpdate = true;
    bordes.current.instanceMatrix.needsUpdate = true;
    if (!arr.current.on) S.torre.rotY += dt * 0.12;
    g.current.rotation.y += (S.torre.rotY - g.current.rotation.y) * 0.15;
    g.current.visible = true;
    g.current.position.x = demo === 'modelo' ? 0 : -6;
  });
  return (
    <group>
      <group
        ref={g}
        onPointerDown={(e) => { e.stopPropagation(); arr.current = { on: true, x: e.clientX }; (e.target as any)?.setPointerCapture?.(e.pointerId); document.body.dataset.cursor = 'arrastre'; }}
        onPointerUp={() => { arr.current.on = false; document.body.dataset.cursor = ''; }}
        onPointerLeave={() => { arr.current.on = false; }}
        onPointerMove={(e) => { if (arr.current.on) { S.torre.rotY += (e.clientX - arr.current.x) * 0.01; arr.current.x = e.clientX; } }}
      >
        <instancedMesh ref={inst} args={[undefined, undefined, MAX]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color="#F5F3EB" roughness={0.3} clearcoat={1} />
        </instancedMesh>
        <instancedMesh ref={bordes} args={[undefined, undefined, MAX]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color="#A99BCB" transparent opacity={0.22} roughness={0.05} metalness={0.2} depthWrite={false} />
        </instancedMesh>
        <mesh position={[0, 40, 0]} visible={false}><boxGeometry args={[22, 80, 22]} /></mesh>
      </group>
      <mesh rotation-x={-Math.PI / 2}><ringGeometry args={[12, 12.3, 96]} /><meshBasicMaterial color="#C7FF27" /></mesh>
      <gridHelper args={[80, 20, '#262a33', '#14161b']} />
    </group>
  );
}
