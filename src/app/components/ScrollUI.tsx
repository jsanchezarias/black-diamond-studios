import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * ScrollUI — Barra de progreso dorada + botón back-to-top premium
 * Se monta encima de toda la UI como overlay fijo.
 */
export function ScrollUI() {
  const [progress, setProgress] = useState(0);
  const [showBtn, setShowBtn] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setProgress(pct);
      setShowBtn(scrollTop > 600);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Barra de progreso ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #b8941f, #d4af37, #e5c158, #d4af37)',
          boxShadow: '0 0 10px rgba(212,175,55,0.7), 0 0 20px rgba(212,175,55,0.35)',
          zIndex: 100001,
          transition: 'width 0.1s linear',
          transformOrigin: 'left',
        }}
        aria-hidden="true"
      />

    </>
  );
}
