import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { S, localDe, useSt, smooth, clamp } from '../../store';
import { logoGeometria, materialIridiscente } from '../logoGeo';
import { empezar } from '../../ui/acciones';

// 00 — el logo urbia gira suspendido en el espacio, rodeado por un anillo y un tubo de luz.
export default function Intro() {
  const { texto, esquina } = useMemo(() => logoGeometria(), []);
  const mat = useMemo(() => materialIridiscente('#d8dbe4'), []);
  const matEsq = useMemo(() => { const m = materialIridiscente('#D5FF3F'); m.metalness = 0.6; m.emissive = new THREE.Color('#D5FF3F'); m.emissiveIntensity = 0.35; return m; }, []);
  const g = useRef<THREE.Group>(null!);
  const anillo = useRef<THREE.Mesh>(null!);
  const [hover, setHover] = useState(false);
  const tubo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(t) * 19, Math.sin(2 * t) * 9 - 13, Math.cos(t) * 7 - 4));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.22, 12, true);
  }, []);
  const ap = useRef(0);
  useFrame((_, dt) => {
    const lp = localDe(0);
    const red = useSt.getState().reducido;
    ap.current = Math.min(1, ap.current + dt * 0.45);
    const a = smooth(ap.current);
    const s = 0.042 * (0.55 + 0.45 * a) * (hover ? 1.06 : 1);
    g.current.scale.lerp(new THREE.Vector3(s, s, s), 0.12);
    const giro = red ? 0.08 : 0.45 + clamp(lp) * 2.2 + Math.abs(S.vel) * 0.3;
    g.current.rotation.y += dt * giro;
    g.current.rotation.x += ((-S.my * 0.25) - g.current.rotation.x) * 0.06;
    g.current.position.y = Math.sin(S.t * 0.8) * 0.6 + (1 - a) * -6;
    anillo.current.rotation.z += dt * 0.15;
    anillo.current.rotation.x = Math.PI / 2 + Math.sin(S.t * 0.3) * 0.25 + S.my * 0.2;
    anillo.current.rotation.y = S.mx * 0.3;
    const sc = 1 + clamp(lp) * 0.7;
    anillo.current.scale.setScalar(sc * a);
  });
  return (
    <group>
      <group
        ref={g}
        onClick={(e) => { e.stopPropagation(); empezar('presentacion'); }}
        onPointerOver={() => { setHover(true); document.body.dataset.cursor = 'activo'; }}
        onPointerOut={() => { setHover(false); document.body.dataset.cursor = ''; }}
      >
        <mesh geometry={texto} material={mat} />
        <mesh geometry={esquina} material={matEsq} />
      </group>
      <mesh ref={anillo} position={[0, 0, -4]}>
        <torusGeometry args={[17, 0.55, 32, 200]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh geometry={tubo}>
        <meshPhysicalMaterial color="#9fb0ff" metalness={0.2} roughness={0.05} transmission={0.6} thickness={1} iridescence={1} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
