import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { S, localDe, useSt, clamp } from '../../store';

// 01 — Línea → Planta → Estructura → Sistema. Un solo conjunto de segmentos con
// cuatro estados por vértice; un shader interpola entre ellos según el scroll.
const vert = /* glsl */ `
attribute vec3 aLinea; attribute vec3 aPlanta; attribute vec3 aEstr; attribute float aTipo; attribute float aRnd;
uniform float uE; uniform float uT; uniform vec3 uMouse;
varying float vTipo; varying float vA; varying float vH;
void main(){
  float e1 = smoothstep(0.0,1.0,clamp(uE,0.0,1.0));
  float e2 = smoothstep(0.0,1.0,clamp(uE-1.0,0.0,1.0));
  float e3 = smoothstep(0.0,1.0,clamp(uE-2.0,0.0,1.0));
  // retardo por segmento: la transformación se propaga
  vec3 p = mix(aLinea, aPlanta, smoothstep(aRnd*0.4, aRnd*0.4+0.6, e1));
  p = mix(p, aEstr, smoothstep(aRnd*0.4, aRnd*0.4+0.6, e2));
  p = mix(p, position, smoothstep(aRnd*0.4, aRnd*0.4+0.6, e3));
  // respiración y respuesta sutil al cursor
  float d = length(p.xz - uMouse.xz);
  p.y += exp(-d*d*0.004) * 1.6 * e2;
  p += normalize(vec3(aRnd-0.5, 0.0, fract(aRnd*7.0)-0.5)) * sin(uT*0.6+aRnd*20.0)*0.08*e3;
  vTipo = aTipo; vH = p.y;
  vA = 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
}`;
const frag = /* glsl */ `
uniform float uE; varying float vTipo; varying float vH;
void main(){
  vec3 blanco = vec3(0.96,0.95,0.93);
  vec3 lima = vec3(0.84,1.0,0.25);
  vec3 azul = vec3(0.19,0.31,1.0);
  vec3 c = blanco;
  if (vTipo > 0.5 && vTipo < 1.5) c = mix(blanco, lima, clamp(uE-1.0,0.0,1.0));
  if (vTipo > 1.5) c = mix(blanco, azul*1.6, clamp(uE-2.0,0.0,1.0));
  float a = 0.75 + 0.25*clamp(uE-2.0,0.0,1.0);
  gl_FragColor = vec4(c*1.15, a);
}`;

function construir() {
  const seg: number[][] = []; // [x1,y1,z1,x2,y2,z2,tipo]
  const W = 48, D = 30, H = 4.2, PISOS = 6;
  // planta: perímetro + muros interiores + patio
  const planta: [number, number, number, number][] = [];
  const rect = (x0: number, z0: number, x1: number, z1: number) => { planta.push([x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]); };
  rect(-W / 2, -D / 2, W / 2, D / 2);
  rect(-8, -5, 8, 5); // patio
  for (let x = -W / 2 + 6; x < W / 2; x += 6) { planta.push([x, -D / 2, x, -5]); planta.push([x, 5, x, D / 2]); }
  planta.push([-W / 2, 0, -8, 0], [8, 0, W / 2, 0]);
  for (let f = 0; f < PISOS; f++) {
    const y = f * H;
    const sx = 1 - f * 0.035;
    planta.forEach(([a, b, c, d]) => seg.push([a * sx, y, b, c * sx, y, d, 0]));
  }
  // columnas
  for (let x = -W / 2; x <= W / 2 + 0.01; x += 6) for (const z of [-D / 2, -5, 5, D / 2]) {
    for (let f = 0; f < PISOS - 1; f++) seg.push([x * (1 - f * 0.035), f * H, z, x * (1 - (f + 1) * 0.035), (f + 1) * H, z, 1]);
  }
  // sistema: arriostramientos, cubierta paramétrica y red de conexiones
  for (let f = 0; f < PISOS - 1; f++) for (let x = -W / 2; x < W / 2 - 0.01; x += 12) {
    const s0 = 1 - f * 0.035, s1 = 1 - (f + 1) * 0.035;
    seg.push([x * s0, f * H, -D / 2, (x + 6) * s1, (f + 1) * H, -D / 2, 2]);
    seg.push([(x + 6) * s0, f * H, D / 2, x * s1, (f + 1) * H, D / 2, 2]);
  }
  const yTop = (PISOS - 1) * H;
  for (let i = 0; i <= 24; i++) {
    const x = -W / 2 + (i / 24) * W;
    for (let j = 0; j < 12; j++) {
      const z0 = -D / 2 + (j / 12) * D, z1 = -D / 2 + ((j + 1) / 12) * D;
      const h = (z: number) => yTop + 3 + Math.sin(x * 0.18) * 2.2 * Math.cos(z * 0.2) + 2;
      seg.push([x * 0.82, h(z0), z0, x * 0.82, h(z1), z1, 2]);
    }
  }
  for (let k = 0; k < 160; k++) {
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 26;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.75, y = Math.random() * 26;
    const b = Math.floor(Math.random() * 6);
    seg.push([x, y, z, (Math.random() - 0.5) * W * 0.8, b * H, (Math.random() - 0.5) * D * 0.8, 2]);
  }
  const n = seg.length;
  const pos = new Float32Array(n * 6), lin = new Float32Array(n * 6), pla = new Float32Array(n * 6), est = new Float32Array(n * 6);
  const tipo = new Float32Array(n * 2), rnd = new Float32Array(n * 2);
  seg.forEach((s, i) => {
    const [x1, y1, z1, x2, y2, z2, t] = s;
    pos.set([x1, y1, z1, x2, y2, z2], i * 6);
    // estructura: hasta 3 pisos, el resto se pliega al piso 2; cubierta y red se pliegan
    const cap = (y: number) => Math.min(y, 2 * H);
    const e = t === 2 ? [x1 * 0.5, cap(y1) * 0.3, z1 * 0.5, x2 * 0.5, cap(y2) * 0.3, z2 * 0.5] : [x1, cap(y1), z1, x2, cap(y2), z2];
    est.set(e, i * 6);
    // planta: todo proyectado al suelo (las verticales se vuelven puntos)
    const p = t === 2 ? [x1 * 0.1, 0, z1 * 0.1, x1 * 0.1, 0, z1 * 0.1] : [x1, 0, z1, x2, 0, z2];
    pla.set(p, i * 6);
    // línea: todo colapsado en una línea horizontal suspendida
    const u1 = (x1 / 60) * 70, u2 = (x2 / 60) * 70;
    lin.set([u1, 10, 0, t === 0 ? u2 : u1, 10, 0], i * 6);
    tipo.set([t, t], i * 2);
    const r = Math.random(); rnd.set([r, r], i * 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aLinea', new THREE.BufferAttribute(lin, 3));
  g.setAttribute('aPlanta', new THREE.BufferAttribute(pla, 3));
  g.setAttribute('aEstr', new THREE.BufferAttribute(est, 3));
  g.setAttribute('aTipo', new THREE.BufferAttribute(tipo, 1));
  g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 80);
  return g;
}

export default function Hero() {
  const geo = useMemo(construir, []);
  const uni = useMemo(() => ({ uE: { value: 0 }, uT: { value: 0 }, uMouse: { value: new THREE.Vector3() } }), []);
  const g = useRef<THREE.Group>(null!);
  const losas = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    const lp = clamp(localDe(1));
    const e = lp * 3.05;
    uni.uE.value += (e - uni.uE.value) * (useSt.getState().reducido ? 1 : 0.12);
    uni.uT.value += dt;
    uni.uMouse.value.set(S.mx * 30, 0, -S.my * 20);
    g.current.rotation.y += ((S.mx * 0.18) - g.current.rotation.y) * 0.05;
    g.current.rotation.x += ((S.my * 0.06) - g.current.rotation.x) * 0.05;
    const etapa = Math.min(3, Math.floor(uni.uE.value + 0.15));
    if (useSt.getState().heroEtapa !== etapa) useSt.getState().set({ heroEtapa: etapa });
    const k = clamp(uni.uE.value - 2.2);
    losas.current.children.forEach((m, i) => {
      const mm = (m as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
      mm.opacity = k * 0.16;
      m.position.y = i * 4.2 * clamp(uni.uE.value - 1.6);
    });
  });
  return (
    <group ref={g} position={[0, -8, 0]}>
      <lineSegments geometry={geo} frustumCulled={false}>
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uni} transparent depthWrite={false} />
      </lineSegments>
      <group ref={losas}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} scale={[1 - i * 0.035, 1, 1]}>
            <planeGeometry args={[48, 30]} />
            <meshPhysicalMaterial color="#304FFE" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} roughness={0.2} metalness={0.1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
