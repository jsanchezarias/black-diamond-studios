import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useIsMobile } from '../../components/ui/use-mobile';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// En móviles, mostrar/ocultar la barra de direcciones cambia la altura de la ventana.
// Sin esto, ScrollTrigger recalcula el pin a mitad de scroll y deja un hueco negro
// entre el video y la siguiente sección.
ScrollTrigger.config({ ignoreMobileResize: true });

const DESKTOP_FRAME_COUNT = 181;
const MOBILE_FRAME_COUNT = 80;
const PRELOAD_BLOCKING_COUNT = 10;

const framePath = (mobile: boolean, index: number) =>
  `/hero3d/${mobile ? 'mobile' : 'desktop'}/frame-${String(index + 1).padStart(4, '0')}.webp`;

export function Hero3D({ id }: { id?: string }) {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const onChange = () => setReducedMotion(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0) return;

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvasW / canvasH;

    let drawW: number, drawH: number, offsetX: number, offsetY: number;
    if (imgRatio > canvasRatio) {
      drawH = canvasH;
      drawW = drawH * imgRatio;
      offsetX = (canvasW - drawW) / 2;
      offsetY = 0;
    } else {
      drawW = canvasW;
      drawH = drawW / imgRatio;
      offsetX = 0;
      offsetY = (canvasH - drawH) / 2;
    }

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  };

  // Precarga: primeros frames bloqueantes, el resto en segundo plano
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;
    const images: HTMLImageElement[] = new Array(frameCount);

    const loadImage = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = framePath(isMobile, i);
        images[i] = img;
      });

    const blockingCount = Math.min(PRELOAD_BLOCKING_COUNT, frameCount);

    (async () => {
      await Promise.all(Array.from({ length: blockingCount }, (_, i) => loadImage(i)));
      if (cancelled) return;
      imagesRef.current = images;
      setReady(true);
      drawFrame(0);

      for (let i = blockingCount; i < frameCount; i++) {
        if (cancelled) return;
        await loadImage(i);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  // Ajustar el canvas a la resolución real del contenedor
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = section.clientWidth * dpr;
      canvas.height = section.clientHeight * dpr;
      drawFrame(currentFrameRef.current);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [ready]);

  // Fallback estático (prefers-reduced-motion): último frame, sin pin ni scrub
  useEffect(() => {
    if (reducedMotion && ready) {
      const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;
      currentFrameRef.current = frameCount - 1;
      drawFrame(frameCount - 1);
    }
  }, [reducedMotion, ready, isMobile]);

  useGSAP(
    () => {
      if (!ready || reducedMotion || !sectionRef.current) return;
      const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;

      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=250%',
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(frameCount - 1, Math.floor(self.progress * (frameCount - 1)));
          currentFrameRef.current = idx;
          drawFrame(idx);
        },
      });

      return () => st.kill();
    },
    { dependencies: [ready, reducedMotion, isMobile] }
  );

  return (
    <section id={id} ref={sectionRef} className="relative w-full h-[100dvh] overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Desvanece el propio video a negro cerca del final, para que la transición a la siguiente sección no se vea cortada */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-black pointer-events-none" />
    </section>
  );
}
