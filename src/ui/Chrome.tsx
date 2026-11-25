import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ESCENAS, PILOTOS, AUTORAS } from '../data/contenido';
import { S, TOTAL, useSt } from '../store';
import { irEscena, pantallaCompleta, volver, siguiente } from '../lib/nav';
import { activarSonido } from '../lib/sonido';
import { LOGO_TEXTO, LOGO_ESQUINA } from '../lib/logoPath';
import IconoCromo from './IconoCromo';

export function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="60 50 520 190" aria-label="urbia">
      <path d={LOGO_TEXTO} fill="currentColor" />
      <path d={`M${LOGO_ESQUINA.x} ${LOGO_ESQUINA.y}h${LOGO_ESQUINA.w}v${LOGO_ESQUINA.h}`} stroke="var(--lima)" strokeWidth="17" fill="none" />
    </svg>
  );
}

// El escudo llega en negro sobre blanco; se convierte una sola vez a trazo claro sobre transparente.
let javerianaURL: Promise<string> | null = null;
function javerianaClaro() {
  if (!javerianaURL) javerianaURL = new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d')!; x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
        d.data[i] = 244; d.data[i + 1] = 243; d.data[i + 2] = 239; d.data[i + 3] = 255 - l;
      }
      x.putImageData(d, 0, 0); res(c.toDataURL('image/png'));
    };
    im.src = './img/javeriana.png';
  });
  return javerianaURL;
}
export function Javeriana({ className = '' }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { javerianaClaro().then(setSrc); }, []);
  return src ? <img className={'javeriana ' + className} src={src} alt="Pontificia Universidad Javeriana" draggable={false} /> : <span className={'javeriana ' + className} />;
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
        <div className="marcas">
          <button className="marca" onClick={() => irEscena(0)} aria-label="Volver al inicio"><LogoSVG /></button>
          <span className="marcas-sep" />
          <Javeriana className="jav-barra" />
        </div>
        <div className="barra-centro mono">
          <AnimatePresence>
            <motion.span key={e.id} style={{ position: "absolute", left: "50%", x: "-50%" }} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
              <b>{e.n}</b> {e.nombre}{e.id === 'pilotos' && st.sub > 0 && st.sub < 5 ? ' · ' + PILOTOS[st.sub - 1].nombre : ''}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="barra-der">
          <Reloj />
          {st.modo && (
            <div className="segmento" role="group" aria-label="Modo">
              <button className={st.modo === 'presentacion' ? 'on' : ''} onClick={() => st.set({ modo: 'presentacion', inicioPresentacion: st.inicioPresentacion || Date.now() })}>Presentación</button>
              <button className={st.modo === 'exploracion' ? 'on' : ''} onClick={() => st.set({ modo: 'exploracion' })}>Exploración</button>
            </div>
          )}
          <button className={'icono ' + (st.sonido ? 'on' : '')} aria-pressed={st.sonido} title="Sonido (desactivado por defecto)" onClick={() => { activarSonido(!st.sonido); st.set({ sonido: !st.sonido }); }}>
            <IconoCromo n={st.sonido ? 'sonido' : 'silencio'} lima={st.sonido} />
          </button>
          <button className={'icono ' + (st.reducido ? 'on' : '')} aria-pressed={st.reducido} title="Movimiento reducido" onClick={() => st.set({ reducido: !st.reducido })}>
            <IconoCromo n="reducido" lima={st.reducido} />
          </button>
          <button className="icono" title="Pantalla completa (F)" onClick={pantallaCompleta}>
            <IconoCromo n="pantalla" />
          </button>
          <button className={'icono menu-btn ' + (st.menu ? 'on' : '')} title="Menú (M)" onClick={() => st.set({ menu: !st.menu })} aria-expanded={st.menu}>
            <IconoCromo n={st.menu ? 'cerrar' : 'menu'} lima={st.menu} />
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
              <IconoCromo n={st.foco ? 'cerrar' : 'izq'} />{st.foco ? 'Cerrar' : 'Regresar'}
            </motion.button>
          )}
        </AnimatePresence>
        {st.modo && (
          <div className="flechas">
            <button onClick={() => siguiente(-1)} aria-label="Anterior"><IconoCromo n="izq" /></button>
            <button onClick={() => siguiente(1)} aria-label="Siguiente"><IconoCromo n="der" lima /></button>
          </div>
        )}
      </div>
      <Progreso />
    </>
  );
}
