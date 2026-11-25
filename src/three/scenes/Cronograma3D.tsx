import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useRef } from 'react';
import { PILOTOS } from '../../data/contenido';
import { useSt, S } from '../../store';
import { useCrono } from '../../lib/crono';
import { abrirFoco } from '../../lib/nav';
import { MONO, FUENTE_B } from './Red';

// 06 — Línea de tiempo tridimensional. Cada semana es un volumen cuya altura es la carga
// propuesta (sesiones × horas, desde public/config/cronograma.json). Modo comparativo: cuatro pistas.
export default function Cronograma3D() {
  const c = useCrono();
  const piloto = useSt((s) => s.pilotoCrono);
  const comparar = useSt((s) => s.comparar);
  const semana = useSt((s) => s.semana);
  if (!c) return null;
  const pistas = comparar ? PILOTOS : PILOTOS.filter((p) => p.id === piloto);
  return (
    <group>
      <gridHelper args={[140, 28, '#262a33', '#14161b']} />
      {Array.from({ length: c.semanas }).map((_, k) => (
        <Text key={k} font={MONO} fontSize={1.6} color={semana === k ? '#C7FF27' : '#898D84'} position={[(k - (c.semanas - 1) / 2) * 16, 0.1, 22]} rotation-x={-Math.PI / 2} anchorX="center">
          {'SEMANA ' + String(k + 1).padStart(2, '0')}
        </Text>
      ))}
      {pistas.map((p, j) => (
        <group key={p.id} position={[0, 0, comparar ? (j - 1.5) * 9 : 0]}>
          {comparar && <Text font={FUENTE_B} fontSize={1.6} color={p.color} anchorX="right" position={[-(c.semanas / 2) * 16 - 2, 1, 0]}>{p.nombre}</Text>}
          {Array.from({ length: c.semanas }).map((_, k) => {
            const cfg = c.pilotos[p.id];
            const h = cfg.sesionesPorSemana[k] * cfg.duracionHoras[k] * 1.4;
            return <Bloque key={k} k={k} x={(k - (c.semanas - 1) / 2) * 16} h={h} color={p.color} sesiones={cfg.sesionesPorSemana[k]} ancho={comparar ? 6 : 11} sel={semana === k} />;
          })}
        </group>
      ))}
    </group>
  );
}

function Bloque({ k, x, h, color, sesiones, ancho, sel }: { k: number; x: number; h: number; color: string; sesiones: number; ancho: number; sel: boolean }) {
  const g = useRef<THREE.Group>(null!);
  const ap = useRef(0);
  useFrame((_, dt) => {
    ap.current = Math.min(1, ap.current + dt * 1.2);
    const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, ap.current * 1.6 - k * 0.12)), 3);
    g.current.scale.y = Math.max(0.001, e);
    g.current.position.y = sel ? 2 + Math.sin(S.t * 2) * 0.4 : 0;
  });
  return (
    <group ref={g} position={[x, 0, 0]}>
      {Array.from({ length: sesiones }).map((_, s) => (
        <mesh key={s} position={[0, (h / sesiones) * (s + 0.5), 0]}
          onClick={(e) => { e.stopPropagation(); abrirFoco('semana', k, { semana: k }); }}
          onPointerOver={() => (document.body.dataset.cursor = 'activo')}
          onPointerOut={() => (document.body.dataset.cursor = '')}
        >
          <boxGeometry args={[ancho, h / sesiones - 0.5, ancho * 0.6]} />
          <meshPhysicalMaterial color={sel ? color : '#1a1d24'} emissive={color} emissiveIntensity={sel ? 0.5 : 0.08} roughness={0.25} clearcoat={1} transparent opacity={0.95} />
        </mesh>
      ))}
      <lineSegments position={[0, h / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(ancho, h, ancho * 0.6)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
}
