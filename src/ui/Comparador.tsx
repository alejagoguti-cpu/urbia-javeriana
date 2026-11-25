import { useEffect, useRef, useState } from 'react';
import { OPORTUNIDAD } from '../data/contenido';
import { S } from '../store';

// Comparaciones manipulables: un divisor separa el proceso convencional (izquierda)
// del proceso con tecnologías emergentes (derecha). Todo se dibuja en vivo.
type Est = { hora: number; pisos: number; rot: number; puntos: [number, number][]; mx: number; my: number; drag: boolean };

function rng(s: number) { return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const MANZ = (() => { const r = rng(4); const out: { x: number; y: number; w: number; h: number; alt: number }[] = []; for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) out.push({ x: 0.04 + i * 0.106, y: 0.06 + j * 0.15, w: 0.085, h: 0.12, alt: 0.2 + r() * 0.8 }); return out; })();
const HOGARES = (() => { const r = rng(9); return Array.from({ length: 140 }, () => [r(), r()] as [number, number]); })();

function dibujar(c: CanvasRenderingContext2D, w: number, h: number, id: string, e: Est, t: number, lado: 'a' | 'b') {
  c.save();
  c.fillStyle = lado === 'a' ? '#e9e6dc' : '#0b0d12';
  c.fillRect(0, 0, w, h);
  const tinta = lado === 'a' ? '#2a2c31' : '#F5F3EB';
  c.strokeStyle = tinta; c.fillStyle = tinta; c.lineWidth = 1;
  if (id === 'carto') {
    MANZ.forEach((m) => {
      if (lado === 'a') { c.strokeRect(m.x * w, m.y * h, m.w * w, m.h * h); c.globalAlpha = 0.15 + m.alt * 0.3; c.fillRect(m.x * w, m.y * h, m.w * w, m.h * h); c.globalAlpha = 1; }
      else {
        const cx = (m.x + m.w / 2) * w, cy = (m.y + m.h / 2) * h;
        const d = Math.hypot(cx - e.mx * w, cy - e.my * h) / (w * 0.35);
        const sol = 0.5 + 0.5 * Math.sin(((e.hora - 6) / 12) * Math.PI);
        const v = Math.max(0, 1 - d) * 0.7 + m.alt * 0.3 * sol;
        c.fillStyle = `rgba(${48 + v * 165},${79 + v * 176},${254 - v * 191},${0.25 + v * 0.75})`;
        c.fillRect(m.x * w, m.y * h, m.w * w, m.h * h);
        c.strokeStyle = 'rgba(245, 243, 235,.25)'; c.strokeRect(m.x * w, m.y * h, m.w * w, m.h * h);
      }
    });
    if (lado === 'b') {
      c.strokeStyle = '#C7FF27'; c.beginPath(); c.arc(e.mx * w, e.my * h, w * 0.35 * (0.95 + Math.sin(t * 3) * 0.03), 0, Math.PI * 2); c.stroke();
      for (let k = 0; k < 30; k++) { const a = (k / 30) * Math.PI * 2 + t * 0.5; const r = ((t * 40 + k * 13) % (w * 0.35)); c.fillStyle = '#C7FF27'; c.fillRect(e.mx * w + Math.cos(a) * r, e.my * h + Math.sin(a) * r, 2, 2); }
    }
  }
  if (id === 'modelo' || id === 'presen') {
    // volumen axonométrico; estático a la izquierda, manipulable a la derecha
    const rot = lado === 'a' ? 0.6 : e.rot + (id === 'presen' ? (e.mx - 0.5) * 1.2 : 0);
    const pisos = lado === 'a' ? 8 : e.pisos;
    const cx = w * 0.5, cy = h * 0.78, s = Math.min(w, h) * 0.18;
    const P = (x: number, y: number, z: number) => [cx + (x * Math.cos(rot) - z * Math.sin(rot)) * s, cy - y * s * 0.35 + (x * Math.sin(rot) + z * Math.cos(rot)) * s * 0.45];
    for (let f = 0; f < pisos; f++) {
      const y = f;
      const tw = id === 'presen' && lado === 'b' ? f * 0.06 * Math.sin(t) : 0;
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z]) => { const a = tw; return P(x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)); });
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      if (lado === 'b') { c.fillStyle = `rgba(169, 155, 203,${0.08 + (f / pisos) * 0.25})`; c.fill(); c.strokeStyle = f === pisos - 1 ? '#C7FF27' : 'rgba(245, 243, 235,.7)'; }
      c.stroke();
    }
    if (id === 'presen' && lado === 'b') {
      for (let k = 0; k < 80; k++) { const r = rng(k + 1); const x = r() * w, y = r() * h, z = r(); c.fillStyle = `rgba(199, 255, 39,${z * 0.6})`; c.fillRect(x + (e.mx - 0.5) * z * 60, y + (e.my - 0.5) * z * 40, 2 + z * 2, 2 + z * 2); }
    }
    if (id === 'presen' && lado === 'a') { c.font = '600 14px Manrope'; c.fillText('Lámina 03 / 12', 20, 30); c.fillRect(20, h - 40, w * 0.4, 2); }
  }
  if (id === 'simu') {
    const suelo = h * 0.75;
    c.beginPath(); c.moveTo(0, suelo); c.lineTo(w, suelo); c.stroke();
    const eds = [[0.15, 0.35], [0.4, 0.55], [0.62, 0.25], [0.8, 0.45]];
    const a = ((e.hora - 6) / 12) * Math.PI;
    const sx = Math.cos(a), sy = Math.max(0.05, Math.sin(a));
    eds.forEach(([x, hh]) => {
      const X = x * w, H = hh * h * 0.9, B = w * 0.08;
      if (lado === 'b') {
        const largo = H / sy * -sx; // sombra proyectada
        c.fillStyle = 'rgba(169, 155, 203,.45)'; c.beginPath(); c.moveTo(X, suelo); c.lineTo(X + B, suelo); c.lineTo(X + B + largo, suelo + 18); c.lineTo(X + largo, suelo + 18); c.closePath(); c.fill();
      }
      c.fillStyle = lado === 'a' ? 'rgba(42,44,49,.15)' : 'rgba(245, 243, 235,.9)';
      c.fillRect(X, suelo - H, B, H); c.strokeStyle = tinta; c.strokeRect(X, suelo - H, B, H);
    });
    if (lado === 'a') { c.font = '12px JetBrains Mono'; c.fillText('SOL', w * 0.05, h * 0.12); c.beginPath(); c.moveTo(w * 0.05, h * 0.15); c.lineTo(w * 0.2, h * 0.3); c.stroke(); }
    else { const px = w * 0.5 - sx * w * 0.42, py = suelo - sy * h * 0.65; c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(px, py, 10, 0, Math.PI * 2); c.fill(); c.font = '12px JetBrains Mono'; c.fillStyle = '#C7FF27'; c.fillText(String(Math.floor(e.hora)).padStart(2, '0') + ':' + String(Math.round((e.hora % 1) * 60)).padStart(2, '0') + ' h', px + 14, py + 4); }
  }
  if (id === 'analisis') {
    HOGARES.forEach(([x, y]) => {
      let cub = false;
      if (lado === 'b') cub = e.puntos.some(([px, py]) => Math.hypot(px - x, (py - y) * h / w) < 0.16);
      c.fillStyle = lado === 'a' ? tinta : cub ? '#C7FF27' : '#E36C4B';
      c.fillRect(x * w - 2, y * h - 2, 4, 4);
    });
    if (lado === 'a') {
      c.fillStyle = 'rgba(233,230,220,.92)'; c.fillRect(16, 16, 210, 82); c.fillStyle = tinta; c.font = '12px JetBrains Mono';
      c.fillText('Hogares: 140', 26, 40); c.fillText('Equipamientos: ' + e.puntos.length, 26, 60); c.fillText('Cobertura: no calculada', 26, 80);
    } else {
      e.puntos.forEach(([x, y]) => { c.strokeStyle = '#C7FF27'; c.beginPath(); c.arc(x * w, y * h, 0.16 * w, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#A99BCB'; c.fillRect(x * w - 6, y * h - 6, 12, 12); });
      const cub = HOGARES.filter(([x, y]) => e.puntos.some(([px, py]) => Math.hypot(px - x, (py - y) * h / w) < 0.16)).length;
      c.fillStyle = 'rgba(11,13,18,.85)'; c.fillRect(w - 236, 16, 220, 62); c.fillStyle = '#F5F3EB'; c.font = '12px JetBrains Mono';
      c.fillText('Cobertura calculada: ' + Math.round((cub / HOGARES.length) * 100) + '%', w - 226, 40); c.fillStyle = '#898D84'; c.fillText('datos de ejemplo', w - 226, 62);
    }
  }
  c.restore();
}

export default function Comparador() {
  const [idx, setIdx] = useState(0);
  const cv = useRef<HTMLCanvasElement>(null!);
  const est = useRef<Est>({ hora: 10, pisos: 12, rot: 0.6, puntos: [[0.3, 0.4]], mx: 0.6, my: 0.5, drag: false });
  const [hora, setHora] = useState(10);
  const [pisos, setPisos] = useState(12);
  const split = useRef(0.5);
  const comp = OPORTUNIDAD.comparaciones[idx];
  useEffect(() => { S.comp = idx; }, [idx]);
  useEffect(() => {
    let id = 0;
    const off = document.createElement('canvas');
    const f = (tm: number) => {
      const c = cv.current; if (!c) return;
      const r = c.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio);
      if (c.width !== Math.round(r.width * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      off.width = c.width; off.height = c.height;
      const x = c.getContext('2d')!, o = off.getContext('2d')!;
      x.setTransform(dpr, 0, 0, dpr, 0, 0); o.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = r.width, h = r.height, t = tm / 1000;
      dibujar(x, w, h, comp.id, est.current, t, 'a');
      dibujar(o, w, h, comp.id, est.current, t, 'b');
      const sx = split.current * w;
      x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(off, sx * dpr, 0, (w - sx) * dpr, h * dpr, sx * dpr, 0, (w - sx) * dpr, h * dpr); x.restore();
      x.fillStyle = '#C7FF27'; x.fillRect(sx - 1, 0, 2, h);
      x.beginPath(); x.arc(sx, h / 2, 16, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#0E0F0D'; x.font = '600 11px JetBrains Mono'; x.textAlign = 'center'; x.fillText('< >', sx, h / 2 + 4);
      id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [comp.id]);
  const pos = (ev: React.PointerEvent) => { const r = cv.current.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]; };
  return (
    <div className="comparador">
      <div className="comp-tabs" role="tablist">
        {OPORTUNIDAD.comparaciones.map((c, i) => (
          <button key={c.id} role="tab" aria-selected={i === idx} className={i === idx ? 'on' : ''} onClick={() => { setIdx(i); split.current = 0.5; S.split = 0.5; }}>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>{c.b}
          </button>
        ))}
      </div>
      <div className="comp-lienzo">
        <span className="comp-etq a mono">{comp.a}</span>
        <span className="comp-etq b mono">{comp.b}</span>
        <canvas
          ref={cv}
          onPointerDown={(ev) => {
            const [x, y] = pos(ev);
            if (Math.abs(x - split.current) < 0.04) { est.current.drag = true; (ev.target as HTMLElement).setPointerCapture(ev.pointerId); return; }
            if (x > split.current && comp.id === 'analisis') { const p = est.current.puntos; if (p.length >= 6) p.shift(); p.push([x, y]); }
            if (x > split.current && comp.id === 'modelo') { est.current.drag = false; (est.current as any).rotando = ev.clientX; (ev.target as HTMLElement).setPointerCapture(ev.pointerId); }
          }}
          onPointerMove={(ev) => {
            const [x, y] = pos(ev);
            if (est.current.drag) { split.current = Math.min(0.95, Math.max(0.05, x)); S.split = split.current; return; }
            if ((est.current as any).rotando !== undefined) { est.current.rot += (ev.clientX - (est.current as any).rotando) * 0.01; (est.current as any).rotando = ev.clientX; }
            if (x > split.current) { est.current.mx = x; est.current.my = y; }
          }}
          onPointerUp={() => { est.current.drag = false; (est.current as any).rotando = undefined; }}
        />
      </div>
      <div className="comp-controles">
        <p className="ayuda">{comp.ayuda}</p>
        {(comp.id === 'carto' || comp.id === 'simu') && (
          <label className="control"><span className="mono">Hora {hora.toFixed(1)} h</span>
            <input type="range" min={6} max={18} step={0.1} value={hora} onChange={(e) => { const v = +e.target.value; setHora(v); est.current.hora = v; }} />
          </label>
        )}
        {(comp.id === 'modelo' || comp.id === 'presen') && (
          <label className="control"><span className="mono">Pisos {pisos}</span>
            <input type="range" min={2} max={20} step={1} value={pisos} onChange={(e) => { const v = +e.target.value; setPisos(v); est.current.pisos = v; }} />
          </label>
        )}
        {comp.id === 'analisis' && <button className="btn-sec" onClick={() => (est.current.puntos = [])}>Limpiar equipamientos</button>}
      </div>
    </div>
  );
}
