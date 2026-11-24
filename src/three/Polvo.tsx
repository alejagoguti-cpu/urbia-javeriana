import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { S, esMovil, useSt } from '../store';

// Partículas ambientales que envuelven siempre a la cámara (caja que se repite),
// reaccionan a la velocidad del scroll (estelas) y al cursor (remolino).
const vert = /* glsl */ `
uniform vec3 uCam; uniform float uT; uniform float uVel; uniform vec2 uMouse; uniform float uPx;
attribute vec4 aRnd;
varying float vA; varying vec3 vC;
void main(){
  vec3 box = vec3(220.0, 140.0, 220.0);
  vec3 p = position + vec3(sin(uT*0.05 + aRnd.x*6.28)*4.0, uT*(0.6+aRnd.y)*0.8, cos(uT*0.04+aRnd.z*6.28)*4.0);
  p = mod(p - uCam + box*0.5, box) - box*0.5 + uCam;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  // remolino alrededor del cursor en espacio de vista
  vec2 ndc = mv.xy / -mv.z;
  vec2 d = ndc - uMouse*0.8;
  float f = exp(-dot(d,d)*6.0);
  mv.xy += vec2(-d.y, d.x) * f * 6.0;
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;
  float size = (0.35 + aRnd.w*1.5) * (1.0 + abs(uVel)*0.5);
  gl_PointSize = size * uPx * (300.0 / dist);
  vA = smoothstep(200.0, 30.0, dist) * smoothstep(2.0, 12.0, dist) * (0.18 + aRnd.w*0.45);
  // azul a la izquierda, oro/lima a la derecha como en un campo de profundidad
  float side = smoothstep(-0.6, 0.6, ndc.x + (aRnd.x-0.5)*0.8);
  vC = mix(vec3(0.25,0.42,1.0), vec3(0.95,0.92,0.55), side);
  vC = mix(vC, vec3(0.84,1.0,0.25), step(0.93, aRnd.y));
}`;
const frag = /* glsl */ `
varying float vA; varying vec3 vC;
void main(){
  vec2 c = gl_PointCoord - 0.5; float r = length(c);
  float a = smoothstep(0.5, 0.15, r) * vA;
  float ring = smoothstep(0.5,0.42,r) - smoothstep(0.42,0.32,r);
  gl_FragColor = vec4(vC * (1.0 + ring*0.6), a);
}`;

export default function Polvo() {
  const n = esMovil ? 1500 : 4200;
  const { camera, gl } = useThree();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    const r = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.random() - 0.5) * 220; p[i * 3 + 1] = (Math.random() - 0.5) * 140; p[i * 3 + 2] = (Math.random() - 0.5) * 220;
      r[i * 4] = Math.random(); r[i * 4 + 1] = Math.random(); r[i * 4 + 2] = Math.random(); r[i * 4 + 3] = Math.pow(Math.random(), 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(r, 4));
    return g;
  }, [n]);
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const uni = useMemo(() => ({ uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, uVel: { value: 0 }, uMouse: { value: new THREE.Vector2() }, uPx: { value: Math.min(2, gl.getPixelRatio()) } }), [gl]);
  useFrame((_, dt) => {
    uni.uCam.value.copy(camera.position);
    uni.uT.value += dt * (useSt.getState().reducido ? 0.2 : 1);
    uni.uVel.value += (Math.min(6, Math.abs(S.vel)) - uni.uVel.value) * 0.08;
    uni.uMouse.value.set(S.mx, S.my);
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
