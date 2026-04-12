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
  type: 'circle' | 'diamond' | 'spark';
  rotation: number;
  rotationSpeed: number;
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

const GOLD = '#d4af37';
const GOLD_LIGHT = '#e5c158';
const GOLD_DIM = '#b8941f';
const GOLD_FAINT = '#7a6020';

const COLORS = [GOLD, GOLD_LIGHT, GOLD_DIM, GOLD_FAINT, '#ffffff'];
const COLOR_WEIGHTS = [0.35, 0.25, 0.2, 0.15, 0.05];

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
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  const DENSITY_MAP = { low: 60, medium: 100, high: 160 };

  const createParticle = useCallback((w: number, h: number, forced?: { x: number; y: number }): Particle => {
    const types: Particle['type'][] = ['circle', 'circle', 'circle', 'diamond', 'spark'];
    const type = types[Math.floor(Math.random() * types.length)];
    const radius = type === 'spark' ? Math.random() * 1.2 + 0.3
      : type === 'diamond' ? Math.random() * 3 + 1.5
      : Math.random() * 2.5 + 0.5;

    return {
      x: forced?.x ?? Math.random() * w,
      y: forced?.y ?? Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35 - 0.08,
      radius,
      opacity: Math.random() * 0.6 + 0.1,
      opacitySpeed: (Math.random() - 0.5) * 0.008,
      color: weightedRandom(COLORS, COLOR_WEIGHTS),
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      life: 0,
      maxLife: Math.random() * 600 + 300,
    };
  }, []);

  const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.6, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.6, 0);
    ctx.closePath();
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

    // Segundo blob de color en esquina
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

      // Nebula layer
      if (showNebula) drawNebula(ctx, w, h, ts);

      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw connections
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

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius) {
          const force = (1 - dist / mouseRadius) * 0.8;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life++;

        // Opacity breathing
        p.opacity += p.opacitySpeed;
        if (p.opacity > 0.8 || p.opacity < 0.05) p.opacitySpeed *= -1;

        // Fade in/out by life
        const lifeRatio = p.life / p.maxLife;
        const lifeFade = lifeRatio < 0.1 ? lifeRatio / 0.1
          : lifeRatio > 0.85 ? (1 - lifeRatio) / 0.15
          : 1;

        const finalOpacity = p.opacity * lifeFade;

        // Wrap / respawn
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

        if (p.type === 'circle') {
          // Glow for brighter particles
          if (p.opacity > 0.45) {
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
            glow.addColorStop(0, p.color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'diamond') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          drawDiamond(ctx, p.x, p.y, p.radius, p.rotation);
          ctx.fill();
        } else {
          // Spark: cross shape
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.8;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(p.x - p.radius * 2, p.y);
          ctx.lineTo(p.x + p.radius * 2, p.y);
          ctx.moveTo(p.x, p.y - p.radius * 2);
          ctx.lineTo(p.x, p.y + p.radius * 2);
          ctx.stroke();
        }

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
