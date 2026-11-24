import type { PilotoId } from '../data/contenido';

export type Crono = {
  inicio: string;
  semanas: number;
  horasPorSesion: number;
  plantilla: { n: number; titulo: string; objetivo: string; actividades: string[]; herramientas: string[]; entregable: string; relacion: string }[];
  pilotos: Record<PilotoId, { sesionesPorSemana: number[]; duracionHoras: number[]; herramientas: string[] }>;
};

let cache: Crono | null = null;
export async function cargarCrono(): Promise<Crono> {
  if (cache) return cache;
  const r = await fetch('./config/cronograma.json', { cache: 'no-store' });
  cache = await r.json();
  return cache!;
}

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function fechasSemana(c: Crono, k: number) {
  const d0 = new Date(c.inicio + 'T00:00:00');
  const a = new Date(d0.getTime() + k * 7 * 864e5);
  const b = new Date(a.getTime() + 4 * 864e5);
  return `${a.getDate()} ${MES[a.getMonth()]} – ${b.getDate()} ${MES[b.getMonth()]} ${b.getFullYear()} · tentativo`;
}

import { useEffect, useState } from 'react';
export function useCrono() {
  const [c, setC] = useState<Crono | null>(cache);
  useEffect(() => { if (!c) cargarCrono().then(setC); }, [c]);
  return c;
}
