import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ESCENAS, HERO, ORIGEN, OPORTUNIDAD, METODO, PILOTOS, RUTA, FINAL, AUTORAS, AVISO, type EscenaId } from '../data/contenido';
import { PROYECTOS_AUTORAS } from '../data/autoras';
import { useSt, esMovil } from '../store';
import { irEscena, cerrarFoco, abrirFoco } from '../lib/nav';
import { useCrono, fechasSemana } from '../lib/crono';
import { pdfCronograma, pdfPropuesta } from '../lib/pdf';
import { Kinetic, aparecer } from './Kinetic';
import Comparador from './Comparador';
import Lab from './Lab';
import Evaluacion from './Evaluacion';
import { empezar } from './acciones';
import { relacionesCiudad, USOS_NOMBRE } from '../three/scenes/pilotos/Ciudad';
import { LogoSVG, Javeriana } from './Chrome';

const idx = (id: EscenaId) => ESCENAS.findIndex((e) => e.id === id);

function Intro() {
  return (
    <div className="ov ov-intro">
      <motion.div className="intro-cab" {...aparecer(0.6)}>
        <Javeriana className="jav-intro" />
        <p className="mono kicker">Propuesta académica para la Facultad de Arquitectura y Diseño<br />Pontificia Universidad Javeriana</p>
      </motion.div>
      <motion.div className="intro-pie" {...aparecer(1)}>
        <p className="intro-autoras">{AUTORAS.join('  ·  ')}</p>
        <div className="fila">
          <button className="btn" onClick={() => empezar('presentacion')}>Iniciar presentación <span className="mono">15 min</span></button>
          <button className="btn-sec" onClick={() => empezar('exploracion')}>Explorar libremente</button>
        </div>
        <p className="mono pista">Haga clic en el logo o desplácese para comenzar</p>
      </motion.div>
    </div>
  );
}

function Hero() {
  const etapa = useSt((s) => s.heroEtapa);
  return (
    <div className="ov ov-hero">
      <div className="hero-txt">
        <Kinetic as="h1" texto={HERO.titulo} className="titulo-xl" />
        <motion.p className="sub" {...aparecer(0.9)}>{HERO.sub}</motion.p>
        <motion.button className="btn" {...aparecer(1.1)} onClick={() => irEscena(idx('origen'))}>{HERO.boton}</motion.button>
      </div>
      <div className="etapas mono">
        {HERO.etapas.map((e, i) => (
          <span key={e} className={i === etapa ? 'on' : i < etapa ? 'pasado' : ''}><b>{String(i + 1).padStart(2, '0')}</b>{e}</span>
        ))}
      </div>
    </div>
  );
}

function Origen() {
  const nodo = useSt((s) => s.nodo);
  const set = useSt((s) => s.set);
  const n = ORIGEN.nodos.find((x) => x.id === nodo);
  const rel = nodo ? ORIGEN.enlaces.filter(([a, b]) => a === nodo || b === nodo).map(([a, b]) => (a === nodo ? b : a)) : [];
  return (
    <div className="ov ov-izq">
      <p className="mono kicker">02 · ORIGEN</p>
      <Kinetic texto={ORIGEN.titulo} className="titulo-l" />
      <motion.p className="cuerpo" {...aparecer(0.7)}>{ORIGEN.texto}</motion.p>
      <motion.div className="chips" {...aparecer(0.9)}>
        {ORIGEN.nodos.map((x) => <button key={x.id} className={'chip ' + (x.id === nodo ? 'on' : rel.includes(x.id) ? 'rel' : '')} onClick={() => set({ nodo: x.id === nodo ? null : x.id })}>{x.nombre}</button>)}
      </motion.div>
      <AnimatePresence>
        {n ? (
          <motion.div key={n.id} className="tarjeta-nodo" {...aparecer(0)}>
            <h3>{n.nombre}</h3><p>{n.texto}</p>
            <p className="mono rel">Se relaciona con: {rel.map((r) => ORIGEN.nodos.find((x) => x.id === r)!.nombre).join(' · ')}</p>
          </motion.div>
        ) : <motion.p key="p" className="mono pista" {...aparecer(1.1)}>Seleccione un nodo de la red: los demás se reorganizan según sus relaciones.</motion.p>}
      </AnimatePresence>
      <motion.div className="slots" {...aparecer(1.2)}>
        <p className="mono kicker">PROYECTOS DE LAS AUTORAS</p>
        <div className="slots-fila">
          {PROYECTOS_AUTORAS.slice(0, 4).map((p, i) => (
            <a key={i} className={'slot ' + (p.url ? '' : 'vacio')} href={p.url} target="_blank" rel="noreferrer">
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>{p.titulo}{p.confirmar && <em className="mono">por confirmar</em>}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Oportunidad() {
  return (
    <div className="ov ov-opor">
      <div className="opor-cab">
        <p className="mono kicker">03 · OPORTUNIDAD</p>
        <Kinetic texto={OPORTUNIDAD.titulo} className="titulo-l" />
        <motion.p className="cuerpo" {...aparecer(0.7)}>{OPORTUNIDAD.texto}</motion.p>
      </div>
      <motion.div {...aparecer(0.5)}><Comparador /></motion.div>
    </div>
  );
}

function Metodo() {
  const capa = useSt((s) => s.capa);
  const c = capa !== null ? METODO.capas[capa] : null;
  return (
    <div className="ov ov-izq">
      <p className="mono kicker">04 · METODOLOGÍA</p>
      <Kinetic texto={METODO.titulo} className="titulo-l" />
      <motion.p className="cuerpo" {...aparecer(0.7)}>{METODO.nota}</motion.p>
      <motion.ol className="lista-capas" {...aparecer(0.9)}>
        {METODO.capas.map((x, i) => (
          <li key={i}><button className={capa === i ? 'on' : ''} onClick={() => (capa === i ? cerrarFoco() : abrirFoco('capa', i, { capa: i }))}><span className="mono">{x.n}</span>{x.t}</button></li>
        ))}
      </motion.ol>
      <AnimatePresence>
        {c && (
          <motion.div className="panel-foco" initial={{ opacity: 0, x: 60, filter: 'blur(8px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: 60 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <p className="mono kicker">ETAPA {c.n}</p>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
            <ul className="mini">{c.ej.map((e) => <li key={e}>{e}</li>)}</ul>
            <div className="fila">
              <button className="btn-sec" disabled={capa === 0} onClick={() => abrirFoco('capa', capa! - 1, { capa: capa! - 1 })}>Anterior</button>
              <button className="btn-sec" disabled={capa === 4} onClick={() => abrirFoco('capa', capa! + 1, { capa: capa! + 1 })}>Siguiente</button>
              <button className="btn" onClick={cerrarFoco}>Cerrar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelPiloto({ k }: { k: number }) {
  const p = PILOTOS[k - 1];
  const st = useSt();
  const [, forzar] = useState(0);
  useEffect(() => { const id = setTimeout(() => forzar((x) => x + 1), 60); return () => clearTimeout(id); }, [st.urbano]);
  return (
    <motion.div className="panel-piloto" style={{ ['--c' as any]: p.color }} initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
      <p className="mono kicker">PILOTO {p.n} · {p.profesor.toUpperCase()}</p>
      <Kinetic texto={p.nombre} className="titulo-m" />
      <p className="cuerpo">{p.escenario}</p>
      <div className="demo-ctrl">
        <p className="mono kicker">DEMOSTRACIÓN</p>
        {k === 1 && (
          <>
            <label className="control"><span className="mono">Ocupación {Math.round(st.habitat.ocupacion * 100)}%</span><input type="range" min={0.05} max={1} step={0.01} value={st.habitat.ocupacion} onChange={(e) => st.set({ habitat: { ...st.habitat, ocupacion: +e.target.value } })} /></label>
            <label className="control"><span className="mono">Orientación {st.habitat.orientacion}°</span><input type="range" min={-90} max={90} step={1} value={st.habitat.orientacion} onChange={(e) => st.set({ habitat: { ...st.habitat, orientacion: +e.target.value } })} /></label>
            <label className="control"><span className="mono">Hora solar {st.habitat.hora.toFixed(1)} h</span><input type="range" min={6} max={18} step={0.1} value={st.habitat.hora} onChange={(e) => st.set({ habitat: { ...st.habitat, hora: +e.target.value } })} /></label>
            <div className="segmento">
              {(['claustro', 'barra', 'escalonado'] as const).map((c) => <button key={c} className={st.habitat.config === c ? 'on' : ''} onClick={() => st.set({ habitat: { ...st.habitat, config: c } })}>{c[0].toUpperCase() + c.slice(1)}</button>)}
            </div>
          </>
        )}
        {k === 2 && (
          <>
            <div className="toggles">
              {([['movilidad', 'Movilidad'], ['equipamientos', 'Equipamientos'], ['publico', 'Espacio público'], ['ecologica', 'Estructura ecológica'], ['usos', 'Usos del suelo']] as const).map(([id, t]) => (
                <button key={id} className={'toggle ' + (st.urbano[id] ? 'on' : '')} aria-pressed={st.urbano[id]} onClick={() => st.set({ urbano: { ...st.urbano, [id]: !st.urbano[id] } })}><i />{t}</button>
              ))}
            </div>
            {st.urbano.usos && <p className="leyenda mono">{USOS_NOMBRE.map((u, i) => <span key={u} className={'u' + i}>{u}</span>)}</p>}
            <div className="relaciones mono">
              <b>{relacionesCiudad.n}</b> relaciones visibles entre sistemas
              {relacionesCiudad.detalle.map((d) => <span key={d}>{d}</span>)}
              {relacionesCiudad.n === 0 && <span>Active dos o más capas para ver sus relaciones.</span>}
            </div>
          </>
        )}
        {k === 3 && (
          <div className="segmento vertical">
            {([['historica', 'Representación histórica'], ['levantamiento', 'Levantamiento digital'], ['modelo', 'Modelo tridimensional'], ['recorrido', 'Recorrido interactivo']] as const).map(([m, t]) => (
              <button key={m} className={st.patri.modo === m ? 'on' : ''} onClick={() => st.set({ patri: { modo: m } })}>{t}</button>
            ))}
          </div>
        )}
        {k === 4 && (
          <>
            <div className="toggles">
              {([['agua', 'Agua'], ['energia', 'Energía'], ['vegetacion', 'Vegetación'], ['infraestructura', 'Infraestructura'], ['equipamientos', 'Equipamientos'], ['clima', 'Condiciones ambientales']] as const).map(([id, t]) => (
                <button key={id} className={'toggle ' + (st.terr[id] ? 'on' : '')} aria-pressed={st.terr[id]} onClick={() => st.set({ terr: { ...st.terr, [id]: !st.terr[id] } })}><i />{t}</button>
              ))}
            </div>
            <p className="aviso mono">Relieve y silueta reales de Tierra Bomba (Terrarium + costa OSM, vía la tesis). Las estrategias son ilustrativas: sin resultados cuantitativos hasta contar con un modelo de cálculo documentado.</p>
            <a className="caso" href="https://alejagoguti-cpu.github.io/tesis_tercer_corte/" target="_blank" rel="noreferrer">
              <span className="mono">Caso demostrativo · tesis de las autoras</span>
              <b>Planificación y adaptación territorial frente a la pérdida de suelo costero en Tierra Bomba</b>
              <small>Alejandra Gómez · Ana Casas · Arquitectura, 2026. Erosión a 10, 20 y 30 años, sintaxis espacial de redes peatonales y de motos, plan maestro en 3D. INVEMAR midió en la isla un retroceso costero promedio de 0,63 m/año y máximo de 3 m/año (1994–2011).</small>
              <span className="caso-ir mono">Abrir la tesis</span>
            </a>
          </>
        )}
      </div>
      <details className="ficha">
        <summary className="mono">Workshops posibles y entregable</summary>
        <ul className="mini">{p.workshops.map((w) => <li key={w}>{w}</li>)}</ul>
        <p><b>Demostración propuesta.</b> {p.demo}</p>
        <p><b>Entregable potencial.</b> {p.entregable}</p>
      </details>
      <p className="mono transicion">Transición: {p.transicion}</p>
    </motion.div>
  );
}

function Pilotos() {
  const sub = useSt((s) => s.sub);
  return (
    <div className="ov ov-pilotos">
      <AnimatePresence>
        {(sub === 0 || sub === 5) && (
          <motion.div key="hub" className="pilotos-hub" {...aparecer(0)}>
            <p className="mono kicker">05 · PROYECTOS PILOTO</p>
            <Kinetic texto={sub === 5 ? ['Cuatro universos,', 'un mismo espacio.'] : ['Cuatro proyectos piloto.']} className="titulo-l" />
            <p className="cuerpo">Cada universo tiene su propia materialidad, escala y lógica. Seleccione uno en la escena o en la lista, o siga desplazándose.</p>
            <div className="pilotos-lista">
              {PILOTOS.map((p, i) => (
                <button key={p.id} style={{ ['--c' as any]: p.color }} onClick={() => irEscena(idx('pilotos'), i + 1)}>
                  <span className="mono">{p.n}</span><b>{p.nombre}</b><small>{p.profesor}</small>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {sub > 0 && sub < 5 && <PanelPiloto key={'p' + sub} k={sub} />}
      </AnimatePresence>
      {sub > 0 && sub < 5 && (
        <div className="pilotos-nav mono">
          {PILOTOS.map((p, i) => <button key={p.id} className={sub === i + 1 ? 'on' : ''} style={{ ['--c' as any]: p.color }} onClick={() => irEscena(idx('pilotos'), i + 1)}>{p.n}</button>)}
          <button onClick={() => irEscena(idx('pilotos'), 0)}>Todos</button>
        </div>
      )}
    </div>
  );
}

function Cronograma() {
  const c = useCrono();
  const st = useSt();
  if (!c) return null;
  const s = st.semana !== null ? c.plantilla[st.semana] : null;
  const cfg = c.pilotos[st.pilotoCrono];
  return (
    <div className="ov ov-crono">
      <div className="crono-cab">
        <p className="mono kicker">06 · CRONOGRAMA PROPUESTO</p>
        <Kinetic texto="Seis semanas, ajustables a cada asignatura." className="titulo-l" />
        <p className="aviso mono">Fechas, duración y sesiones son tentativas, no están aprobadas. Se editan en config/cronograma.json.</p>
        <div className="segmento">
          {PILOTOS.map((p) => <button key={p.id} className={!st.comparar && st.pilotoCrono === p.id ? 'on' : ''} onClick={() => st.set({ pilotoCrono: p.id, comparar: false })}>{p.n} {p.nombre}</button>)}
          <button className={st.comparar ? 'on' : ''} onClick={() => st.set({ comparar: !st.comparar })}>Comparar los cuatro</button>
        </div>
        <div className="semanas">
          {c.plantilla.map((w, k) => (
            <button key={k} className={st.semana === k ? 'on' : ''} onClick={() => (st.semana === k ? cerrarFoco() : abrirFoco('semana', k, { semana: k }))}>
              <span className="mono">S{String(w.n).padStart(2, '0')}</span>{w.titulo}
            </button>
          ))}
        </div>
        <div className="fila">
          <button className="btn" onClick={() => pdfCronograma(c, st.comparar ? 'todos' : st.pilotoCrono)}>Descargar PDF</button>
        </div>
      </div>
      <AnimatePresence>
        {s && (
          <motion.div className="panel-foco" key={st.semana} initial={{ opacity: 0, x: 60, filter: 'blur(8px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: 60 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <p className="mono kicker">SEMANA {String(s.n).padStart(2, '0')} · {fechasSemana(c, st.semana!)}</p>
            <h3>{s.titulo}</h3>
            <dl className="ficha-semana">
              <dt>Objetivo</dt><dd>{s.objetivo}</dd>
              <dt>Duración propuesta</dt><dd>{st.comparar ? 'Ver cada piloto en el PDF' : `${cfg.sesionesPorSemana[st.semana!]} sesión(es) de ${cfg.duracionHoras[st.semana!]} h`}</dd>
              <dt>Actividades</dt><dd>{s.actividades.join(' · ')}</dd>
              <dt>Herramientas</dt><dd>{s.herramientas[0].startsWith('Según') && !st.comparar ? cfg.herramientas.join(' · ') : s.herramientas.join(' · ')}</dd>
              <dt>Responsables</dt><dd>Por definir</dd>
              <dt>Entregable</dt><dd>{s.entregable}</dd>
              <dt>Relación con el proyecto</dt><dd>{s.relacion}</dd>
            </dl>
            <button className="btn" onClick={cerrarFoco}>Cerrar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LabOv() {
  return (
    <div className="ov ov-lab">
      <p className="mono kicker">07 · LABORATORIO DIGITAL</p>
      <Kinetic texto="Demostraciones que se pueden tocar." className="titulo-l" />
      <motion.div {...aparecer(0.5)}><Lab /></motion.div>
    </div>
  );
}

function EvalOv() {
  return (
    <div className="ov ov-eval">
      <p className="mono kicker">08 · EVALUACIÓN DEL PILOTO</p>
      <Kinetic texto="Innovar también implica medir." className="titulo-l" />
      <motion.div {...aparecer(0.5)}><Evaluacion /></motion.div>
    </div>
  );
}

function RutaOv() {
  const paso = useSt((s) => s.rutaPaso);
  const set = useSt((s) => s.set);
  const r = RUTA[paso];
  return (
    <div className="ov ov-izq">
      <p className="mono kicker">09 · IMPLEMENTACIÓN INSTITUCIONAL</p>
      <Kinetic texto="Una ruta que se construye por etapas." className="titulo-l" />
      <ol className="ruta">
        {RUTA.map((x, i) => (
          <li key={i} className={i === paso ? 'on' : i < paso ? 'pasado' : ''}><button onClick={() => set({ rutaPaso: i })}><span className="mono">{String(i + 1).padStart(2, '0')}</span>{x.t}</button></li>
        ))}
      </ol>
      <AnimatePresence>
        <motion.div key={paso} className="tarjeta-nodo" {...aparecer(0)}>
          <h3>{r.t}</h3><p>{r.d}</p>
          <p className="mono rel">Recursos: {r.recursos.join(' · ')}</p>
          <p className="mono pend">Pendiente de concertación: {r.pendiente}</p>
        </motion.div>
      </AnimatePresence>
      <p className="mono pista">Alcance del piloto: cuatro asignaturas, seis semanas cada una, sin modificación curricular.</p>
    </div>
  );
}

function Final() {
  return (
    <div className="ov ov-final">
      <div className="final-marcas"><LogoSVG className="final-logo" /><span className="marcas-sep" /><Javeriana className="jav-final" /></div>
      <Kinetic as="h1" texto={FINAL.titulo} className="titulo-xl" />
      <motion.p className="sub" {...aparecer(1.2)}>{FINAL.sub}</motion.p>
      <motion.p className="autoras" {...aparecer(1.4)}>{AUTORAS.join(' y ')}</motion.p>
      <motion.div className="fila final-btns" {...aparecer(1.6)}>
        <button className="btn" onClick={pdfPropuesta}>Descargar propuesta académica</button>
        <button className="btn-sec" onClick={() => irEscena(idx('pilotos'), 0)}>Explorar proyectos piloto</button>
        <button className="btn-sec" onClick={() => irEscena(idx('cronograma'))}>Consultar cronograma</button>
        <button className="btn-sec" onClick={() => irEscena(0)}>Volver al inicio</button>
      </motion.div>
      <p className="mono aviso">{AVISO}</p>
    </div>
  );
}

const MAPA: Record<EscenaId, () => JSX.Element | null> = {
  intro: Intro, hero: Hero, origen: Origen, oportunidad: Oportunidad, metodo: Metodo, pilotos: Pilotos,
  cronograma: Cronograma, lab: LabOv, evaluacion: EvalOv, ruta: RutaOv, final: Final,
};

export default function Overlays() {
  const escena = useSt((s) => s.escena);
  const id = ESCENAS[escena].id;
  const C = MAPA[id];
  return (
    <div className={'overlays ' + (esMovil ? 'movil' : '')}>
      <AnimatePresence>
        <motion.section key={id} className={'capa-ov ov-' + id} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
          <C />
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
