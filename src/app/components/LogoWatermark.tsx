interface LogoWatermarkProps {
  opacity?: number;
  className?: string;
  variant?: 'vertical' | 'horizontal';
}

export function LogoWatermark({ opacity = 0.05, className = '', variant = 'horizontal' }: LogoWatermarkProps) {
  if (variant === 'horizontal') {
    return (
      <div 
        className={`pointer-events-none select-none ${className}`}
        style={{ opacity }}
      >
        <svg 
          viewBox="0 0 400 80" 
          className="w-full h-full object-contain"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Diamante icono */}
          <path 
            d="M40 10L50 30H30L40 10Z" 
            fill="#d4af37"
          />
          <path 
            d="M30 30L40 60L50 30H30Z" 
            fill="url(#gradientWM1)"
          />
          
          {/* Texto BLACK DIAMOND STUDIOS */}
          <text 
            x="70" 
            y="35" 
            fontFamily="Montserrat, sans-serif" 
            fontSize="16" 
            fontWeight="700" 
            fill="#d4af37"
            letterSpacing="1"
          >
            BLACK DIAMOND
          </text>
          <text 
            x="70" 
            y="55" 
            fontFamily="Inter, sans-serif" 
            fontSize="12" 
            fontWeight="400" 
            fill="#d4af37" 
            letterSpacing="3"
          >
            STUDIOS
          </text>
          
          {/* Gradiente */}
          <defs>
            <linearGradient id="gradientWM1" x1="40" y1="30" x2="40" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8b7220" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Logo vertical
  return (
    <div 
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <svg 
        viewBox="0 0 200 250" 
        className="w-full h-full object-contain"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Diamante grande central */}
        <path 
          d="M100 20L140 80H60L100 20Z" 
          fill="#d4af37"
        />
        <path 
          d="M60 80L100 180L140 80H60Z" 
          fill="url(#gradientWM2)"
        />
        
        {/* Texto BLACK */}
        <text 
          x="100" 
          y="210" 
          fontFamily="Montserrat, sans-serif" 
          fontSize="20" 
          fontWeight="700" 
          fill="#d4af37" 
          textAnchor="middle"
          letterSpacing="2"
        >
          BLACK
        </text>
        
        {/* Texto DIAMOND */}
        <text 
          x="100" 
          y="230" 
          fontFamily="Montserrat, sans-serif" 
          fontSize="20" 
          fontWeight="700" 
          fill="#d4af37" 
          textAnchor="middle"
          letterSpacing="2"
        >
          DIAMOND
        </text>
        
        {/* Texto STUDIOS */}
        <text 
          x="100" 
          y="245" 
          fontFamily="Inter, sans-serif" 
          fontSize="10" 
          fontWeight="400" 
          fill="#d4af37" 
          textAnchor="middle"
          letterSpacing="4"
        >
          STUDIOS
        </text>
        
        {/* Gradiente */}
        <defs>
          <linearGradient id="gradientWM2" x1="100" y1="80" x2="100" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8b7220" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
