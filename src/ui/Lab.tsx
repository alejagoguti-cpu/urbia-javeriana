import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { S, useSt } from '../store';
import { PROYECTOS_AUTORAS } from '../data/autoras';
import { irEscena } from '../lib/nav';
import { createNoise2D } from 'simplex-noise';

// 07 — Laboratorio: demostraciones funcionales (no imágenes).
export const DEMOS = [
  { id: 'modelo', t: 'Modelo 3D paramétrico' },
  { id: 'territorio', t: 'Simulador territorial' },
  { id: 'red', t: 'Red de sistemas complejos' },
  { id: 'datos', t: 'Visualización de datos' },
  { id: 'codigo', t: 'Programación aplicada' },
  { id: 'inmersivo', t: 'Experiencia inmersiva' },
  { id: 'apps', t: 'Aplicaciones web' },
];

export default function Lab() {
  const demo = useSt((s) => s.labDemo);
  const set = useSt((s) => s.set);
  return (
    <div className="lab">
      <div className="lab-tabs">
        {DEMOS.map((d, i) => (
          <button key={d.id} className={demo === d.id ? 'on' : ''} onClick={() => set({ labDemo: d.id })}>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>{d.t}
          </button>
        ))}
      </div>
      <div className="lab-panel">
        {demo === 'modelo' && <DemoModelo />}
        {demo === 'territorio' && <DemoTerritorio />}
        {demo === 'red' && <DemoRed />}
        {demo === 'datos' && <DemoDatos />}
        {demo === 'codigo' && <DemoCodigo />}
        {demo === 'inmersivo' && <DemoInmersivo />}
        {demo === 'apps' && <DemoApps />}
      </div>
    </div>
  );
}

function DemoModelo() {
  const [v, setV] = useState({ ...S.torre });
  const upd = (k: 'pisos' | 'giro' | 'ahusar', x: number) => { S.torre[k] = x; setV({ ...S.torre }); };
  return (
    <div>
      <p className="ayuda">La torre del escenario es un modelo paramétrico real. Arrástrela para girarla y modifique sus parámetros.</p>
      <label className="control"><span className="mono">Pisos {v.pisos}</span><input type="range" min={4} max={60} value={v.pisos} onChange={(e) => upd('pisos', +e.target.value)} /></label>
      <label className="control"><span className="mono">Giro {Math.round(v.giro * 180)}°</span><input type="range" min={0} max={1} step={0.01} value={v.giro} onChange={(e) => upd('giro', +e.target.value)} /></label>
      <label className="control"><span className="mono">Ahusamiento {Math.round(v.ahusar * 100)}%</span><input type="range" min={0} max={0.8} step={0.01} value={v.ahusar} onChange={(e) => upd('ahusar', +e.target.value)} /></label>
    </div>
  );
}

function DemoTerritorio() {
  const cv = useRef<HTMLCanvasElement>(null!);
  const [nivel, setNivel] = useState(0.32);
  const N = 72;
  const st = useRef<{ h: Float32Array; barrera: Uint8Array; agua: Uint8Array } | null>(null);
  if (!st.current) {
    const nz = createNoise2D(() => 0.42);
    const h = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = x / N - 0.5, dy = y / N - 0.5; h[y * N + x] = Math.max(0, 1 - Math.hypot(dx * 1.4, dy * 2.2) * 1.6) * 0.8 + nz(x * 0.06, y * 0.06) * 0.18 + 0.1; }
    st.current = { h, barrera: new Uint8Array(N * N), agua: new Uint8Array(N * N) };
  }
  const simular = () => {
    // inundación desde el borde: el agua avanza por celdas bajo el nivel que no estén protegidas
    const { h, barrera, agua } = st.current!; agua.fill(0);
    const q: number[] = [];
    for (let i = 0; i < N; i++) for (const k of [i, (N - 1) * N + i, i * N, i * N + N - 1]) if (h[k] < nivel && !barrera[k]) { agua[k] = 1; q.push(k); }
    while (q.length) { const k = q.pop()!; const x = k % N, y = (k / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const j = ny * N + nx; if (!agua[j] && !barrera[j] && h[j] < nivel) { agua[j] = 1; q.push(j); } } }
    dibujar();
  };
  const dibujar = () => {
    const c = cv.current; if (!c) return; const x = c.getContext('2d')!; const s = c.width / N;
    const { h, barrera, agua } = st.current!;
    let inund = 0, tierra = 0;
    for (let k = 0; k < N * N; k++) {
      const v = h[k]; const px = (k % N) * s, py = ((k / N) | 0) * s;
      if (v >= 0.2) tierra++;
      if (agua[k] && v >= 0.2) inund++;
      x.fillStyle = barrera[k] ? '#D5FF3F' : agua[k] ? (v < 0.2 ? '#0e2a44' : '#304FFE') : `rgb(${40 + v * 160},${50 + v * 150},${40 + v * 90})`;
      x.fillRect(px, py, s + 0.5, s + 0.5);
    }
    x.fillStyle = '#08090C'; x.fillRect(6, 6, 260, 24); x.fillStyle = '#F4F3EF'; x.font = '12px JetBrains Mono';
    x.fillText('Celdas de tierra inundadas: ' + Math.round((inund / Math.max(1, tierra)) * 100) + '%', 12, 22);
  };
  useEffect(simular, [nivel]);
  const pintar = (ev: React.PointerEvent) => {
    if (ev.buttons !== 1) return;
    const r = cv.current.getBoundingClientRect(); const x = Math.floor(((ev.clientX - r.left) / r.width) * N), y = Math.floor(((ev.clientY - r.top) / r.height) * N);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) st.current!.barrera[ny * N + nx] = 1; }
    simular();
  };
  return (
    <div>
      <p className="ayuda">Autómata de inundación sobre un terreno sintético. Suba el nivel del agua y dibuje barreras (manglar o dique) para proteger zonas. Modelo ilustrativo, sin calibración.</p>
      <canvas ref={cv} width={432} height={432} className="lab-canvas" onPointerDown={pintar} onPointerMove={pintar} />
      <label className="control"><span className="mono">Nivel del agua {nivel.toFixed(2)}</span><input type="range" min={0.1} max={0.7} step={0.01} value={nivel} onChange={(e) => setNivel(+e.target.value)} /></label>
      <button className="btn-sec" onClick={() => { st.current!.barrera.fill(0); simular(); }}>Quitar barreras</button>
    </div>
  );
}

function DemoRed() {
  const ref = useRef<SVGSVGElement>(null!);
  const [n, setN] = useState(0);
  useEffect(() => {
    const W = 460, H = 380;
    const svg = d3.select(ref.current).attr('viewBox', `0 0 ${W} ${H}`);
    svg.selectAll('*').remove();
    const nodos: any[] = d3.range(26).map((i) => ({ id: i }));
    const links: any[] = [];
    nodos.forEach((d, i) => { if (i) links.push({ source: i, target: Math.floor(Math.pow(Math.random(), 1.8) * i) }); });
    for (let k = 0; k < 10; k++) links.push({ source: Math.floor(Math.random() * 26), target: Math.floor(Math.random() * 26) });
    const sim = d3.forceSimulation(nodos).force('link', d3.forceLink(links).distance(34)).force('charge', d3.forceManyBody().strength(-90)).force('center', d3.forceCenter(W / 2, H / 2));
    const gL = svg.append('g'); const gN = svg.append('g');
    const actualizar = () => {
      const grado: Record<number, number> = {}; links.forEach((l) => { grado[l.source.id ?? l.source] = (grado[l.source.id ?? l.source] || 0) + 1; grado[l.target.id ?? l.target] = (grado[l.target.id ?? l.target] || 0) + 1; });
      const L = gL.selectAll<SVGLineElement, any>('line').data(links).join('line').attr('stroke', '#304FFE').attr('stroke-opacity', 0.7);
      const N = gN.selectAll<SVGCircleElement, any>('circle').data(nodos).join('circle')
        .attr('r', (d) => 4 + (grado[d.id] || 0) * 1.6).attr('fill', (d) => ((grado[d.id] || 0) > 4 ? '#D5FF3F' : '#F4F3EF')).style('cursor', 'grab')
        .call(d3.drag<SVGCircleElement, any>().on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }).on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; }).on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
      N.on('dblclick', (_e, d) => { const nuevo = { id: nodos.length, x: d.x + 10, y: d.y + 10 }; nodos.push(nuevo); links.push({ source: nuevo, target: d }); sim.nodes(nodos); (sim.force('link') as any).links(links); sim.alpha(0.8).restart(); actualizar(); });
      sim.on('tick', () => { L.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y); N.attr('cx', (d) => d.x).attr('cy', (d) => d.y); });
      setN(nodos.length);
    };
    actualizar();
    return () => { sim.stop(); };
  }, []);
  return (
    <div>
      <p className="ayuda">Red de actores con simulación de fuerzas. Arrastre nodos; doble clic agrega un actor conectado. El tamaño indica el grado (número de relaciones); en lima los nodos más conectados. Red sintética.</p>
      <svg ref={ref} className="lab-svg" />
      <p className="mono dato">Nodos: {n}</p>
    </div>
  );
}

const VARS = { 'Área verde por habitante': [3.1, 5.4, 2.2, 7.8, 4.6, 1.9], 'Distancia a transporte (min)': [6, 12, 4, 18, 9, 14], 'Densidad (viv/ha)': [120, 80, 160, 45, 95, 140] } as Record<string, number[]>;
function DemoDatos() {
  const ref = useRef<SVGSVGElement>(null!);
  const [v, setV] = useState(Object.keys(VARS)[0]);
  useEffect(() => {
    const W = 460, H = 300, m = { l: 40, r: 10, t: 16, b: 34 };
    const svg = d3.select(ref.current).attr('viewBox', `0 0 ${W} ${H}`);
    const datos = VARS[v].map((y, i) => ({ k: 'Zona ' + String.fromCharCode(65 + i), y }));
    const x = d3.scaleBand().domain(datos.map((d) => d.k)).range([m.l, W - m.r]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(datos, (d) => d.y)! * 1.15]).range([H - m.b, m.t]);
    svg.selectAll<SVGGElement, null>('g.ex').data([null]).join('g').attr('class', 'ex').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickSizeOuter(0) as any);
    svg.selectAll<SVGGElement, null>('g.ey').data([null]).join('g').attr('class', 'ey').attr('transform', `translate(${m.l},0)`).transition().duration(700).call(d3.axisLeft(y).ticks(5) as any);
    svg.selectAll<SVGRectElement, any>('rect').data(datos, (d: any) => d.k).join((e) => e.append('rect').attr('y', H - m.b).attr('height', 0))
      .attr('x', (d) => x(d.k)!).attr('width', x.bandwidth()).attr('fill', (_d, i) => (i % 2 ? '#304FFE' : '#D5FF3F'))
      .transition().duration(900).ease(d3.easeCubicOut).delay((_d, i) => i * 60).attr('y', (d) => y(d.y)).attr('height', (d) => H - m.b - y(d.y));
  }, [v]);
  return (
    <div>
      <p className="ayuda">Visualización enlazada a datos. Cambie la variable: escalas y barras se recalculan. <b>Datos de ejemplo, no corresponden a ningún lugar real.</b></p>
      <select className="sel" value={v} onChange={(e) => setV(e.target.value)}>{Object.keys(VARS).map((k) => <option key={k}>{k}</option>)}</select>
      <svg ref={ref} className="lab-svg eje" />
    </div>
  );
}

const CODIGO = `// x, y entre 0 y 1; t = tiempo en segundos
// devuelva un valor 0..1: altura y color del punto
const d = Math.hypot(x - 0.5, y - 0.5);
return 0.5 + 0.5 * Math.sin(d * 28 - t * 2);`;
function DemoCodigo() {
  const cv = useRef<HTMLCanvasElement>(null!);
  const [src, setSrc] = useState(CODIGO);
  const [err, setErr] = useState('');
  const fn = useRef<(x: number, y: number, t: number) => number>(() => 0);
  useEffect(() => {
    try { fn.current = new Function('x', 'y', 't', src) as any; fn.current(0.5, 0.5, 0); setErr(''); } catch (e: any) { setErr(e.message); }
  }, [src]);
  useEffect(() => {
    let id = 0;
    const f = (tm: number) => {
      const c = cv.current; if (!c) return; const x = c.getContext('2d')!; const n = 36, s = c.width / n;
      x.fillStyle = '#08090C'; x.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        let v = 0; try { v = Math.min(1, Math.max(0, +fn.current(i / n, j / n, tm / 1000) || 0)); } catch { v = 0; }
        x.fillStyle = `rgb(${48 + v * 165},${79 + v * 176},${254 - v * 191})`;
        const r = (0.15 + v * 0.85) * s * 0.45; x.beginPath(); x.arc(i * s + s / 2, j * s + s / 2, r, 0, 7); x.fill();
      }
      id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="lab-codigo">
      <p className="ayuda">Edite el código: el patrón se recalcula en vivo. Así se enseña programación aplicada al diseño de fachadas, pavimentos o celosías.</p>
      <textarea spellCheck={false} value={src} onChange={(e) => setSrc(e.target.value)} />
      {err && <p className="error mono">{err}</p>}
      <canvas ref={cv} width={360} height={360} className="lab-canvas" />
    </div>
  );
}

function DemoInmersivo() {
  return (
    <div>
      <p className="ayuda">La experiencia que está recorriendo es en sí misma la demostración inmersiva. Entre al recorrido virtual del edificio patrimonial o al territorio.</p>
      <div className="fila">
        <button className="btn" onClick={() => { useSt.getState().set({ patri: { modo: 'recorrido' } }); irEscena(5, 3); }}>Recorrido patrimonial</button>
        <button className="btn-sec" onClick={() => irEscena(5, 4)}>Territorio interactivo</button>
        <button className="btn-sec" onClick={() => irEscena(5, 2)}>Ciudad en capas</button>
      </div>
    </div>
  );
}

function DemoApps() {
  const [ver, setVer] = useState<string | null>(null);
  return (
    <div>
      <p className="ayuda">Espacios configurables para las plataformas desarrolladas por las autoras (archivo <code>src/data/autoras.ts</code>).</p>
      <div className="apps">
        {PROYECTOS_AUTORAS.map((p, i) => (
          <div key={i} className={'app ' + (p.url ? '' : 'vacio')}>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            <b>{p.titulo}</b>
            {p.confirmar && <em className="mono">por confirmar</em>}
            {p.nota && <small>{p.nota}</small>}
            {p.url && <div className="fila"><button className="btn-sec" onClick={() => setVer(p.url!)}>Vista previa</button><a className="btn-sec" href={p.url} target="_blank" rel="noreferrer">Abrir</a></div>}
          </div>
        ))}
      </div>
      {ver && (
        <div className="visor" onClick={() => setVer(null)}>
          <iframe src={ver} title="Vista previa" onClick={(e) => e.stopPropagation()} />
          <button className="btn" onClick={() => setVer(null)}>Cerrar vista previa</button>
        </div>
      )}
    </div>
  );
}
