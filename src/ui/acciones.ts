import { START, useSt } from '../store';
import { irA, irEscena } from '../lib/nav';
import { sonar } from '../lib/sonido';

export function empezar(modo: 'presentacion' | 'exploracion') {
  const st = useSt.getState();
  st.set({ modo, inicioPresentacion: Date.now(), menu: modo === 'exploracion' });
  sonar('abrir');
  if (modo === 'presentacion') irA(START[1] + 0.05);
  else if (st.escena === 0) irEscena(1);
}
