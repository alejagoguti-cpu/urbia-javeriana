import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { useSt, smooth } from '../../../store';
import { presencia } from '../Pilotos';

// Piloto 01 — Conjunto habitacional modular. Ocupación, orientación, hora solar y
// configuración transforman el modelo. Transición: el modelo se descompone en módulos.
const M = 3.2; // módulo
const MAXP = 7;

function slots(config: string) {
  const s: { x: number; z: number; w: number }[] = [];
  if (config === 'barra') { for (let i = 0; i < 12; i++) s.push({ x: (i - 5.5) * M, z: 0, w: 1 - Math.abs(i - 5.5) / 12 }); for (let i = 0; i < 12; i++) s.push({ x: (i - 5.5) * M, z: -M * 3, w: 0.6 }); }
  if (config === 'claustro') { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (i === 0 || j === 0 || i === 7 || j === 7) s.push({ x: (i - 3.5) * M, z: (j - 3.5) * M, w: (i + j) / 14 }); }
  if (config === 'escalonado') { for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) s.push({ x: (i - 2.5) * M * 1.05 + j * 1.6, z: (j - 1.5) * M * 1.4, w: 1 - i / 6 }); }
  return s;
}

export default function Habitat() {
  const { config, ocupacion, orientacion, hora } = useSt((s) => s.habitat);
  const inst = useRef<THREE.InstancedMesh>(null!);
  const grupo = useRef<THREE.Group>(null!);
  const sol = useRef<THREE.DirectionalLight>(null!);
  const solM = useRef<THREE.Mesh>(null!);
  const MAX = 64 * MAXP;
  const data = useMemo(() => {
    const ss = slots(config);
    const items: { p: THREE.Vector3; r: THREE.Vector3; on: boolean }[] = [];
    ss.forEach((s, k) => {
      const pisos = Math.max(1, Math.round(1 + ocupacion * (MAXP - 1) * (config === 'escalonado' ? s.w : 0.5 + 0.5 * Math.sin(k * 1.7) * 0.5 + 0.5 * s.w)));
      for (let f = 0; f < MAXP; f++) {
        const on = f < pisos;
        items.push({
          p: new THREE.Vector3(s.x, f * M + M / 2, s.z),
          r: new THREE.Vector3(s.x * 2.2 + (Math.random() - 0.5) * 30, 20 + Math.random() * 40 + f * 4, s.z * 2.2 + (Math.random() - 0.5) * 30),
          on,
        });
      }
    });
    return items;
  }, [config, ocupacion]);
  const cur = useMemo(() => Array.from({ length: MAX }, () => ({ p: new THREE.Vector3(0, -50, 0), s: 0 })), []);
  
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    const u = smooth(presencia(1));
    const red = useSt.getState().reducido;
    const lam = red ? 1 : 1 - Math.exp(-dt * 5);
    for (let i = 0; i < MAX; i++) {
      const d = data[i];
      const c = cur[i];
      let tgt: THREE.Vector3, sc: number;
      if (!d) { tgt = c.p; sc = 0; }
      else {
        tgt = d.r.clone().lerp(d.p, u);
        sc = d.on ? 1 : 0;
      }
      c.p.lerp(tgt, lam); c.s += (sc - c.s) * lam;
      tmp.position.copy(c.p);
      tmp.rotation.set((1 - u) * (i % 7) * 0.5, (1 - u) * (i % 5) * 0.6, 0);
      const k = Math.max(0.0001, c.s) * (0.86 + 0.14 * u);
      tmp.scale.set(k * M * 0.94, k * M * 0.94, k * M * 0.94);
      tmp.updateMatrix();
      inst.current.setMatrixAt(i, tmp.matrix);
    }
    inst.current.instanceMatrix.needsUpdate = true;
    grupo.current.rotation.y += ((orientacion * Math.PI) / 180 - grupo.current.rotation.y) * 0.08;
    // sol: arco de 6 a 18 h
    const a = ((hora - 6) / 12) * Math.PI;
    const pos = new THREE.Vector3(Math.cos(a) * 60, Math.sin(a) * 50 + 4, -20);
    sol.current.position.copy(pos);
    solM.current.position.copy(pos);
    const luz = Math.max(0.05, Math.sin(a));
    sol.current.intensity = 2.4 * luz;
    sol.current.color.setHSL(0.09 + 0.05 * luz, 0.6, 0.55 + 0.3 * luz);
  });
  return (
    <group>
      <directionalLight ref={sol} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={200} target-position={[0, 0, 0]} />
      <mesh ref={solM}><sphereGeometry args={[2.2, 24, 24]} /><meshBasicMaterial color="#ffd27a" /></mesh>
      <group ref={grupo}>
        <instancedMesh ref={inst} args={[undefined, undefined, MAX]} castShadow receiveShadow frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#F5F3EB" roughness={0.55} metalness={0.05} />
        </instancedMesh>
        <lineSegments position={[0, 0.05, 0]} rotation-x={-Math.PI / 2}>
          <edgesGeometry args={[new THREE.PlaneGeometry(36, 36, 1, 1)]} />
          <lineBasicMaterial color="#C7FF27" />
        </lineSegments>
        <mesh position={[0, 0.2, 21]}><coneGeometry args={[1.2, 3, 3]} /><meshBasicMaterial color="#C7FF27" /></mesh>
      </group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[46, 64]} />
        <meshStandardMaterial color="#14161b" roughness={0.95} />
      </mesh>
      <ArcoSolar />
    </group>
  );
}

function ArcoSolar() {
  const linea = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI; pts.push(new THREE.Vector3(Math.cos(a) * 60, Math.sin(a) * 50 + 4, -20)); }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#898D84', transparent: true, opacity: 0.4 }));
  }, []);
  return <primitive object={linea} />;
}
