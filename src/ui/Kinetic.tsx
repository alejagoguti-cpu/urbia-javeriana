import { motion } from 'framer-motion';
import { useSt } from '../store';

// Tipografía cinética: cada letra entra rotando desde la profundidad con desenfoque.
export function Kinetic({ texto, as = 'h2', className = '', delay = 0 }: { texto: string | string[]; as?: 'h1' | 'h2' | 'h3' | 'p'; className?: string; delay?: number }) {
  const red = useSt((s) => s.reducido);
  const lineas = Array.isArray(texto) ? texto : [texto];
  const Tag = motion[as];
  let k = 0;
  return (
    <Tag className={'kinetic ' + className} aria-label={lineas.join(' ')}>
      {lineas.map((l, li) => (
        <span className="k-linea" key={li} aria-hidden>
          {l.split(' ').map((w, wi) => (
            <span className="k-palabra" key={wi}>
              {w.split('').map((ch, ci) => {
                const i = k++;
                return (
                  <motion.span
                    key={ci}
                    className="k-letra"
                    initial={red ? { opacity: 0 } : { y: '105%', rotateX: -85, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: '0%', rotateX: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={red ? { opacity: 0 } : { y: '-60%', opacity: 0, filter: 'blur(8px)', transition: { duration: 0.35, delay: i * 0.004 } }}
                    transition={{ duration: red ? 0.2 : 0.9, delay: delay + i * (red ? 0 : 0.018), ease: [0.16, 1, 0.3, 1] }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
              &nbsp;
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

export const aparecer = (d = 0) => ({
  initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, delay: d, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -16, filter: 'blur(6px)', transition: { duration: 0.3 } },
});
