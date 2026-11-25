// Recorre escenas y estados en varios tamaños y reporta textos/paneles que no caben.
// uso: node tools/auditar.mjs <carpeta> [anchos,separados] [cap]
import { createRequire } from 'module';
const require = createRequire('C:/Users/aleja/Documents/BACOHLF/package.json');
const puppeteer = require('puppeteer-core');
const out = process.argv[2]; const solo = process.argv[3];
const TAM = [[1920, 1080], [1600, 900], [1887, 905], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [390, 844]].filter(([w]) => !solo || solo === 'todos' || solo.split(',').includes(String(w)));
const ESTADOS = [
  ['intro', 0], ['hero', 1], ['origen', 2], ['origen-nodo', 2, null, { nodo: 'prog' }], ['oportunidad', 3], ['metodo', 4], ['metodo-capa', 4, null, { capa: 2, foco: { tipo: 'capa', id: 2 } }],
  ['pilotos-hub', 5, 0], ['habitat', 5, 1], ['urbanos', 5, 2], ['urbanos-capas', 5, 2, { urbano: { movilidad: true, equipamientos: true, publico: true, ecologica: true, usos: true } }], ['patrimonio', 5, 3], ['territorio', 5, 4], ['panorama', 5, 5],
  ['cronograma', 6], ['crono-semana', 6, null, { semana: 2, foco: { tipo: 'semana', id: 2 } }], ['crono-comparar', 6, null, { comparar: true }],
  ...['modelo', 'territorio', 'red', 'datos', 'codigo', 'inmersivo', 'apps'].map((d) => ['lab-' + d, 7, null, { labDemo: d }]),
  ...['part', 'fin', 'comp', 'pert', 'rep'].map((d) => ['eval-' + d, 8, null, { indicador: d }]),
  ['ruta', 9], ['final', 10],
];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 200)));
const problemas = [];
for (const [w, h] of TAM) {
  await p.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await p.goto('http://localhost:4318/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));
  await p.evaluate(() => window.__urbia.set({ modo: 'exploracion', reducido: true }));
  for (const [nom, i, sub, extra] of ESTADOS) {
    await p.evaluate((i, sub, extra) => { window.__urbia.set({ foco: null, capa: null, semana: null, nodo: null, comparar: false, ...(extra || {}) }); window.__urbia.ir(i, sub ?? undefined); }, i, sub, extra);
    await new Promise((r) => setTimeout(r, 1300));
    const r = await p.evaluate(() => {
      const W = innerWidth, H = innerHeight, res = [];
      const vis = (e) => { if (e.closest('details:not([open])') && !e.matches('summary, summary *, details')) return false; const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && e.getClientRects().length; };
      const nombre = (e) => (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').filter(Boolean).slice(0, 2).join('.') : e.tagName) + (e.textContent ? ' «' + e.textContent.trim().slice(0, 40) + '»' : '');
      const scrollea = (c) => { const s = getComputedStyle(c); const rec = s.overflowY === 'auto' || s.overflowY === 'scroll' || (s.overflowY === 'hidden' && c.matches('.ov, .panel-piloto, .panel-foco')); return rec && c.scrollHeight > c.clientHeight + 4; };
      document.querySelectorAll('.overlays *, .barra *').forEach((e) => {
        if (vis(e) && scrollea(e)) res.push(`SCROLL ${nombre(e).slice(0, 70)} (${e.scrollHeight}>${e.clientHeight})`);
      });
      document.querySelectorAll('.overlays h1,.overlays h2,.overlays h3,.overlays p,.overlays button,.overlays a,.overlays canvas,.overlays svg,.overlays label,.overlays dd,.overlays li,.overlays .panel-piloto,.overlays .panel-foco,.overlays .lab,.overlays .comparador,.overlays .eval, .barra button, .barra .marcas, .pie button').forEach((e) => {
        if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
        if (r.bottom > H + 2 || r.right > W + 2 || r.left < -2 || r.top < -2) {
          let c = e.parentElement, enScroll = false; while (c) { if (scrollea(c)) { enScroll = true; break; } c = c.parentElement; }
          if (!enScroll) res.push(`FUERA ${nombre(e).slice(0, 70)} [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`);
        }
      });
      const barra = document.querySelector('.barra');
      const zonasBarra = barra ? [...barra.querySelectorAll('.marcas, .barra-der > *')].filter(vis).map((x) => x.getBoundingClientRect()) : [];
      const pie = [...document.querySelectorAll('.pie button')].filter(vis).map((x) => x.getBoundingClientRect());
      const choca = (r, q) => r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top;
      document.querySelectorAll('.overlays h1,.overlays h2,.overlays h3,.overlays p,.overlays button,.overlays a,.overlays .panel-piloto,.overlays .panel-foco,.overlays .lab,.overlays .comparador,.overlays .eval, .overlays label').forEach((e) => {
        if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.height < 2) return;
        for (const q of zonasBarra) if (choca(r, q)) { res.push(`CHOCA-BARRA ${nombre(e).slice(0, 60)}`); break; }
        for (const q of pie) if (choca(r, q)) { res.push(`CHOCA-PIE ${nombre(e).slice(0, 60)}`); break; }
      });
      if (document.documentElement.scrollWidth > W + 1) res.push('ANCHO-PAGINA ' + document.documentElement.scrollWidth);
      document.querySelectorAll('[data-ajuste]').forEach((e) => { if (vis(e) && +e.dataset.ajuste < 0.8) res.push('ZOOM ' + e.dataset.ajuste + ' ' + nombre(e).slice(0, 40)); });
      return [...new Set(res)];
    });
    if (r.length) { problemas.push(`${w}x${h} ${nom}`); r.slice(0, 8).forEach((x) => problemas.push('   ' + x)); }
    if (process.argv[4] === 'cap') await p.screenshot({ path: `${out}/a_${w}_${nom}.png` });
  }
}
console.log(problemas.join('\n') || 'SIN PROBLEMAS');
await b.close();
