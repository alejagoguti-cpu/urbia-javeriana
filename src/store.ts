import { create } from 'zustand';
import { ESCENAS, type PilotoId } from './data/contenido';

// ---------- estado mutable de alta frecuencia (lo leen los useFrame) ----------
export const S = {
  pos: 0, // posición de scroll en "pantallas"
  vel: 0,
  mx: 0, my: 0, // cursor normalizado -1..1
  t: 0,
  split: 0.5, // divisor de las comparaciones (escena 03)
  comp: 0,
  torre: { pisos: 24, giro: 0.9, ahusar: 0.35, rotY: 0 }, // demo del laboratorio
};

export const START: number[] = [];
{
  let a = 0;
  for (const e of ESCENAS) { START.push(a); a += e.len; }
  START.push(a);
}
export const TOTAL = START[START.length - 1];
export const TRANS = 0.65; // pantallas dedicadas a viajar a la siguiente escena

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const ease = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

/** índice de escena, progreso local de permanencia (0..1) y progreso de tránsito a la siguiente (0..1) */
export function lectura(pos = S.pos) {
  let i = 0;
  while (i < ESCENAS.length - 1 && pos >= START[i + 1]) i++;
  const len = ESCENAS[i].len;
  const last = i === ESCENAS.length - 1;
  const hold = last ? len : len - TRANS;
  const lp = clamp((pos - START[i]) / hold);
  const tt = last ? 0 : clamp((pos - (START[i] + hold)) / TRANS);
  return { i, lp, tt };
}

/** progreso local de una escena concreta aunque no sea la activa (para animaciones de entrada/salida) */
export function localDe(idx: number, pos = S.pos) {
  const len = ESCENAS[idx].len;
  const last = idx === ESCENAS.length - 1;
  const hold = last ? len : len - TRANS;
  return (pos - START[idx]) / hold; // sin clamp: <0 antes, >1 durante el tránsito
}

/** subparada de pilotos: 0 hub, 1..4 universos, 5 panorama — con meseta en cada parada */
export function subPilotos(lp: number) {
  const x = lp * 5;
  const f = Math.floor(x);
  const fr = x - f;
  return Math.min(5, f + smooth((fr - 0.3) / 0.45));
}

export type Modo = 'presentacion' | 'exploracion';
export type Foco = { tipo: string; id: string | number } | null;

type HabitatP = { ocupacion: number; orientacion: number; hora: number; config: 'barra' | 'claustro' | 'escalonado' };
type UrbanoP = Record<'movilidad' | 'equipamientos' | 'publico' | 'ecologica' | 'usos', boolean>;
type PatriP = { modo: 'historica' | 'levantamiento' | 'modelo' | 'recorrido' };
type TerrP = Record<'agua' | 'energia' | 'vegetacion' | 'infraestructura' | 'equipamientos' | 'clima', boolean>;

type St = {
  escena: number;
  sub: number; // parada de pilotos redondeada
  modo: Modo | null;
  foco: Foco;
  historial: { pos: number; foco: Foco }[];
  sonido: boolean;
  reducido: boolean;
  menu: boolean;
  listo: boolean;
  inicioPresentacion: number;
  heroEtapa: number;
  nodo: string | null;
  capa: number | null;
  semana: number | null;
  pilotoCrono: PilotoId;
  comparar: boolean;
  indicador: string;
  rutaPaso: number;
  labDemo: string;
  habitat: HabitatP;
  urbano: UrbanoP;
  patri: PatriP;
  terr: TerrP;
  set: (p: Partial<St>) => void;
};

const preferReducido = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const useSt = create<St>((set) => ({
  escena: 0,
  sub: 0,
  modo: null,
  foco: null,
  historial: [],
  sonido: false,
  reducido: !!preferReducido,
  menu: false,
  listo: false,
  inicioPresentacion: 0,
  heroEtapa: 0,
  nodo: null,
  capa: null,
  semana: null,
  pilotoCrono: 'habitat',
  comparar: false,
  indicador: 'part',
  rutaPaso: 0,
  labDemo: 'modelo',
  habitat: { ocupacion: 0.6, orientacion: 0, hora: 10, config: 'claustro' },
  urbano: { movilidad: true, equipamientos: false, publico: false, ecologica: false, usos: false },
  patri: { modo: 'levantamiento' },
  terr: { agua: false, energia: false, vegetacion: false, infraestructura: false, equipamientos: false, clima: false },
  set: (p) => set(p),
}));

export const esMovil = typeof window !== 'undefined' && (window.matchMedia('(max-width: 820px)').matches || 'ontouchstart' in window);
