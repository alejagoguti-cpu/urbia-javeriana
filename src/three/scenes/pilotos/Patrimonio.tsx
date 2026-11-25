import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useSt, smooth, S, esMovil } from '../../../store';
import { presencia } from '../Pilotos';

// Piloto 03 — Edificio patrimonial genérico (templo de nave única con torre y claustro,
// tipología colonial; no representa un edificio real). Modos: representación histórica,
// levantamiento digital (nube de puntos), modelo 3D y recorrido. Transición: la geometría
// se fragmenta en una nube de puntos y se reconstruye.
function edificio() {
  const g: THREE.BufferGeometry[] = [];
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => { const b = new THREE.BoxGeometry(w, h, d); b.translate(x, y + h / 2, z); g.push(b); };
  // nave
  box(14, 12, 36, 0, 0, 0);
  // cubierta a dos aguas
  const techo = new THREE.CylinderGeometry(0.01, 10.5, 6, 4, 1, false, Math.PI / 4); techo.scale(1, 1, 3.6); techo.rotateY(0); techo.translate(0, 15, 0);
  const t2 = new THREE.BufferGeometry().copy(techo); g.push(t2);
  // fachada con frontón
  box(18, 16, 2, 0, 0, 18.5);
  const fronton = new THREE.CylinderGeometry(0.01, 11, 6, 3, 1); fronton.rotateZ(0); fronton.rotateX(Math.PI / 2); fronton.scale(1, 1, 0.33); fronton.rotateX(-Math.PI / 2); fronton.translate(0, 19, 18.5);
  g.push(fronton);
  // torre campanario
  box(7, 26, 7, -11, 0, 15); box(5.4, 6, 5.4, -11, 26, 15);
  const cup = new THREE.SphereGeometry(3.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2); cup.translate(-11, 32, 15); g.push(cup);
  // claustro con arcadas
  for (let i = 0; i < 6; i++) for (const z of [-16, 4]) { box(1.2, 6, 1.2, 12 + i * 4, 0, z); }
  for (let i = 0; i < 6; i++) for (const x of [12, 32]) { box(1.2, 6, 1.2, x, 0, -16 + i * 4); }
  box(22, 1, 22, 22, 6, -6);
  // contrafuertes
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) box(1.6, 9, 2.4, s * 7.6, 0, -14 + i * 7);
  return mergeGeometries(g.map((x) => x.toNonIndexed()));
}

const vert = /* glsl */ `
attribute vec3 aDisp; attribute float aR;
uniform float uU; uniform float uScan; uniform float uT; uniform float uPx;
varying float vH; varying float vScan; varying float vR;
void main(){
  float k = smoothstep(aR*0.5, aR*0.5+0.5, uU);
  vec3 p = mix(aDisp, position, k);
  p += vec3(sin(uT+aR*40.0), cos(uT*0.7+aR*30.0), 0.0) * 0.05 * k;
  vH = position.y / 36.0; vR = aR;
  vScan = 1.0 - smoothstep(0.0, 2.5, abs(position.y - uScan));
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (1.2 + vScan*2.0) * (120.0 / -mv.z);
}`;
const frag = /* glsl */ `
uniform float uOp; varying float vH; varying float vScan; varying float vR;
void main(){
  vec2 c = gl_PointCoord-0.5; if(length(c)>0.5) discard;
  vec3 col = mix(vec3(0.19,0.31,1.0), vec3(0.96,0.95,0.93), vH);
  col = mix(col, vec3(0.84,1.0,0.25), vScan);
  gl_FragColor = vec4(col, uOp*(0.75+0.25*vR));
}`;

export default function Patrimonio() {
  const modo = useSt((s) => s.patri.modo);
  const { geo, puntos, bordes } = useMemo(() => {
    const geo = edificio();
    geo.computeVertexNormals();
    const s = new MeshSurfaceSampler(new THREE.Mesh(geo)).build();
    const n = esMovil ? 14000 : 38000;
    const pos = new Float32Array(n * 3), disp = new Float32Array(n * 3), r = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      s.sample(v); pos.set([v.x, v.y, v.z], i * 3);
      const a = Math.random() * Math.PI * 2, rr = 30 + Math.random() * 60;
      disp.set([v.x + Math.cos(a) * rr, v.y + (Math.random() - 0.3) * 50, v.z + Math.sin(a) * rr], i * 3);
      r[i] = Math.random();
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('aDisp', new THREE.BufferAttribute(disp, 3));
    pg.setAttribute('aR', new THREE.BufferAttribute(r, 1));
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 120);
    return { geo, puntos: pg, bordes: new THREE.EdgesGeometry(geo, 25) };
  }, []);
  const uni = useMemo(() => ({ uU: { value: 0 }, uScan: { value: 0 }, uT: { value: 0 }, uPx: { value: Math.min(2, window.devicePixelRatio) }, uOp: { value: 1 } }), []);
  const solido = useRef<THREE.Mesh>(null!);
  const linea = useRef<THREE.LineSegments>(null!);
  const plano = useRef<THREE.Mesh>(null!);
  const papel = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    const u = smooth(presencia(3));
    uni.uT.value += dt;
    // al cambiar de modo, la nube se re-fragmenta brevemente y se reconstruye
    uni.uU.value += (u - uni.uU.value) * 0.06;
    uni.uScan.value = (S.t * 7) % 40;
    const ptsOp = modo === 'levantamiento' ? 1 : modo === 'modelo' ? 0.12 : modo === 'recorrido' ? 0.45 : 0;
    uni.uOp.value += (ptsOp - uni.uOp.value) * 0.08;
    const sm = solido.current.material as THREE.MeshStandardMaterial;
    const sOp = (modo === 'modelo' || modo === 'recorrido' ? 1 : 0) * smooth((u - 0.6) / 0.4);
    sm.opacity += (sOp - sm.opacity) * 0.08; solido.current.visible = sm.opacity > 0.02;
    const lm = linea.current.material as THREE.LineBasicMaterial;
    const lOp = modo === 'historica' ? 1 : modo === 'modelo' ? 0.35 : 0.12;
    lm.opacity += (lOp * u - lm.opacity) * 0.08;
    lm.color.lerp(new THREE.Color(modo === 'historica' ? '#c9a46a' : '#F5F3EB'), 0.08);
    plano.current.visible = modo === 'levantamiento';
    plano.current.position.y = uni.uScan.value;
    const pm = papel.current.material as THREE.MeshBasicMaterial;
    pm.opacity += ((modo === 'historica' ? 0.9 : 0) - pm.opacity) * 0.08;
  });
  return (
    <group>
      <mesh ref={papel} rotation-x={-Math.PI / 2} position={[8, 0.02, 0]}>
        <planeGeometry args={[80, 70]} />
        <meshBasicMaterial color="#2a2318" transparent opacity={0} />
      </mesh>
      <points geometry={puntos} frustumCulled={false}>
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uni} transparent depthWrite={false} />
      </points>
      <mesh ref={solido} geometry={geo} castShadow>
        <meshStandardMaterial color="#e9e1d3" roughness={0.85} transparent opacity={0} />
      </mesh>
      <lineSegments ref={linea} geometry={bordes}>
        <lineBasicMaterial color="#F5F3EB" transparent opacity={0} />
      </lineSegments>
      <mesh ref={plano} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[70, 60]} />
        <meshBasicMaterial color="#C7FF27" transparent opacity={0.012} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[8, -0.05, 0]}><circleGeometry args={[55, 64]} /><meshStandardMaterial color="#121318" /></mesh>
    </group>
  );
}
