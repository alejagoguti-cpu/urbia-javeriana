import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { S } from '../../store';

// 03 — Campo urbano partido por un plano: a un lado el proceso convencional (alambre gris,
// estático); al otro el proceso con tecnologías emergentes (volúmenes vivos, datos, luz).
// El divisor está sincronizado con el comparador interactivo de la interfaz.
const vert = /* glsl */ `
attribute vec3 aOff; attribute float aH; attribute float aR;
uniform float uSplit; uniform float uT; uniform float uComp;
varying float vLado; varying float vY; varying float vR; varying vec3 vN;
void main(){
  vec3 p = position;
  float lado = smoothstep(-2.0, 2.0, aOff.x - (uSplit-0.5)*140.0);
  float vivo = lado;
  float onda = sin(aOff.x*0.08 + uT*1.2 + uComp) * cos(aOff.z*0.09 - uT*0.8);
  float h = aH * mix(1.0, 0.7 + 0.6*(0.5+0.5*onda), vivo);
  p.y = (p.y + 0.5) * h;
  p.xz *= mix(1.0, 0.82, vivo);
  vLado = lado; vY = p.y / 30.0; vR = aR; vN = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p + aOff, 1.0);
}`;
const frag = /* glsl */ `
uniform float uT; varying float vLado; varying float vY; varying float vR; varying vec3 vN;
void main(){
  vec3 gris = vec3(0.55,0.57,0.61) * (0.35 + 0.25*vN.y);
  float l = max(0.0, dot(normalize(vN), normalize(vec3(0.4,0.8,0.3))));
  vec3 base = mix(vec3(0.12,0.16,0.4), vec3(0.19,0.31,1.0), vY);
  vec3 vivo = base * (0.4 + 0.8*l) + vec3(0.84,1.0,0.25) * step(0.92, vR) * (0.6+0.4*sin(uT*3.0+vR*30.0));
  vec3 c = mix(gris, vivo, vLado);
  gl_FragColor = vec4(c, 1.0);
}`;

export default function Oportunidad() {
  const { geo, n } = useMemo(() => {
    const cols = 34, rows = 22;
    const n = cols * rows;
    const box = new THREE.BoxGeometry(3, 1, 3);
    const g = new THREE.InstancedBufferGeometry().copy(box as unknown as THREE.InstancedBufferGeometry);
    const off = new Float32Array(n * 3), h = new Float32Array(n), r = new Float32Array(n);
    let k = 0;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = (i - cols / 2) * 4.2, z = (j - rows / 2) * 4.2;
      off.set([x, 0, z], k * 3);
      const d = Math.hypot(x, z * 1.4);
      h[k] = 1 + Math.max(0, 26 - d * 0.35) * Math.pow(Math.random(), 1.6) + Math.random() * 2;
      r[k] = Math.random();
      k++;
    }
    g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3));
    g.setAttribute('aH', new THREE.InstancedBufferAttribute(h, 1));
    g.setAttribute('aR', new THREE.InstancedBufferAttribute(r, 1));
    g.instanceCount = n;
    return { geo: g, n };
  }, []);
  const uni = useMemo(() => ({ uSplit: { value: 0.5 }, uT: { value: 0 }, uComp: { value: 0 } }), []);
  const plano = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    uni.uSplit.value += (S.split - uni.uSplit.value) * 0.15;
    uni.uT.value += dt;
    uni.uComp.value += (S.comp * 1.3 - uni.uComp.value) * 0.05;
    plano.current.position.x = (uni.uSplit.value - 0.5) * 140;
  });
  return (
    <group>
      <mesh geometry={geo} frustumCulled={false}>
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uni} />
      </mesh>
      <mesh ref={plano} rotation-y={Math.PI / 2} position={[0, 18, 0]}>
        <planeGeometry args={[100, 40]} />
        <meshBasicMaterial color="#C7FF27" transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <gridHelper args={[160, 40, '#2a2d34', '#15171c']} position={[0, -0.01, 0]} />
    </group>
  );
}
