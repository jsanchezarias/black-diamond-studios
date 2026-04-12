import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * ScrollUI — Barra de progreso dorada + botón back-to-top premium
 * Se monta encima de toda la UI como overlay fijo.
 */
export function ScrollUI() {
  const [progress, setProgress] = useState(0);
  const [showBtn, setShowBtn] = useState(false);
  const rafRef = useRef<number>(0);

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

      {/* ── Back-to-top button ── */}
      <button
        onClick={scrollToTop}
        aria-label="Volver al inicio"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '1.5rem',
          zIndex: 100000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '1.5px solid rgba(212,175,55,0.6)',
          background: 'rgba(10,10,8,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: showBtn
            ? '0 0 20px rgba(212,175,55,0.25), 0 4px 16px rgba(0,0,0,0.6)'
            : 'none',
          opacity: showBtn ? 1 : 0,
          pointerEvents: showBtn ? 'auto' : 'none',
          transform: showBtn ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
          transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'none',
        }}
      >
        <ArrowUp
          style={{
            width: '18px',
            height: '18px',
            color: '#d4af37',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
    </>
  );
}
