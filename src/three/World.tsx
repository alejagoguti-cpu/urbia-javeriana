import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { Suspense, useMemo, useRef } from 'react';
import { S, lectura, useSt, esMovil, ease, clamp } from '../store';
import { ESCENAS, type EscenaId } from '../data/contenido';
import { ANCLA, VIA, bezier, camEscena } from './anclas';
import Polvo from './Polvo';
import Intro from './scenes/Intro';
import Hero from './scenes/Hero';
import Red from './scenes/Red';
import Oportunidad from './scenes/Oportunidad';
import Metodo from './scenes/Metodo';
import Pilotos from './scenes/Pilotos';
import Cronograma3D from './scenes/Cronograma3D';
import Lab3D from './scenes/Lab3D';
import Evaluacion3D from './scenes/Evaluacion3D';
import Ruta3D from './scenes/Ruta3D';
import Final3D from './scenes/Final3D';

// desplazamiento del encuadre: deja el modelo a la derecha cuando hay texto a la izquierda
const ENCUADRE: Partial<Record<EscenaId, number>> = { hero: 0.2, origen: 0.22, oportunidad: 0.05, metodo: 0.17, pilotos: 0.16, cronograma: 0.16, lab: 0.24, evaluacion: 0.2, ruta: 0.2, final: 0.3 };

const COMP: Record<EscenaId, () => JSX.Element> = {
  intro: Intro, hero: Hero, origen: Red, oportunidad: Oportunidad, metodo: Metodo, pilotos: Pilotos,
  cronograma: Cronograma3D, lab: Lab3D, evaluacion: Evaluacion3D, ruta: Ruta3D, final: Final3D,
};

function Rig() {
  const { camera } = useThree();
  const cur = useRef({ p: new THREE.Vector3(0, 0, 40), t: new THREE.Vector3(), fov: 40, ini: false, enc: 0 });
  const { size } = useThree();
  useFrame((_, dt) => {
    S.t += dt;
    const { i, lp, tt } = lectura();
    const id = ESCENAS[i].id;
    let p: THREE.Vector3, t: THREE.Vector3, fov: number;
    const a = camEscena(id, lp);
    if (tt > 0) {
      const nid = ESCENAS[i + 1].id;
      const b = camEscena(nid, 0);
      const k = ease(tt);
      const via = VIA[id] ?? a.p.clone().lerp(b.p, 0.5).add(new THREE.Vector3(0, 40 + a.p.distanceTo(b.p) * 0.12, 0));
      p = bezier(a.p, via, b.p, k);
      t = a.t.clone().lerp(b.t, ease(clamp(tt * 1.15 - 0.05)));
      fov = (a.fov ?? 45) + ((b.fov ?? 45) - (a.fov ?? 45)) * k + Math.sin(Math.PI * k) * 18; // estiramiento de velocidad
    } else { p = a.p; t = a.t; fov = a.fov ?? 45; }
    // parallax del cursor
    const red = useSt.getState().reducido ? 0.25 : 1;
    const off = new THREE.Vector3(S.mx * 3.2 * red, S.my * 2 * red, 0).applyQuaternion(camera.quaternion);
    p = p.clone().add(off);
    const c = cur.current;
    if (!c.ini) { c.p.copy(p); c.t.copy(t); c.ini = true; }
    const lam = 1 - Math.exp(-dt * (useSt.getState().foco ? 3.5 : 7));
    c.p.lerp(p, lam); c.t.lerp(t, lam); c.fov += (fov - c.fov) * lam;
    camera.position.copy(c.p);
    camera.lookAt(c.t);
    const pc = camera as THREE.PerspectiveCamera;
    const movil = size.width < 820;
    let enc = movil ? 0 : (ENCUADRE[ESCENAS[tt > 0.5 ? Math.min(i + 1, ESCENAS.length - 1) : i].id] ?? 0);
    if (id === 'pilotos' && tt < 0.5) { const s = useSt.getState().sub; if (s === 0 || s === 5) enc = 0.12; }
    c.enc += (enc - c.enc) * lam * 0.6;
    pc.setViewOffset(size.width, size.height, -c.enc * size.width, 0, size.width, size.height);
    if (Math.abs(pc.fov - c.fov) > 0.01) { pc.fov = c.fov; pc.updateProjectionMatrix(); }
  });
  return null;
}

function Escenas() {
  const escena = useSt((s) => s.escena);
  const visibles = useMemo(() => ESCENAS.map((_, i) => Math.abs(i - escena) <= 1), [escena]);
  return (
    <>
      {ESCENAS.map((e, i) => {
        if (!visibles[i]) return null;
        const C = COMP[e.id];
        return (
          <group key={e.id} position={ANCLA[e.id]}>
            <Suspense fallback={null}><C /></Suspense>
          </group>
        );
      })}
    </>
  );
}

export default function World() {
  const reducido = useSt((s) => s.reducido);
  return (
    <>
      <color attach="background" args={['#0E0F0D']} />
      <fogExp2 attach="fog" args={['#0E0F0D', 0.0042]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[60, 120, 40]} intensity={1.4} color="#F5F3EB" />
      <directionalLight position={[-80, 30, -60]} intensity={0.6} color="#A99BCB" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={6} color="#F5F3EB" position={[0, 6, -9]} scale={[12, 2, 1]} />
        <Lightformer intensity={2.4} color="#A99BCB" position={[-8, 1, 3]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer intensity={1.6} color="#C7FF27" position={[8, -2, 2]} rotation-y={-Math.PI / 2} scale={[8, 1.5, 1]} />
        <Lightformer form="ring" intensity={1.2} color="#E36C4B" position={[0, -6, 6]} scale={4} />
        <Lightformer intensity={2.2} color="#F5F3EB" position={[0, 0, 10]} scale={[20, 1, 1]} />
      </Environment>
      <Rig />
      <Polvo />
      <Escenas />
      {!esMovil && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={reducido ? 0.5 : 0.85} luminanceThreshold={0.55} luminanceSmoothing={0.25} mipmapBlur />
          <Noise opacity={0.035} />
          <Vignette eskil={false} offset={0.25} darkness={0.75} />
        </EffectComposer>
      )}
    </>
  );
}
