// Ajuste automático: ningún bloque de texto debe requerir scroll.
// Cada contenedor se mide y, si su contenido no cabe, se reduce con `zoom` (que sí reacomoda el
// texto, a diferencia de transform) lo justo para que quepa. Se recalcula al cambiar el tamaño de
// la ventana o el contenido. En celular el mínimo es mayor: si aun así no cabe, queda scroll.
const SELECTORES = ['.ov', '.panel-piloto', '.panel-foco'];

function cabe(el: HTMLElement) {
  return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
}

// --k compensa los márgenes/posiciones en CSS (calc(x / var(--k))) para que no se encojan con el zoom
const z = (el: HTMLElement, k: number) => { (el.style as any).zoom = String(k); el.style.setProperty('--k', String(k)); };

function ajustar(el: HTMLElement, min: number) {
  z(el, 1);
  if (cabe(el)) { el.dataset.ajuste = '1'; return; }
  let lo = min, hi = 1;
  for (let i = 0; i < 8; i++) {
    const m = (lo + hi) / 2;
    z(el, m);
    if (cabe(el)) lo = m; else hi = m;
  }
  z(el, lo);
  el.dataset.ajuste = lo.toFixed(2);
}

let pendiente = 0;
export function ajustarTodo() {
  cancelAnimationFrame(pendiente);
  pendiente = requestAnimationFrame(() => {
    const movil = innerWidth < 820;
    const min = movil ? 0.78 : 0.55;
    // primero los paneles internos, luego la capa completa
    for (const sel of ['.panel-piloto', '.panel-foco', '.ov']) {
      document.querySelectorAll<HTMLElement>('.overlays ' + sel).forEach((el) => ajustar(el, min));
    }
  });
}

export function iniciarAjuste() {
  const raiz = document.querySelector('.overlays');
  if (!raiz) return;
  const mo = new MutationObserver(() => ajustarTodo());
  mo.observe(raiz, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['open', 'class'] });
  addEventListener('resize', ajustarTodo);
  document.fonts?.ready.then(ajustarTodo);
  ajustarTodo();
  void SELECTORES;
}
