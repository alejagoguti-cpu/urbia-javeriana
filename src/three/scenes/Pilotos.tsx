import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { PILOTOS } from '../../data/contenido';
import { S, localDe, subPilotos, clamp } from '../../store';
import { UNIVERSO } from '../anclas';
import { irEscena } from '../../lib/nav';
import { FUENTE_B, MONO } from './Red';
import Habitat from './pilotos/Habitat';
import Ciudad from './pilotos/Ciudad';
import Patrimonio from './pilotos/Patrimonio';
import Territorio from './pilotos/Territorio';

/** presencia de un universo según la parada actual (1 cuando la cámara está ahí) */
export function presencia(k: number) {
  const s = subPilotos(clamp(localDe(5)));
  if (s <= 0.02 || s >= 4.98) return 1; // en el hub y el panorama se ven todos
  return clamp(1.3 - Math.abs(s - k) * 1.3);
}

// 05 — Cuatro universos conectados en un mismo espacio, unidos por haces de luz al hub.
export default function Pilotos() {
  const hub = useRef<THREE.Group>(null!);
  const haces = useMemo(() => {
    return UNIVERSO.map((u) => {
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(u.x * 0.5, 40, u.z * 0.5), u.clone());
      return new THREE.TubeGeometry(c, 80, 0.18, 6, false);
    });
  }, []);
  const flujo = useMemo(() => {
    const curvas = UNIVERSO.map((u) => new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(u.x * 0.5, 40, u.z * 0.5), u.clone()));
    const n = 400; const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return { curvas, g, n, f: Array.from({ length: n }, () => Math.random()) };
  }, []);
  useFrame((_, dt) => {
    hub.current.rotation.y += dt * 0.2;
    const p = flujo.g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < flujo.n; i++) {
      flujo.f[i] = (flujo.f[i] + dt * 0.08) % 1;
      flujo.curvas[i % 4].getPoint(flujo.f[i], v);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
  });
  return (
    <group>
      <group ref={hub}>
        <mesh><icosahedronGeometry args={[6, 1]} /><meshBasicMaterial color="#C7FF27" wireframe /></mesh>
        <mesh><icosahedronGeometry args={[3, 4]} /><meshPhysicalMaterial color="#F5F3EB" metalness={1} roughness={0.1} iridescence={1} /></mesh>
      </group>
      {haces.map((g, i) => (
        <mesh key={i} geometry={g}><meshBasicMaterial color={PILOTOS[i].color} transparent opacity={0.35} /></mesh>
      ))}
      <points geometry={flujo.g} frustumCulled={false}>
        <pointsMaterial color="#F5F3EB" size={0.7} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {PILOTOS.map((p, i) => (
        <group key={p.id} position={UNIVERSO[i]}>
          <Etiqueta k={i + 1} />
        </group>
      ))}
      <group position={UNIVERSO[0]}><Habitat /></group>
      <group position={UNIVERSO[1]}><Ciudad /></group>
      <group position={UNIVERSO[2]}><Patrimonio /></group>
      <group position={UNIVERSO[3]}><Territorio /></group>
    </group>
  );
}

function Etiqueta({ k }: { k: number }) {
  const p = PILOTOS[k - 1];
  const g = useRef<THREE.Group>(null!);
  useFrame(({ camera }) => {
    const s = subPilotos(clamp(localDe(5)));
    const enHub = s < 0.5 || s > 4.5;
    g.current.quaternion.copy(camera.quaternion);
    const target = enHub ? 1 : 0.001;
    g.current.scale.setScalar(g.current.scale.x + (target - g.current.scale.x) * 0.1);
    g.current.position.y = 46 + Math.sin(S.t + k) * 1.5;
  });
  return (
    <group ref={g}>
      <mesh
        onClick={(e) => { e.stopPropagation(); irEscena(5, k); }}
        onPointerOver={() => (document.body.dataset.cursor = 'activo')}
        onPointerOut={() => (document.body.dataset.cursor = '')}
        position={[0, 2, -0.1]}
      >
        <planeGeometry args={[44, 14]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Text font={MONO} fontSize={2.4} color={p.color} anchorX="center" position={[0, 6, 0]}>{'PILOTO ' + p.n}</Text>
      <Text font={FUENTE_B} fontSize={4.6} color="#F5F3EB" anchorX="center" anchorY="top" position={[0, 3.6, 0]} maxWidth={60} textAlign="center">{p.nombre}</Text>
    </group>
  );
}
