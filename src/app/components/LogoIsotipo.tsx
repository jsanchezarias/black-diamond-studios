interface LogoIsotipoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Isotipo minimalista de Black Diamond Studios
 * Versión compacta con diamante geométrico + iniciales "BDS"
 * Diseñado para dashboards internos y headers
 */
export function LogoIsotipo({ className = '', size = 'md' }: LogoIsotipoProps) {
  const sizeClasses = {
    xs: 'h-8 w-auto',
    sm: 'h-10 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto'
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative ${className} diamond-glow`}>
      <svg 
        viewBox="0 0 120 45" 
        className={`${sizeClass} object-contain drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Diamante geométrico minimalista */}
        <g>
          {/* Parte superior del diamante */}
          <path 
            d="M25 5 L35 15 L25 15 L15 15 Z" 
            fill="url(#diamondTopGrad)"
            stroke="url(#diamondStroke)"
            strokeWidth="0.5"
          />
          
          {/* Parte inferior del diamante */}
          <path 
            d="M15 15 L25 35 L35 15 Z" 
            fill="url(#diamondBottomGrad)"
            stroke="url(#diamondStroke)"
            strokeWidth="0.5"
          />
          
          {/* Líneas de refracción internas */}
          <line x1="20" y1="15" x2="25" y2="25" stroke="url(#refractionGrad)" strokeWidth="0.5" opacity="0.4" />
          <line x1="30" y1="15" x2="25" y2="25" stroke="url(#refractionGrad)" strokeWidth="0.5" opacity="0.4" />
        </g>

        {/* Iniciales BDS */}
        <text 
          x="52" 
          y="28" 
          fontFamily="Playfair Display, serif" 
          fontSize="22" 
          fontWeight="700" 
          fill="url(#textGradient)" 
          letterSpacing="2"
        >
          BDS
        </text>
        
        {/* Línea decorativa debajo */}
        <line 
          x1="52" 
          y1="32" 
          x2="110" 
          y2="32" 
          stroke="url(#lineGradient)" 
          strokeWidth="1"
          opacity="0.6"
        />
        
        {/* Texto secundario "STUDIOS" */}
        <text 
          x="52" 
          y="40" 
          fontFamily="Montserrat, sans-serif" 
          fontSize="7" 
          fontWeight="400" 
          fill="#c9a961" 
          letterSpacing="3"
          opacity="0.85"
        >
          STUDIOS
        </text>

        {/* Gradientes y efectos */}
        <defs>
          {/* Gradiente parte superior del diamante */}
          <linearGradient id="diamondTopGrad" x1="25" y1="5" x2="25" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f5d977" />
            <stop offset="100%" stopColor="#e5c767" />
          </linearGradient>
          
          {/* Gradiente parte inferior del diamante */}
          <linearGradient id="diamondBottomGrad" x1="25" y1="15" x2="25" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#c9a961" />
            <stop offset="100%" stopColor="#8b7220" />
          </linearGradient>
          
          {/* Gradiente para el borde del diamante */}
          <linearGradient id="diamondStroke" x1="25" y1="5" x2="25" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f5d977" opacity="0.8" />
            <stop offset="100%" stopColor="#c9a961" opacity="0.6" />
          </linearGradient>
          
          {/* Gradiente para líneas de refracción */}
          <linearGradient id="refractionGrad" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f5d977" />
          </linearGradient>
          
          {/* Gradiente para el texto BDS */}
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5c767" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#c9a961" />
          </linearGradient>
          
          {/* Gradiente para la línea decorativa */}
          <linearGradient id="lineGradient" x1="52" y1="0" x2="110" y2="0">
            <stop offset="0%" stopColor="#c9a961" />
            <stop offset="100%" stopColor="#c9a961" opacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
