import { useEffect, useState } from 'react';

interface GlobalPreloaderProps {
  isReady: boolean;
  onTransitionEnd?: () => void;
}

export function GlobalPreloader({ isReady, onTransitionEnd }: GlobalPreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isReady) {
      // Pequeño retardo para asegurar que el DOM inicialestá listo ante Vercel
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (!isVisible && isReady) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
        isReady ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: '#0f1014' }}
      onTransitionEnd={onTransitionEnd}
    >
      {/* Fondo con sutil gradiente radial */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#c9a961_0%,_transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Diamond Logo Animado */}
        <div className="relative">
          {/* Anillos de luz giratorios */}
          <div className="absolute -inset-4 border border-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute -inset-8 border border-primary/10 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
          
          <div className="w-24 h-24 flex items-center justify-center relative">
            {/* SVG del Diamante Dorado */}
            <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(201,169,97,0.5)]">
              <path
                d="M50 5 L90 35 L50 95 L10 35 Z"
                fill="none"
                stroke="#c9a961"
                strokeWidth="2"
                className="animate-[dash_2s_ease-in-out_infinite]"
                style={{
                    strokeDasharray: '300',
                    strokeDashoffset: '300'
                }}
              />
              <path
                d="M50 5 L70 35 L50 95 L30 35 Z"
                fill="#c9a961"
                className="opacity-20"
              />
            </svg>
            
            {/* Spinner sutil interno */}
            <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
        </div>

        {/* Texto Premium */}
        <div className="text-center space-y-2">
          <h1 
            className="text-3xl font-bold tracking-[0.2em] uppercase" 
            style={{ 
              fontFamily: 'Playfair Display, serif',
              background: 'linear-gradient(to right, #c9a961, #f1d592, #b8956a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Black Diamond
          </h1>
          <div className="flex items-center justify-center gap-4 overflow-hidden">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/50" />
             <span className="text-[10px] tracking-[0.4em] uppercase text-primary/60 font-medium">
               Cargando Experiencia
             </span>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </div>
        </div>

        {/* Barra de progreso sutil */}
        <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary shadow-[0_0_10px_#c9a961] transition-all duration-700 ease-out"
            style={{ width: isReady ? '100%' : '60%' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        .backdrop-blur-premium {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}
