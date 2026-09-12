import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacitySpeed: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  cyclePhase: number;
  cycleDuration: number;
}

interface BurstSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface ParticlesBackgroundProps {
  /** Densidade de partículas: low | medium | high */
  density?: 'low' | 'medium' | 'high';
  /** Zona de influência do mouse em pixels */
  mouseRadius?: number;
  /** Mostrar linhas de conexión entre partículas */
  showConnections?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Efecto adicional de resplandor/nebulosa */
  showNebula?: boolean;
}

const RED = '#A11D3A';
const RED_LIGHT = '#c9385a';
const GOLD = '#d4af37';
const GOLD_LIGHT = '#e5c158';

const COLORS = [RED, RED_LIGHT, GOLD, GOLD_LIGHT, '#ffffff'];
const COLOR_WEIGHTS = [0.35, 0.25, 0.2, 0.15, 0.05];

// Diagonal clásica de "flecha atraviesa el corazón" (de abajo-izquierda a arriba-derecha)
const ARROW_BASE_ROTATION = -Math.PI / 4;

function weightedRandom(colors: string[], weights: number[]): string {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < colors.length; i++) {
    acc += weights[i];
    if (r < acc) return colors[i];
  }
  return colors[0];
}

export function ParticlesBackground({
  density = 'medium',
  mouseRadius = 140,
  showConnections = true,
  className = '',
  showNebula = true,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstsRef = useRef<BurstSpark[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  const DENSITY_MAP = { low: 60, medium: 100, high: 160 };

  const createParticle = useCallback((w: number, h: number, forced?: { x: number; y: number }): Particle => {
    // Pequeñas, pero con tamaño suficiente para que el corazón + flecha se distingan
    const radius = Math.random() * 3 + 4;

    return {
      x: forced?.x ?? Math.random() * w,
      y: forced?.y ?? Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35 - 0.08,
      radius,
      opacity: Math.random() * 0.6 + 0.1,
      opacitySpeed: (Math.random() - 0.5) * 0.008,
      color: weightedRandom(COLORS, COLOR_WEIGHTS),
      // Rotación base fija (diagonal clásica de flecha) + leve variación por partícula
      rotation: ARROW_BASE_ROTATION + (Math.random() - 0.5) * 0.6,
      rotationSpeed: (Math.random() - 0.5) * 0.0015,
      life: 0,
      maxLife: Math.random() * 600 + 300,
      // Ciclo propio: cada corazón dispara su flecha en un momento distinto, sin sincronizarse
      cyclePhase: Math.random() * 300,
      cycleDuration: Math.random() * 150 + 110,
    };
  }, []);

  // Pequeño estallido de chispas en el instante exacto en que la flecha atraviesa el corazón
  const spawnBurst = (list: BurstSpark[], x: number, y: number, color: string) => {
    const count = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.7 + Math.random() * 2;
      list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 1.3 + 0.6,
        color,
        life: 0,
        maxLife: 16 + Math.random() * 14,
      });
    }
    if (list.length > 400) list.splice(0, list.length - 400);
  };

  // Corazón + flecha que lo cruza en vuelo (armOffset: posición de la flecha relativa al centro del corazón;
  // armAlpha: opacidad de la flecha, para que aparezca/desaparezca al entrar y salir; heartPulse: golpe de impacto)
  const drawHeartArrow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    rot: number,
    color: string,
    armOffset: number,
    armAlpha: number,
    heartPulse: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Corazón (apunta hacia -y en su eje local, antes de rotar), con un pequeño pulso al momento del impacto
    const s = r * 1.15 * (1 + heartPulse * 0.35);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.65);
    ctx.bezierCurveTo(-s * 1.1, -s * 0.2, -s * 0.55, -s * 1.2, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.55, -s * 1.2, s * 1.1, -s * 0.2, 0, s * 0.65);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    if (armAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha *= armAlpha;

      // Asta de la flecha, desplazada por armOffset a lo largo del eje local X
      const shaftLen = r * 2.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(0.9, r * 0.22);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(armOffset - shaftLen, 0);
      ctx.lineTo(armOffset + shaftLen, 0);
      ctx.stroke();

      // Punta de flecha en el extremo delantero
      const headSize = r * 0.55;
      const headX = armOffset + shaftLen;
      ctx.beginPath();
      ctx.moveTo(headX, 0);
      ctx.lineTo(headX - headSize, -headSize * 0.65);
      ctx.moveTo(headX, 0);
      ctx.lineTo(headX - headSize, headSize * 0.65);
      ctx.stroke();

      // Plumas en el extremo trasero
      const featherSize = r * 0.4;
      const tailX = armOffset - shaftLen;
      ctx.beginPath();
      ctx.moveTo(tailX, 0);
      ctx.lineTo(tailX + featherSize, -featherSize * 0.7);
      ctx.moveTo(tailX, 0);
      ctx.lineTo(tailX + featherSize, featherSize * 0.7);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  };

  const drawNebula = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const cx = w * 0.5 + Math.sin(t * 0.0004) * w * 0.08;
    const cy = h * 0.4 + Math.cos(t * 0.0003) * h * 0.05;

    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.55);
    radial.addColorStop(0, 'rgba(212,175,55,0.045)');
    radial.addColorStop(0.4, 'rgba(212,175,55,0.02)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    const radial2 = ctx.createRadialGradient(w * 0.85, h * 0.15, 0, w * 0.85, h * 0.15, w * 0.3);
    radial2.addColorStop(0, 'rgba(184,148,31,0.03)');
    radial2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial2;
    ctx.fillRect(0, 0, w, h);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      const count = Math.floor((w * h) / (1920 * 1080 / DENSITY_MAP[density]));
      particlesRef.current = Array.from({ length: Math.min(count, DENSITY_MAP[density]) }, () =>
        createParticle(w, h)
      );
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const animate = (ts: number) => {
      timeRef.current = ts;
      ctx.clearRect(0, 0, w, h);

      if (showNebula) drawNebula(ctx, w, h, ts);

      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (showConnections) {
        ctx.save();
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
              const alpha = ((1 - dist / 90) * 0.18 *
                Math.min(particles[i].opacity, particles[j].opacity) * 2).toFixed(3);
              ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius) {
          const force = (1 - dist / mouseRadius) * 0.8;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }

        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life++;

        // Ciclo de la flecha: recorre el corazón una vez por ciclo y dispara el estallido al cruzarlo
        const prevPhase = p.cyclePhase;
        p.cyclePhase += 1;
        const prevT = (prevPhase % p.cycleDuration) / p.cycleDuration;
        const t = (p.cyclePhase % p.cycleDuration) / p.cycleDuration;
        if (prevT < 0.5 && t >= 0.5) {
          spawnBurst(burstsRef.current, p.x, p.y, p.color);
        }

        p.opacity += p.opacitySpeed;
        if (p.opacity > 0.8 || p.opacity < 0.05) p.opacitySpeed *= -1;

        const lifeRatio = p.life / p.maxLife;
        const lifeFade = lifeRatio < 0.1 ? lifeRatio / 0.1
          : lifeRatio > 0.85 ? (1 - lifeRatio) / 0.15
          : 1;

        const finalOpacity = p.opacity * lifeFade;

        if (
          p.life > p.maxLife ||
          p.x < -20 || p.x > w + 20 ||
          p.y < -20 || p.y > h + 20
        ) {
          particles[i] = createParticle(w, h);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, finalOpacity));

        if (p.opacity > 0.45) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.5);
          glow.addColorStop(0, p.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Ventana en la que la flecha está en vuelo, centrada en el instante del impacto (t = 0.5)
        const ARM_WINDOW = 0.22;
        let armOffset = 0;
        let armAlpha = 0;
        if (t > 0.5 - ARM_WINDOW && t < 0.5 + ARM_WINDOW) {
          const armT = (t - (0.5 - ARM_WINDOW)) / (ARM_WINDOW * 2); // 0..1
          const travelRange = p.radius * 6.5;
          armOffset = (armT - 0.5) * travelRange * 2;
          armAlpha = Math.sin(armT * Math.PI); // aparece y desaparece suavemente en los bordes
        }
        const heartPulse = Math.max(0, 1 - Math.abs(t - 0.5) * 18);

        drawHeartArrow(ctx, p.x, p.y, p.radius, p.rotation, p.color, armOffset, armAlpha, heartPulse);

        ctx.restore();
      }

      // Chispas del estallido al cruzar la flecha
      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life++;
        if (b.life > b.maxLife) {
          bursts.splice(i, 1);
          continue;
        }
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.94;
        b.vy *= 0.94;

        const lifeRatio = b.life / b.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - lifeRatio);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [density, mouseRadius, showConnections, showNebula, createParticle, drawNebula]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
