import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useIsMobile } from '../../components/ui/use-mobile';
import { BlackDiamondIcon } from './BlackDiamondIcon';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

ScrollTrigger.config({ ignoreMobileResize: true });

const DESKTOP_FRAME_COUNT = 181;
const MOBILE_FRAME_COUNT = 80;
const INITIAL_PRELOAD_COUNT = 15;
const TARGET_FPS = 26; // Fluidez cinemática de alta gama (26 FPS ~38ms/frame)

const framePath = (mobile: boolean, index: number) =>
  `/hero3d/${mobile ? 'mobile' : 'desktop'}/frame-${String(index + 1).padStart(4, '0')}.webp`;

export function Hero3D({ id }: { id?: string }) {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);

  const currentFrameRef = useRef<number>(0);
  const directionRef = useRef<number>(1); // 1 = forward, -1 = reverse (ping-pong suave)
  const lastTimeRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const onChange = () => setReducedMotion(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Función optimizada de renderizado en Canvas con ajuste de aspecto cover
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;
    const safeIndex = Math.max(0, Math.min(frameCount - 1, Math.round(index)));
    const img = imagesRef.current[safeIndex];

    if (!img || !img.complete || img.naturalWidth === 0) {
      // Si el frame no ha terminado de cargar, buscar el más cercano cargado hacia atrás
      for (let fallback = safeIndex - 1; fallback >= 0; fallback--) {
        const fbImg = imagesRef.current[fallback];
        if (fbImg && fbImg.complete && fbImg.naturalWidth > 0) {
          renderImgToCanvas(ctx, canvas, fbImg);
          return;
        }
      }
      return;
    }

    renderImgToCanvas(ctx, canvas, img);
  }, [isMobile]);

  const renderImgToCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  };

  // Carga progresiva e instantánea de frames
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;
    const images: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);

    const loadImage = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          images[i] = img;
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = framePath(isMobile, i);
      });

    (async () => {
      // 1. Cargar primeros frames de manera inmediata para empezar a reproducir de inmediato
      const preloadCount = Math.min(INITIAL_PRELOAD_COUNT, frameCount);
      await Promise.all(Array.from({ length: preloadCount }, (_, i) => loadImage(i)));
      if (cancelled) return;

      imagesRef.current = images;
      setReady(true);
      drawFrame(0);

      // 2. Cargar el resto de frames en segundo plano de forma fluida y continua
      for (let i = preloadCount; i < frameCount; i++) {
        if (cancelled) return;
        await loadImage(i);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isMobile, drawFrame]);

  // Redimensionar canvas de forma adaptativa y nítida
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
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, [ready, drawFrame]);

  // Bucle de animación dinámico continuo (Autoplay suave a 26-28 FPS)
  useEffect(() => {
    if (!ready || reducedMotion) return;

    const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;
    const frameInterval = 1000 / TARGET_FPS;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;

      // Si el usuario no está scrolleando activamente, avanzar fluidamente en ping-pong
      if (!isScrollingRef.current && delta >= frameInterval) {
        lastTimeRef.current = timestamp - (delta % frameInterval);

        let next = currentFrameRef.current + directionRef.current;
        if (next >= frameCount - 1) {
          next = frameCount - 1;
          directionRef.current = -1; // Invierte suavemente
        } else if (next <= 0) {
          next = 0;
          directionRef.current = 1; // Vuelve a avanzar
        }

        currentFrameRef.current = next;
        drawFrame(next);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [ready, reducedMotion, isMobile, drawFrame]);

  // GSAP: Scroll dinámico, cinemático y ultra-fluido con lerp suave
  useGSAP(
    () => {
      if (!ready || reducedMotion || !sectionRef.current) return;
      const frameCount = isMobile ? MOBILE_FRAME_COUNT : DESKTOP_FRAME_COUNT;

      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=130%', // Distancia de pin natural sin atrapar al usuario
        pin: true,
        scrub: 1.2, // Amortiguación e inercia líquida (GSAP lerping)
        onUpdate: (self) => {
          isScrollingRef.current = true;
          setHasScrolled(self.progress > 0.03);

          // Limpiar timeout previo y reanudar autoplay suave 350ms después de detener scroll
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false;
          }, 350);

          // Mapear progreso suavemente al frame correspondiente
          const targetFrame = Math.min(frameCount - 1, Math.round(self.progress * (frameCount - 1)));
          currentFrameRef.current = targetFrame;
          drawFrame(targetFrame);

          // Efecto cinemático: zoom de cámara sutil (1.00 -> 1.07) y oscurecimiento progresivo
          if (canvasRef.current) {
            const scale = 1 + self.progress * 0.07;
            gsap.set(canvasRef.current, {
              scale,
              transformOrigin: 'center center',
            });
          }

          // Desvanecer sutilmente el overlay indicador inferior
          if (indicatorRef.current) {
            gsap.set(indicatorRef.current, {
              opacity: Math.max(0, 1 - self.progress * 4),
              y: self.progress * 25,
            });
          }
        },
      });

      return () => {
        st.kill();
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    },
    { dependencies: [ready, reducedMotion, isMobile, drawFrame] }
  );

  return (
    <section 
      id={id} 
      ref={sectionRef} 
      className="relative w-full h-[100dvh] overflow-hidden bg-black select-none"
    >
      {/* Canvas con la secuencia de video ultra fluida */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full block will-change-transform" 
      />

      {/* Viñeta cinematográfica de lujo: bordes sutilmente oscurecidos para profundidad */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" 
      />

      {/* Gradiente de transición suave hacia la sección de modelos */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* Indicador interactivo inferior: "Scroll para explorar" */}
      <div 
        ref={indicatorRef}
        className={`absolute bottom-8 inset-x-0 flex flex-col items-center justify-center gap-2 pointer-events-none transition-opacity duration-500 z-10 ${
          hasScrolled ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 border border-[#d4af37]/30 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.2)] animate-pulse">
          <BlackDiamondIcon size={13} glow={true} />
          <span className="text-[10px] font-black tracking-[0.25em] text-[#d4af37] uppercase">
            Scroll para explorar
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#d4af37]/70 animate-bounce" />
      </div>
    </section>
  );
}
