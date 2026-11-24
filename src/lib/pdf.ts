import { jsPDF } from 'jspdf';
import { AUTORAS, AVISO, HERO, INDICADORES, METODO, ORIGEN, OPORTUNIDAD, PILOTOS, RUTA, FINAL, type PilotoId } from '../data/contenido';
import type { Crono } from './crono';
import { fechasSemana } from './crono';

const NEGRO = [8, 9, 12] as const;
const LIMA = [213, 255, 63] as const;
const AZUL = [48, 79, 254] as const;

function base(titulo: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;
  const pagina = () => {
    doc.setFillColor(...NEGRO); doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(244, 243, 239); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('urbia', 14, 12);
    doc.setDrawColor(...LIMA); doc.setLineWidth(1.2); doc.lines([[3.2, 0], [0, 3.2]], 30.5, 7.2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(140, 146, 156);
    doc.text(titulo.toUpperCase(), 196, 11.5, { align: 'right' });
    doc.setFontSize(7); doc.text(AVISO + '  ·  ' + AUTORAS.join(' y '), 14, 290);
    y = 30;
  };
  pagina();
  const salto = (h: number) => { if (y + h > 280) { doc.addPage(); pagina(); } };
  const h1 = (t: string) => { salto(16); doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); const l = doc.splitTextToSize(t, 182); doc.text(l, 14, y); y += l.length * 7 + 3; };
  const h2 = (t: string) => { salto(12); doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(t, 14, y); y += 6; };
  const p = (t: string, size = 9.5) => { doc.setTextColor(40, 42, 48); doc.setFont('helvetica', 'normal'); doc.setFontSize(size); const l = doc.splitTextToSize(t, 182); salto(l.length * 4.6); doc.text(l, 14, y); y += l.length * 4.6 + 2; };
  const li = (t: string) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(40, 42, 48); const l = doc.splitTextToSize(t, 172); salto(l.length * 4.6); doc.setFillColor(...AZUL); doc.rect(16, y - 2.2, 1.6, 1.6, 'F'); doc.text(l, 21, y); y += l.length * 4.6 + 0.8; };
  return { doc, h1, h2, p, li, gap: (n = 4) => { y += n; }, get y() { return y; }, set y(v) { y = v; }, salto };
}

export function pdfPropuesta() {
  const b = base('Propuesta académica');
  b.h1(HERO.titulo.join(' '));
  b.p(HERO.sub, 11);
  b.p('Presentada por ' + AUTORAS.join(' y ') + '. No se propone una nueva asignatura ni una modificación curricular: se plantea una intervención transversal, coordinada con los profesores responsables de cada proyecto.');
  b.gap();
  b.h2('01 · Origen'); b.p(ORIGEN.titulo); b.p(ORIGEN.texto);
  ORIGEN.nodos.forEach((n) => b.li(n.nombre + ': ' + n.texto));
  b.gap();
  b.h2('02 · Oportunidad'); b.p(OPORTUNIDAD.texto);
  OPORTUNIDAD.comparaciones.forEach((c) => b.li(c.a + ' > ' + c.b));
  b.gap();
  b.h2('03 · Metodología'); b.p(METODO.titulo); b.p(METODO.nota);
  METODO.capas.forEach((c) => b.li(c.n + '. ' + c.t + ' — ' + c.d));
  b.gap();
  b.h2('04 · Proyectos piloto');
  PILOTOS.forEach((pl) => {
    b.p('Piloto ' + pl.n + ' — ' + pl.nombre + ' (Profesor: ' + pl.profesor + ')', 10.5);
    b.p(pl.escenario);
    pl.workshops.forEach((w) => b.li(w));
    b.p('Demostración propuesta: ' + pl.demo);
    b.p('Entregable potencial: ' + pl.entregable);
    b.gap(2);
  });
  b.h2('05 · Evaluación del piloto (método, sin resultados)');
  INDICADORES.forEach((i) => b.li(i.t + ': ' + i.como + ' Instrumento: ' + i.instrumento + '. Momento: ' + i.momento + '.'));
  b.gap();
  b.h2('06 · Ruta de implementación');
  RUTA.forEach((r, k) => b.li(String(k + 1).padStart(2, '0') + ' ' + r.t + ': ' + r.d + ' Pendiente: ' + r.pendiente));
  b.gap();
  b.h2('Cierre'); b.p(FINAL.titulo.join(' ')); b.p(FINAL.sub);
  b.doc.save('urbia-propuesta-workshops-javeriana.pdf');
}

export function pdfCronograma(c: Crono, piloto: PilotoId | 'todos') {
  const b = base('Cronograma propuesto');
  const lista = piloto === 'todos' ? PILOTOS : PILOTOS.filter((p) => p.id === piloto);
  b.h1('Cronograma de intervención — ' + (piloto === 'todos' ? 'cuatro pilotos' : lista[0].nombre));
  b.p('Propuesta inicial de ' + c.semanas + ' semanas, ajustable a los tiempos de cada asignatura. Fechas, duraciones y número de sesiones NO están aprobados.');
  lista.forEach((pl) => {
    const cfg = c.pilotos[pl.id];
    b.gap(2); b.h2('Piloto ' + pl.n + ' · ' + pl.nombre + ' · ' + pl.profesor);
    c.plantilla.forEach((s, k) => {
      const f = fechasSemana(c, k);
      b.p('Semana ' + String(s.n).padStart(2, '0') + ' (' + f + ') — ' + s.titulo, 10);
      b.li('Objetivo: ' + s.objetivo);
      b.li('Duración propuesta: ' + cfg.sesionesPorSemana[k] + ' sesión(es) de ' + cfg.duracionHoras[k] + ' h');
      b.li('Actividades: ' + s.actividades.join('; '));
      b.li('Herramientas: ' + (s.herramientas[0].startsWith('Según') ? cfg.herramientas.join(', ') : s.herramientas.join(', ')));
      b.li('Responsables: por definir');
      b.li('Entregable: ' + s.entregable);
      b.li('Relación con el proyecto: ' + s.relacion);
    });
  });
  b.doc.save('urbia-cronograma-' + piloto + '.pdf');
}
