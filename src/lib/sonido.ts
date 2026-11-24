import { useSt } from '../store';

// Sonido generativo opcional (desactivado al inicio). Sin archivos de audio.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let drone: OscillatorNode[] = [];

function asegurar() {
  if (ctx) return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass'; filtro.frequency.value = 520; filtro.connect(master);
  [55, 82.4, 110.2].forEach((f, i) => {
    const o = ctx!.createOscillator(); const g = ctx!.createGain();
    o.type = i === 1 ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.value = 0.05;
    const lfo = ctx!.createOscillator(); const lg = ctx!.createGain();
    lfo.frequency.value = 0.05 + i * 0.03; lg.gain.value = 0.03; lfo.connect(lg).connect(g.gain); lfo.start();
    o.connect(g).connect(filtro); o.start(); drone.push(o);
  });
}

export function activarSonido(on: boolean) {
  if (on) asegurar();
  if (!ctx || !master) return;
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(on ? 0.6 : 0, ctx.currentTime + 1.2);
}

export function sonar(tipo: 'paso' | 'abrir' | 'clic') {
  if (!useSt.getState().sonido || !ctx || !master) return;
  const o = ctx.createOscillator(); const g = ctx.createGain();
  const f = tipo === 'paso' ? 220 : tipo === 'abrir' ? 440 : 660;
  o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(f * 1.5, ctx.currentTime + 0.25);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + 0.7);
}
