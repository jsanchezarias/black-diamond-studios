import { useEffect, useRef } from 'react';

/**
 * GoldenCursor — Cursor personalizado de Black Diamond Studios
 * Reemplaza el cursor nativo con un círculo dorado con trail de partículas suave.
 * Optimizado con delegación de eventos en document para eliminar fugas de memoria y reflows.
 */
export function GoldenCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const trailsRef = useRef<HTMLDivElement[]>([]);
  const posRef = useRef({ x: -200, y: -200 });
  const dotPosRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Solo en dispositivos con mouse/hover real
    if (window.matchMedia('(hover: none)').matches) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    const TRAIL_COUNT = 6;
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
        width: ${5 * scale}px;
        height: ${5 * scale}px;
        background: rgba(201, 169, 97, ${0.5 * scale});
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

    // Delegación de eventos pura: sin setInterval ni re-escaneo periódico
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('a, button, [role="button"], input, select, textarea, [data-cursor="hover"]')) {
        cursor.style.transform = 'translate(-50%,-50%) scale(1.6)';
        cursor.style.borderColor = 'rgba(201, 169, 97, 0.9)';
        cursor.style.backgroundColor = 'rgba(201, 169, 97, 0.2)';
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('a, button, [role="button"], input, select, textarea, [data-cursor="hover"]')) {
        cursor.style.transform = 'translate(-50%,-50%) scale(1)';
        cursor.style.borderColor = 'rgba(201, 169, 97, 0.7)';
        cursor.style.backgroundColor = 'transparent';
      }
    };

    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const animate = () => {
      dotPosRef.current.x += (posRef.current.x - dotPosRef.current.x) * 0.2;
      dotPosRef.current.y += (posRef.current.y - dotPosRef.current.y) * 0.2;

      cursor.style.left = `${posRef.current.x}px`;
      cursor.style.top = `${posRef.current.y}px`;

      dot.style.left = `${dotPosRef.current.x}px`;
      dot.style.top = `${dotPosRef.current.y}px`;

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
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('mousemove', onMouseMove);
      trails.forEach(t => t.remove());
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 1000000,
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'rgba(201, 169, 97, 0.9)',
          transform: 'translate(-50%, -50%)',
          left: '-200px',
          top: '-200px',
          willChange: 'left, top',
          mixBlendMode: 'screen',
          transition: 'transform 0.15s ease-out, background-color 0.15s ease-out',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 999999,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1.5px solid rgba(201, 169, 97, 0.65)',
          backgroundColor: 'transparent',
          transform: 'translate(-50%, -50%)',
          left: '-200px',
          top: '-200px',
          willChange: 'left, top',
          transition: 'border-color 0.2s, background-color 0.2s, transform 0.2s',
        }}
      />
    </>
  );
}
