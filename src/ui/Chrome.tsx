import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ESCENAS, PILOTOS, AUTORAS } from '../data/contenido';
import { S, TOTAL, useSt } from '../store';
import { irEscena, pantallaCompleta, volver, siguiente } from '../lib/nav';
import { activarSonido } from '../lib/sonido';
import { LOGO_TEXTO, LOGO_ESQUINA } from '../lib/logoPath';

export function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="60 50 520 190" aria-label="urbia">
      <path d={LOGO_TEXTO} fill="currentColor" />
      <path d={`M${LOGO_ESQUINA.x} ${LOGO_ESQUINA.y}h${LOGO_ESQUINA.w}v${LOGO_ESQUINA.h}`} stroke="var(--lima)" strokeWidth="17" fill="none" />
    </svg>
  );
}

function Reloj() {
  const inicio = useSt((s) => s.inicioPresentacion);
  const modo = useSt((s) => s.modo);
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT(Date.now()), 1000); return () => clearInterval(id); }, []);
  if (modo !== 'presentacion' || !inicio) return null;
  const s = Math.max(0, Math.floor((t - inicio) / 1000));
  const r = 15 * 60 - s;
  const f = (x: number) => String(Math.floor(Math.abs(x) / 60)).padStart(2, '0') + ':' + String(Math.abs(x) % 60).padStart(2, '0');
  return <span className={'reloj mono ' + (r < 0 ? 'pasado' : '')} title="Tiempo restante de la presentación de 15 minutos">{r < 0 ? '+' + f(r) : f(r)}</span>;
}

function Progreso() {
  const [p, setP] = useState(0);
  useEffect(() => { let id = 0; const f = () => { setP(S.pos / TOTAL); id = requestAnimationFrame(f); }; f(); return () => cancelAnimationFrame(id); }, []);
  return <div className="progreso"><div className="progreso-barra" style={{ transform: `scaleX(${Math.min(1, p)})` }} /></div>;
}

export default function Chrome() {
  const st = useSt();
  const e = ESCENAS[st.escena];
  return (
    <>
      <header className="barra">
        <button className="marca" onClick={() => irEscena(0)} aria-label="Volver al inicio"><LogoSVG /></button>
        <div className="barra-centro mono">
          <AnimatePresence mode="wait">
            <motion.span key={e.id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
              <b>{e.n}</b> {e.nombre}{e.id === 'pilotos' && st.sub > 0 && st.sub < 5 ? ' · ' + PILOTOS[st.sub - 1].nombre : ''}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="barra-der">
          <Reloj />
          {st.modo && (
            <div className="segmento" role="group" aria-label="Modo">
              <button className={st.modo === 'presentacion' ? 'on' : ''} onClick={() => st.set({ modo: 'presentacion', inicioPresentacion: st.inicioPresentacion || Date.now() })}>Presentación</button>
              <button className={st.modo === 'exploracion' ? 'on' : ''} onClick={() => st.set({ modo: 'exploracion', menu: true })}>Exploración</button>
            </div>
          )}
          <button className={'icono ' + (st.sonido ? 'on' : '')} aria-pressed={st.sonido} title="Sonido (desactivado por defecto)" onClick={() => { activarSonido(!st.sonido); st.set({ sonido: !st.sonido }); }}>
            <svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" />{st.sonido ? <path d="M16 8c1.5 1.2 1.5 6.8 0 8M19 5c3 2.5 3 11.5 0 14" fill="none" /> : <path d="M16 9l5 6M21 9l-5 6" fill="none" />}</svg>
          </button>
          <button className={'icono ' + (st.reducido ? 'on' : '')} aria-pressed={st.reducido} title="Movimiento reducido" onClick={() => st.set({ reducido: !st.reducido })}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" /><path d="M8 12h8" fill="none" /></svg>
          </button>
          <button className="icono" title="Pantalla completa (F)" onClick={pantallaCompleta}>
            <svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" /></svg>
          </button>
          <button className={'icono menu-btn ' + (st.menu ? 'on' : '')} title="Menú (M)" onClick={() => st.set({ menu: !st.menu })} aria-expanded={st.menu}>
            <svg viewBox="0 0 24 24"><path d={st.menu ? 'M6 6l12 12M18 6L6 18' : 'M4 8h16M4 16h10'} fill="none" /></svg>
          </button>
        </div>
      </header>

      <nav className="riel" aria-label="Escenas">
        {ESCENAS.map((x, i) => (
          <button key={x.id} className={'riel-punto ' + (i === st.escena ? 'on' : '') + (i < st.escena ? ' pasado' : '')} onClick={() => irEscena(i)} title={x.n + ' ' + x.nombre}>
            <span className="mono">{x.n}</span><i />
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {st.menu && (
          <motion.aside className="menu" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <p className="mono menu-k">{st.modo === 'exploracion' ? 'MODO EXPLORACIÓN · NAVEGACIÓN LIBRE' : 'ÍNDICE'}</p>
            <ol>
              {ESCENAS.map((x, i) => (
                <motion.li key={x.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.035 } }}>
                  <button className={i === st.escena ? 'on' : ''} onClick={() => { irEscena(i); if (window.innerWidth < 820) st.set({ menu: false }); }}>
                    <span className="mono">{x.n}</span>{x.nombre}
                  </button>
                  {x.id === 'pilotos' && (
                    <ul>{PILOTOS.map((p, k) => <li key={p.id}><button onClick={() => irEscena(i, k + 1)} style={{ ['--c' as any]: p.color }}><span className="mono">{p.n}</span>{p.nombre}</button></li>)}</ul>
                  )}
                </motion.li>
              ))}
            </ol>
            <p className="menu-pie">{AUTORAS.join(' · ')}<br /><span className="mono">← → navegar · F pantalla completa · Esc volver</span></p>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="pie">
        <AnimatePresence>
          {(st.historial.length > 0 || st.foco) && st.modo && (
            <motion.button className="volver" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onClick={volver}>
              <svg viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6" fill="none" /></svg>{st.foco ? 'Cerrar' : 'Regresar'}
            </motion.button>
          )}
        </AnimatePresence>
        {st.modo && (
          <div className="flechas">
            <button onClick={() => siguiente(-1)} aria-label="Anterior"><svg viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6" fill="none" /></svg></button>
            <button onClick={() => siguiente(1)} aria-label="Siguiente"><svg viewBox="0 0 24 24"><path d="M10 6l6 6-6 6" fill="none" /></svg></button>
          </div>
        )}
      </div>
      <Progreso />
    </>
  );
}
