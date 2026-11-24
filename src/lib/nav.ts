import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { S, START, TOTAL, TRANS, lectura, subPilotos, useSt } from '../store';
import { ESCENAS } from '../data/contenido';
import { sonar } from './sonido';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
const vh = () => window.innerHeight;

export function iniciarScroll() {
  const alto = document.getElementById('scroll-alto')!;
  alto.style.height = `${(TOTAL + 1) * 100}vh`;
  lenis = new Lenis({ duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4), wheelMultiplier: 0.7, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // un ScrollTrigger global sincroniza la posición del mundo 3D con el documento
  ScrollTrigger.create({
    trigger: alto, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => {
      S.pos = window.scrollY / vh();
      S.vel = self.getVelocity() / 1000;
      const { i, lp, tt } = lectura();
      const escena = tt > 0.5 ? Math.min(i + 1, ESCENAS.length - 1) : i;
      const st = useSt.getState();
      const sub = ESCENAS[i].id === 'pilotos' && tt < 0.5 ? Math.round(subPilotos(lp)) : 0;
      if (escena !== st.escena || sub !== st.sub) {
        if (escena !== st.escena) sonar('paso');
        st.set({ escena, sub });
      }
    },
  });
  // un trigger por escena (marcadores para depurar y snapping suave en presentación)
  ESCENAS.forEach((e, i) => {
    ScrollTrigger.create({
      start: () => START[i] * vh(), end: () => START[i + 1] * vh(),
      onToggle: (self) => { if (self.isActive) document.documentElement.dataset.escena = e.id; },
    });
  });
}

export const pararScroll = () => lenis?.stop();
export const seguirScroll = () => lenis?.start();

/** posición (en pantallas) del centro de permanencia de una escena; para pilotos, una parada */
export function posDe(idx: number, sub?: number) {
  const e = ESCENAS[idx];
  const hold = idx === ESCENAS.length - 1 ? e.len : e.len - TRANS;
  // la meseta de cada parada k está centrada en x = k (ver subPilotos)
  if (e.id === 'pilotos' && sub !== undefined) return START[idx] + hold * Math.min(0.995, (sub + 0.02) / 5);
  if (e.id === 'hero') return START[idx] + hold * 0.98;
  return START[idx] + hold * 0.55;
}

// último destino pedido: permite encadenar flechas aunque la cámara siga viajando
let destino = { pos: 0, hasta: 0 };

export function irA(pos: number, opts: { guardar?: boolean; inmediato?: boolean } = {}) {
  const st = useSt.getState();
  if (opts.guardar !== false) st.set({ historial: [...st.historial.slice(-20), { pos: S.pos, foco: st.foco }] });
  if (st.foco) st.set({ foco: null, nodo: null, capa: null, semana: null });
  seguirScroll();
  const dist = Math.abs(pos - S.pos);
  const dur = st.reducido || opts.inmediato ? 0 : Math.min(3.2, 0.9 + dist * 0.35);
  destino = { pos, hasta: performance.now() + dur * 1000 + 150 };
  lenis?.scrollTo(pos * vh(), { duration: dur, immediate: dur === 0, force: true, lock: dur > 0 });
}

export const irEscena = (idx: number, sub?: number) => irA(posDe(idx, sub));

export function volver() {
  const st = useSt.getState();
  if (st.foco) { st.set({ foco: null, nodo: null, capa: null, semana: null }); seguirScroll(); return; }
  const h = st.historial[st.historial.length - 1];
  if (!h) return;
  st.set({ historial: st.historial.slice(0, -1) });
  irA(h.pos, { guardar: false });
  if (h.foco) setTimeout(() => useSt.getState().set({ foco: h.foco }), 1200);
}

/** paradas de la presentación guiada: cada escena y cada universo piloto */
export function paradas() {
  const p: number[] = [];
  ESCENAS.forEach((e, i) => {
    if (e.id === 'pilotos') for (let s = 0; s <= 5; s++) p.push(posDe(i, s));
    else if (e.id === 'hero') { const h = e.len - TRANS; [0.05, 0.36, 0.66, 0.98].forEach((f) => p.push(START[i] + h * f)); }
    else p.push(posDe(i));
  });
  return p;
}

export function siguiente(dir: 1 | -1) {
  const p = paradas();
  const cur = performance.now() < destino.hasta ? destino.pos : S.pos;
  const tgt = dir > 0 ? p.find((x) => x > cur + 0.05) : [...p].reverse().find((x) => x < cur - 0.05);
  if (tgt !== undefined) irA(tgt, { guardar: false });
}

export function teclado() {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const st = useSt.getState();
    if (e.key === 'Escape') { if (st.menu) st.set({ menu: false }); else volver(); return; }
    if (!st.modo) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); if (!st.foco) siguiente(1); }
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); if (!st.foco) siguiente(-1); }
    if (e.key === 'Home') irEscena(0);
    if (e.key === 'End') irEscena(ESCENAS.length - 1);
    if (e.key.toLowerCase() === 'f') pantallaCompleta();
    if (e.key.toLowerCase() === 'm') st.set({ menu: !st.menu });
  });
}

export function pantallaCompleta() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}

export function abrirFoco(tipo: string, id: string | number, extra: Record<string, unknown> = {}) {
  const st = useSt.getState();
  st.set({ historial: [...st.historial.slice(-20), { pos: S.pos, foco: st.foco }], foco: { tipo, id }, ...extra });
  pararScroll();
  sonar('abrir');
}
export function cerrarFoco() {
  useSt.getState().set({ foco: null, nodo: null, capa: null, semana: null });
  seguirScroll();
}
