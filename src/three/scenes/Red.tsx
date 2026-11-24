import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { ORIGEN } from '../../data/contenido';
import { S, useSt } from '../../store';
import { sonar } from '../../lib/sonido';

export const FUENTE = './fonts/manrope-latin-400-normal.woff';
export const FUENTE_B = './fonts/manrope-latin-700-normal.woff';
export const MONO = './fonts/jetbrains-mono-latin-400-normal.woff';

// 02 — Red tridimensional de conocimientos. Al seleccionar un nodo, la red se reorganiza:
// el nodo al centro, sus relaciones en un anillo cercano, el resto se aleja y se apaga.
const N = ORIGEN.nodos;
const vecinos = (id: string) => new Set(ORIGEN.enlaces.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : [])));

function posBase(i: number) {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / N.length);
  const th = Math.PI * (1 + Math.sqrt(5)) * i;
  return new THREE.Vector3(Math.cos(th) * Math.sin(phi) * 22, Math.cos(phi) * 14, Math.sin(th) * Math.sin(phi) * 16);
}

export default function Red() {
  const nodo = useSt((s) => s.nodo);
  const refs = useRef<THREE.Group[]>([]);
  const actual = useMemo(() => N.map((_, i) => posBase(i)), []);
  const lineas = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ORIGEN.enlaces.length * 6), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ORIGEN.enlaces.length * 6), 3));
    return g;
  }, []);
  // partículas que viajan por las aristas
  const viaj = useMemo(() => {
    const n = ORIGEN.enlaces.length * 6;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return { g, n, f: Array.from({ length: n }, () => Math.random()) };
  }, []);
  const objetivo = useMemo(() => {
    if (!nodo) return N.map((_, i) => posBase(i));
    const v = vecinos(nodo);
    const rel = N.filter((n) => v.has(n.id));
    return N.map((n, i) => {
      if (n.id === nodo) return new THREE.Vector3(0, 0, 6);
      const k = rel.findIndex((r) => r.id === n.id);
      if (k >= 0) { const a = (k / rel.length) * Math.PI * 2 + 0.4; return new THREE.Vector3(Math.cos(a) * 17, Math.sin(a) * 10, 0); }
      const b = posBase(i); return b.multiplyScalar(1.5).add(new THREE.Vector3(0, 0, -26));
    });
  }, [nodo]);
  useFrame((_, dt) => {
    const lam = 1 - Math.exp(-dt * (useSt.getState().reducido ? 30 : 3));
    const v = nodo ? vecinos(nodo) : null;
    actual.forEach((p, i) => {
      p.lerp(objetivo[i], lam);
      const g = refs.current[i];
      if (!g) return;
      g.position.copy(p).add(new THREE.Vector3(0, Math.sin(S.t * 0.7 + i) * 0.5, 0));
      const activo = !nodo || N[i].id === nodo || v!.has(N[i].id);
      const s = N[i].id === nodo ? 1.8 : activo ? 1 : 0.6;
      g.scale.lerp(new THREE.Vector3(s, s, s), lam);
    });
    const pa = lineas.attributes.position as THREE.BufferAttribute;
    const ca = lineas.attributes.color as THREE.BufferAttribute;
    ORIGEN.enlaces.forEach(([a, b], k) => {
      const ia = N.findIndex((n) => n.id === a), ib = N.findIndex((n) => n.id === b);
      const A = refs.current[ia]?.position ?? actual[ia], B = refs.current[ib]?.position ?? actual[ib];
      pa.setXYZ(k * 2, A.x, A.y, A.z); pa.setXYZ(k * 2 + 1, B.x, B.y, B.z);
      const on = !nodo || a === nodo || b === nodo;
      const c = on ? (nodo ? [0.84, 1, 0.25] : [0.55, 0.57, 0.61]) : [0.08, 0.09, 0.1];
      ca.setXYZ(k * 2, c[0], c[1], c[2]); ca.setXYZ(k * 2 + 1, c[0], c[1], c[2]);
    });
    pa.needsUpdate = true; ca.needsUpdate = true;
    const vp = viaj.g.attributes.position as THREE.BufferAttribute;
    for (let j = 0; j < viaj.n; j++) {
      const k = j % ORIGEN.enlaces.length;
      const [a, b] = ORIGEN.enlaces[k];
      const on = !nodo || a === nodo || b === nodo;
      viaj.f[j] = (viaj.f[j] + dt * (on ? 0.25 : 0.04)) % 1;
      const ia = N.findIndex((n) => n.id === a), ib = N.findIndex((n) => n.id === b);
      const A = actual[ia], B = actual[ib];
      vp.setXYZ(j, A.x + (B.x - A.x) * viaj.f[j], A.y + (B.y - A.y) * viaj.f[j], A.z + (B.z - A.z) * viaj.f[j]);
    }
    vp.needsUpdate = true;
  });
  return (
    <group>
      <lineSegments geometry={lineas} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} />
      </lineSegments>
      <points geometry={viaj.g} frustumCulled={false}>
        <pointsMaterial color="#D5FF3F" size={0.5} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      {N.map((n, i) => {
        const sel = nodo === n.id;
        return (
          <group key={n.id} ref={(r) => { if (r) refs.current[i] = r; }}>
            <mesh
              onClick={(e) => { e.stopPropagation(); sonar('clic'); useSt.getState().set({ nodo: sel ? null : n.id }); }}
              onPointerOver={() => (document.body.dataset.cursor = 'activo')}
              onPointerOut={() => (document.body.dataset.cursor = '')}
            >
              <icosahedronGeometry args={[1.5, 3]} />
              <meshPhysicalMaterial color={sel ? '#D5FF3F' : '#F4F3EF'} emissive={sel ? '#D5FF3F' : '#304FFE'} emissiveIntensity={sel ? 0.8 : 0.25} metalness={0.7} roughness={0.15} iridescence={1} clearcoat={1} />
            </mesh>
            <mesh scale={2.6}>
              <icosahedronGeometry args={[1, 1]} />
              <meshBasicMaterial color={sel ? '#D5FF3F' : '#8C929C'} wireframe transparent opacity={0.18} />
            </mesh>
            <Text font={FUENTE} fontSize={1.15} position={[0, -3.2, 0]} color="#F4F3EF" anchorX="center" anchorY="top" maxWidth={12} textAlign="center">
              {n.nombre}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
