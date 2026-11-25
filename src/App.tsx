import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import World from './three/World';
import Chrome, { LogoSVG } from './ui/Chrome';
import Overlays from './ui/Overlays';
import { S, esMovil, useSt } from './store';
import { iniciarScroll, teclado } from './lib/nav';
import { iniciarAjuste } from './ui/ajuste';

function Cursor() {
  const a = useRef<HTMLDivElement>(null!);
  const b = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    let x = innerWidth / 2, y = innerHeight / 2, bx = x, by = y, id = 0;
    const mv = (e: PointerEvent) => { x = e.clientX; y = e.clientY; S.mx = (x / innerWidth) * 2 - 1; S.my = -((y / innerHeight) * 2 - 1); };
    const f = () => {
      bx += (x - bx) * 0.16; by += (y - by) * 0.16;
      if (a.current) a.current.style.transform = `translate(${x}px,${y}px)`;
      if (b.current) b.current.style.transform = `translate(${bx}px,${by}px)`;
      id = requestAnimationFrame(f);
    };
    addEventListener('pointermove', mv); f();
    return () => { removeEventListener('pointermove', mv); cancelAnimationFrame(id); };
  }, []);
  if (esMovil) return null;
  return (<><div ref={a} className="cursor-punto" /><div ref={b} className="cursor-anillo" /></>);
}

function Cargador() {
  const listo = useSt((s) => s.listo);
  const [n, setN] = useState(0);
  useEffect(() => { const id = setInterval(() => setN((v) => Math.min(listo ? 100 : 92, v + Math.ceil(Math.random() * 9))), 70); return () => clearInterval(id); }, [listo]);
  return (
    <AnimatePresence>
      {!(listo && n >= 100) && (
        <motion.div className="cargador" exit={{ opacity: 0, filter: 'blur(12px)', transition: { duration: 1 } }}>
          <LogoSVG className="cargador-logo" />
          <span className="mono">{String(n).padStart(3, '0')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [dpr, setDpr] = useState(esMovil ? 1.25 : 1.5);
  useEffect(() => { iniciarScroll(); teclado(); iniciarAjuste(); }, []);
  return (
    <>
      <div id="scroll-alto" />
      <div className="lienzo">
        <Canvas
          dpr={dpr}
          shadows={!esMovil}
          camera={{ fov: 40, near: 0.5, far: 2500, position: [0, 0, 40] }}
          gl={{ antialias: !esMovil, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
          onCreated={() => setTimeout(() => useSt.getState().set({ listo: true }), 900)}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(esMovil ? 1.25 : 1.5)} />
          <AdaptiveDpr pixelated={false} />
          <World />
        </Canvas>
      </div>
      <div className="tech-grid" aria-hidden /><div className="tech-scan" aria-hidden />
      <div className="marco" aria-hidden><i /><i /><i /><i /><span>urbia · Pontificia Universidad Javeriana · Propuesta académica en discusión</span></div>
      <Overlays />
      <Chrome />
      <Cursor />
      <Cargador />
    </>
  );
}
