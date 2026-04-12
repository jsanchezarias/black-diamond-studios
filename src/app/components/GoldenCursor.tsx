import { useEffect, useRef } from 'react';

/**
 * GoldenCursor — Cursor personalizado de Black Diamond Studios
 * Reemplaza el cursor nativo con un círculo dorado con trail de partículas.
 * Solo activo en desktop (pointer device).
 */
export function GoldenCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const trailsRef = useRef<HTMLDivElement[]>([]);
  const posRef = useRef({ x: -200, y: -200 });
  const dotPosRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);
  const isHoveringRef = useRef(false);

  useEffect(() => {
    // Solo en dispositivos con mouse
    if (window.matchMedia('(hover: none)').matches) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    const TRAIL_COUNT = 8;
    const trails: HTMLDivElement[] = [];
    const trailPositions: { x: number; y: number }[] = Array.from({ length: TRAIL_COUNT }, () => ({
      x: -200,
      y: -200,
    }));

    // Crear trail elements
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const trail = document.createElement('div');
      const scale = 1 - i / TRAIL_COUNT;
      trail.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 999999;
        border-radius: 50%;
        width: ${6 * scale}px;
        height: ${6 * scale}px;
        background: rgba(212, 175, 55, ${0.6 * scale});
        transform: translate(-50%, -50%);
        transition: none;
        will-change: transform;
      `;
      document.body.appendChild(trail);
      trails.push(trail);
    }
    trailsRef.current = trails;

    const onMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseEnterInteractive = () => {
      isHoveringRef.current = true;
      cursor.style.transform = 'translate(-50%,-50%) scale(1.6)';
      cursor.style.borderColor = 'rgba(229, 193, 88, 0.9)';
      cursor.style.backgroundColor = 'rgba(212, 175, 55, 0.18)';
    };

    const onMouseLeaveInteractive = () => {
      isHoveringRef.current = false;
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursor.style.borderColor = 'rgba(212, 175, 55, 0.7)';
      cursor.style.backgroundColor = 'transparent';
    };

    const addListeners = () => {
      document.querySelectorAll('a, button, [role="button"], input, select, textarea, [data-cursor="hover"]')
        .forEach(el => {
          el.addEventListener('mouseenter', onMouseEnterInteractive);
          el.addEventListener('mouseleave', onMouseLeaveInteractive);
        });
    };

    addListeners();
    // Re-scan periódicamente por elementos dinámicos
    const rescanInterval = setInterval(addListeners, 3000);

    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      // Suavizar posición del anillo exterior (lerp)
      dotPosRef.current.x += (posRef.current.x - dotPosRef.current.x) * 0.18;
      dotPosRef.current.y += (posRef.current.y - dotPosRef.current.y) * 0.18;

      cursor.style.left = `${posRef.current.x}px`;
      cursor.style.top = `${posRef.current.y}px`;

      dot.style.left = `${dotPosRef.current.x}px`;
      dot.style.top = `${dotPosRef.current.y}px`;

      // Trail cascade
      trailPositions.unshift({ x: posRef.current.x, y: posRef.current.y });
      trailPositions.pop();

      trails.forEach((trail, i) => {
        const pos = trailPositions[Math.min(i * 2, trailPositions.length - 1)];
        trail.style.left = `${pos.x}px`;
        trail.style.top = `${pos.y}px`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(rescanInterval);
      window.removeEventListener('mousemove', onMouseMove);
      trails.forEach(t => t.remove());
    };
  }, []);

  return (
    <>
      {/* Punto central — movimiento instantáneo */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 1000000,
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: 'rgba(212, 175, 55, 0.9)',
          transform: 'translate(-50%, -50%)',
          left: '-200px',
          top: '-200px',
          willChange: 'left, top',
          mixBlendMode: 'screen',
        }}
      />
      {/* Anillo exterior — movimiento con lag (lerp) */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 999999,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1.5px solid rgba(212, 175, 55, 0.7)',
          backgroundColor: 'transparent',
          transform: 'translate(-50%, -50%)',
          left: '-200px',
          top: '-200px',
          willChange: 'left, top, transform',
          transition: 'border-color 0.2s, background-color 0.2s, transform 0.2s',
        }}
      />
    </>
  );
}
