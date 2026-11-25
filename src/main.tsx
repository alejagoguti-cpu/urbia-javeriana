import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './premium.css';
import './ajuste.css';
import './tech.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
createRoot(document.getElementById('root')!).render(<App />);

// gancho de auditoría (tools/auditar.mjs): navegar sin animación y fijar estados
import { useSt as __st } from './store';
import { irA as __irA, posDe as __posDe } from './lib/nav';
(window as any).__urbia = { ir: (i: number, sub?: number) => __irA(__posDe(i, sub), { inmediato: true }), set: (p: any) => __st.getState().set(p) };
