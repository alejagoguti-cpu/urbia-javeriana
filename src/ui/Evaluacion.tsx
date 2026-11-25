import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { INDICADORES } from '../data/contenido';
import { useSt } from '../store';

// Visualiza CÓMO se medirá cada indicador: estructura del gráfico, escalas y momentos.
// No hay resultados: las marcas aparecen vacías (punteadas) hasta que existan datos.
export default function Evaluacion() {
  const ind = useSt((s) => s.indicador);
  const set = useSt((s) => s.set);
  const d = INDICADORES.find((x) => x.id === ind)!;
  const ref = useRef<SVGSVGElement>(null!);
  useEffect(() => {
    const W = 480, H = 280;
    const svg = d3.select(ref.current).attr('viewBox', `0 0 ${W} ${H}`);
    svg.selectAll('*').interrupt().transition().duration(250).style('opacity', 0).remove();
    const g = svg.append('g').style('opacity', 0);
    g.transition().delay(250).duration(500).style('opacity', 1);
    const vacio = (s: d3.Selection<any, any, any, any>) => s.attr('fill', 'none').attr('stroke', '#898D84').attr('stroke-dasharray', '4 4');
    const txt = (x: number, y: number, t: string, anchor = 'middle', c = '#898D84') => g.append('text').attr('x', x).attr('y', y).attr('text-anchor', anchor).attr('fill', c).attr('font-size', 11).attr('font-family', 'JetBrains Mono').text(t);
    if (d.tipo === 'serie') {
      const n = d.id === 'cont' ? 3 : 6;
      const x = d3.scalePoint().domain(d3.range(n).map(String)).range([50, W - 30]);
      g.append('line').attr('x1', 40).attr('x2', W - 20).attr('y1', H - 40).attr('y2', H - 40).attr('stroke', '#3a3f4a');
      g.append('line').attr('x1', 40).attr('x2', 40).attr('y1', 20).attr('y2', H - 40).attr('stroke', '#3a3f4a');
      d3.range(n).forEach((i) => {
        const r = g.append('rect').attr('x', x(String(i))! - 14).attr('width', 28).attr('y', H - 40).attr('height', 0);
        vacio(r).transition().delay(300 + i * 90).duration(700).ease(d3.easeCubicOut).attr('y', 40).attr('height', H - 80);
        txt(x(String(i))!, H - 22, d.id === 'cont' ? ['Cierre', '+3 m', '+6 m'][i] : 'S' + (i + 1));
      });
      txt(44, 14, '100 %', 'start'); txt(W / 2, H - 4, 'sin datos: se completa durante el piloto');
    }
    if (d.tipo === 'embudo') {
      const et = ['Inscritos', 'Asisten', 'Entregan ejercicio', 'Aplican al proyecto'];
      et.forEach((t, i) => {
        const w = W - 80 - i * 70;
        const r = g.append('rect').attr('x', W / 2).attr('y', 20 + i * 58).attr('height', 44).attr('width', 0).attr('rx', 2);
        vacio(r).attr('stroke', i === (d.id === 'fin' ? 2 : 3) ? '#C7FF27' : '#898D84').transition().delay(200 + i * 120).duration(700).ease(d3.easeCubicOut).attr('x', (W - w) / 2).attr('width', w);
        txt(W / 2, 47 + i * 58, t + '  ·  n = ?', 'middle', i === (d.id === 'fin' ? 2 : 3) ? '#C7FF27' : '#898D84');
      });
    }
    if (d.tipo === 'radar') {
      const ejes = ['Programación', 'Simulación', 'Visualización', 'Cartografía', 'Comunicación'];
      const cx = W / 2, cy = H / 2 + 6, R = 100;
      [1, 2, 3, 4, 5].forEach((k) => {
        const pts = ejes.map((_, i) => { const a = (i / ejes.length) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * (R * k) / 5, cy + Math.sin(a) * (R * k) / 5]; });
        g.append('polygon').attr('points', pts.map((p) => p.join(',')).join(' ')).attr('fill', 'none').attr('stroke', '#262a33');
      });
      ejes.forEach((e, i) => {
        const a = (i / ejes.length) * Math.PI * 2 - Math.PI / 2;
        g.append('line').attr('x1', cx).attr('y1', cy).attr('x2', cx).attr('y2', cy).attr('stroke', '#3a3f4a').transition().delay(i * 80).duration(600).attr('x2', cx + Math.cos(a) * R).attr('y2', cy + Math.sin(a) * R);
        txt(cx + Math.cos(a) * (R + 26), cy + Math.sin(a) * (R + 18) + 4, e);
      });
      const leyenda = g.append('g').attr('transform', `translate(14, ${H - 34})`);
      leyenda.append('line').attr('x2', 24).attr('stroke', '#A99BCB').attr('stroke-dasharray', '4 4'); leyenda.append('text').attr('x', 30).attr('y', 4).attr('fill', '#898D84').attr('font-size', 10).attr('font-family', 'JetBrains Mono').text('pre (semana 1)');
      leyenda.append('line').attr('y1', 16).attr('y2', 16).attr('x2', 24).attr('stroke', '#C7FF27').attr('stroke-dasharray', '4 4'); leyenda.append('text').attr('x', 30).attr('y', 20).attr('fill', '#898D84').attr('font-size', 10).attr('font-family', 'JetBrains Mono').text('post (semana 6)');
    }
    if (d.tipo === 'escala') {
      const et = ['1', '2', '3', '4', '5'];
      const x = d3.scaleBand().domain(et).range([40, W - 40]).padding(0.25);
      et.forEach((e, i) => {
        const r = g.append('rect').attr('x', x(e)!).attr('width', x.bandwidth()).attr('y', H - 50).attr('height', 0);
        vacio(r).transition().delay(200 + i * 90).duration(600).attr('y', 50).attr('height', H - 100);
        txt(x(e)! + x.bandwidth() / 2, H - 30, e);
      });
      txt(40, 30, 'Nada útil', 'start'); txt(W - 40, 30, 'Muy útil', 'end'); txt(W / 2, H - 8, 'distribución de respuestas: pendiente');
    }
    if (d.tipo === 'check') {
      const it = ['Guía del ejercicio publicada', 'Código y archivos en repositorio', 'Video o tutorial de apoyo', 'Rúbrica reutilizable', 'Contacto docente para réplica'];
      it.forEach((t, i) => {
        const y = 34 + i * 46;
        const r = g.append('rect').attr('x', 40).attr('y', y - 14).attr('width', 20).attr('height', 20);
        vacio(r).style('opacity', 0).transition().delay(150 + i * 110).style('opacity', 1);
        g.append('text').attr('x', 74).attr('y', y + 1).attr('fill', '#F5F3EB').attr('font-size', 13).attr('font-family', 'Manrope').text(t).style('opacity', 0).transition().delay(200 + i * 110).style('opacity', 1);
      });
    }
  }, [d]);
  return (
    <div className="eval">
      <div className="eval-lista">
        {INDICADORES.map((x, i) => (
          <button key={x.id} className={x.id === ind ? 'on' : ''} onClick={() => set({ indicador: x.id })}>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>{x.t}
          </button>
        ))}
      </div>
      <div className="eval-det">
        <h3>{d.t}</h3>
        <p>{d.como}</p>
        <dl className="mono"><dt>Instrumento</dt><dd>{d.instrumento}</dd><dt>Momento</dt><dd>{d.momento}</dd></dl>
        <svg ref={ref} className="eval-svg" role="img" aria-label={'Esquema de medición: ' + d.t} />
        <p className="nota mono">Esquema del método de medición · sin resultados</p>
      </div>
    </div>
  );
}
