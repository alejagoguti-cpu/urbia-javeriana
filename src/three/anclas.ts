import * as THREE from 'three';
import { useSt, subPilotos, ease, smooth, clamp, S } from '../store';
import type { EscenaId } from '../data/contenido';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Centro de cada escena en el mundo. Todo vive en un solo espacio continuo.
export const ANCLA: Record<EscenaId, THREE.Vector3> = {
  intro: V(0, 0, 0),
  hero: V(0, 0, -260),
  origen: V(260, 30, -480),
  oportunidad: V(520, 0, -260),
  metodo: V(760, -10, -520),
  pilotos: V(1150, 0, -900),
  cronograma: V(1550, 10, -560),
  lab: V(1800, 0, -820),
  evaluacion: V(2050, 20, -560),
  ruta: V(2300, -10, -820),
  final: V(2650, 0, -600),
};

// Universos piloto alrededor del hub
export const UNIVERSO = [
  V(-150, 0, 40), // habitat
  V(-50, 0, -170), // urbanos
  V(120, 0, -120), // patrimonio
  V(150, -10, 90), // territorios
];

export type Cam = { p: THREE.Vector3; t: THREE.Vector3; fov?: number };

const tmp = new THREE.Vector3();
const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({
  p: a.p.clone().lerp(b.p, k), t: a.t.clone().lerp(b.t, k), fov: (a.fov ?? 45) + ((b.fov ?? 45) - (a.fov ?? 45)) * k,
});

function camPiloto(k: number, A: THREE.Vector3): Cam {
  if (k <= 0 || k >= 5) {
    const r = k >= 5 ? 1 : 0;
    return { p: A.clone().add(V(-30 + r * 50, 175 - r * 30, 235 + r * 30)), t: A.clone().add(V(0, -10, -20)), fov: 42 };
  }
  const u = UNIVERSO[k - 1];
  const c = A.clone().add(u);
  const st = useSt.getState();
  if (k === 1) {
    const ang = st.habitat.orientacion * 0.0;
    return { p: c.clone().add(V(-55 * Math.cos(ang) - 10, 38, 62)), t: c.clone().add(V(0, 6, 0)), fov: 40 };
  }
  if (k === 2) return { p: c.clone().add(V(20, 95, 95)), t: c.clone().add(V(0, 0, -5)), fov: 42 };
  if (k === 3) {
    if (st.patri.modo === 'recorrido') {
      const a = S.t * 0.12;
      return { p: c.clone().add(V(Math.sin(a) * 42, 8 + Math.sin(a * 0.7) * 3, Math.cos(a) * 42)), t: c.clone().add(V(0, 9, 0)), fov: 55 };
    }
    return { p: c.clone().add(V(48, 20, 58)), t: c.clone().add(V(0, 10, 0)), fov: 40 };
  }
  return { p: c.clone().add(V(-30, 75, 95)), t: c.clone().add(V(0, -2, 0)), fov: 44 };
}

/** cámara dentro de cada escena según su progreso local lp (0..1) */
export function camEscena(id: EscenaId, lp: number): Cam {
  const A = ANCLA[id];
  const st = useSt.getState();
  switch (id) {
    case 'intro':
      return { p: A.clone().add(V(0, 0, 40 - lp * 12)), t: A.clone(), fov: 40 };
    case 'hero': {
      const a = -0.6 + lp * 1.1;
      const r = 92 - lp * 22;
      return { p: A.clone().add(V(Math.sin(a) * r, 30 + lp * 14, Math.cos(a) * r)), t: A.clone().add(V(0, 6 + lp * 6, 0)), fov: 38 };
    }
    case 'origen': {
      const sel = st.nodo ? 1 : 0;
      return { p: A.clone().add(V(-6 + lp * 12, 4, 62 - sel * 10)), t: A.clone().add(V(8, 0, 0)), fov: 42 };
    }
    case 'oportunidad':
      return { p: A.clone().add(V(-70 + lp * 40, 48, 70)), t: A.clone().add(V(-10, 0, 0)), fov: 40 };
    case 'metodo': {
      if (st.capa !== null) {
        const y = (st.capa - 2) * 14;
        return { p: A.clone().add(V(-40, y + 22, 42)), t: A.clone().add(V(12, y, 0)), fov: 38 };
      }
      const a = 0.5 + lp * 0.6;
      return { p: A.clone().add(V(Math.sin(a) * -95, 30 - lp * 10, Math.cos(a) * 95)), t: A.clone().add(V(14, 4, 0)), fov: 40 };
    }
    case 'pilotos': {
      const s = subPilotos(lp);
      const f = Math.floor(s);
      const k = s - f;
      const a = camPiloto(f, A);
      if (k < 1e-4) return a;
      const b = camPiloto(f + 1, A);
      const c = lerpCam(a, b, ease(k));
      // la cámara se eleva al pasar de Hábitat a Centros Urbanos
      const elev = f === 1 ? Math.sin(Math.PI * k) * 120 : Math.sin(Math.PI * k) * 45;
      c.p.y += elev;
      return c;
    }
    case 'cronograma': {
      const zoom = st.semana !== null ? 1 : 0;
      const x = st.semana !== null ? (st.semana - 2.5) * 16 : 0;
      return { p: A.clone().add(V(x * zoom - 20 + lp * 20, 38 - zoom * 12, 80 - zoom * 25)), t: A.clone().add(V(x * zoom, 4, 0)), fov: 40 };
    }
    case 'lab':
      return { p: A.clone().add(V(34, 18, 62)), t: A.clone().add(V(18, 12, 0)), fov: 40 };
    case 'evaluacion':
      return { p: A.clone().add(V(Math.sin(lp * 0.8) * 20 + 22, 30, 76)), t: A.clone().add(V(22, 6, 0)), fov: 40 };
    case 'ruta': {
      const h = 6 + st.rutaPaso * 6;
      return { p: A.clone().add(V(60 - lp * 25, h + 22, 74)), t: A.clone().add(V(12, h * 0.55, 0)), fov: 40 };
    }
    case 'final': {
      const a = S.t * 0.04;
      return { p: A.clone().add(V(Math.sin(a) * 120, 52, Math.cos(a) * 120)), t: A.clone().add(V(0, 4, 0)), fov: 42 };
    }
  }
}

/** punto por el que pasa la cámara al salir de cada escena (atravesar el modelo) */
export const VIA: Partial<Record<EscenaId, THREE.Vector3>> = {
  hero: ANCLA.hero.clone().add(V(0, 10, 0)),
  intro: ANCLA.intro.clone().add(V(0, 0, -6)),
};

export function bezier(a: THREE.Vector3, v: THREE.Vector3, b: THREE.Vector3, t: number) {
  const u = 1 - t;
  return tmp.set(0, 0, 0).addScaledVector(a, u * u).addScaledVector(v, 2 * u * t).addScaledVector(b, t * t).clone();
}

export { smooth, clamp };
