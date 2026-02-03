interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'vertical' | 'horizontal';
}

export function Logo({ className = '', size = 'md', variant = 'vertical' }: LogoProps) {
  const sizeClasses = {
    vertical: {
      sm: 'w-24 h-auto',
      md: 'w-40 h-auto',
      lg: 'w-56 h-auto',
      xl: 'w-80 h-auto',
      full: 'w-full h-auto max-w-md'
    },
    horizontal: {
      sm: 'h-8 w-auto',
      md: 'h-12 w-auto',
      lg: 'h-16 w-auto',
      xl: 'h-24 w-auto',
      full: 'h-32 w-auto max-w-2xl'
    }
  };

  const sizeClass = sizeClasses[variant][size];

  if (variant === 'horizontal') {
    return (
      <div className={`relative ${className} diamond-glow`}>
        <svg 
          viewBox="0 0 400 80" 
          className={`${sizeClass} object-contain drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]`}
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diamante icono con brillo */}
          <path 
            d="M40 10L50 30H30L40 10Z" 
            fill="url(#diamondTop)"
          />
          <path 
            d="M30 30L40 60L50 30H30Z" 
            fill="url(#gradient1)"
          />
          
          {/* Texto BLACK DIAMOND STUDIOS */}
          <text 
            x="70" 
            y="35" 
            fontFamily="Cinzel, serif" 
            fontSize="18" 
            fontWeight="700" 
            fill="url(#textGradient)" 
            letterSpacing="2"
          >
            BLACK DIAMOND
          </text>
          <text 
            x="70" 
            y="55" 
            fontFamily="Montserrat, sans-serif" 
            fontSize="11" 
            fontWeight="400" 
            fill="#c9a961" 
            letterSpacing="4"
            opacity="0.9"
          >
            STUDIOS
          </text>
          
          {/* Gradientes mejorados */}
          <defs>
            <linearGradient id="diamondTop" x1="40" y1="10" x2="40" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f5d977" />
              <stop offset="100%" stopColor="#c9a961" />
            </linearGradient>
            <linearGradient id="gradient1" x1="40" y1="30" x2="40" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c9a961" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8b7220" />
            </linearGradient>
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c9a961" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#c9a961" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Logo vertical
  return (
    <div className={`relative ${className} diamond-glow`}>
      <svg 
        viewBox="0 0 200 250" 
        className={`${sizeClass} object-contain drop-shadow-[0_0_12px_rgba(201,169,97,0.4)]`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Diamante grande central con brillo */}
        <path 
          d="M100 20L140 80H60L100 20Z" 
          fill="url(#diamondTopV)"
        />
        <path 
          d="M60 80L100 180L140 80H60Z" 
          fill="url(#gradient2)"
        />
        
        {/* Texto BLACK */}
        <text 
          x="100" 
          y="210" 
          fontFamily="Cinzel, serif" 
          fontSize="22" 
          fontWeight="700" 
          fill="url(#textGradientV)" 
          textAnchor="middle"
          letterSpacing="3"
        >
          BLACK
        </text>
        
        {/* Texto DIAMOND */}
        <text 
          x="100" 
          y="230" 
          fontFamily="Cinzel, serif" 
          fontSize="22" 
          fontWeight="700" 
          fill="url(#textGradientV)" 
          textAnchor="middle"
          letterSpacing="3"
        >
          DIAMOND
        </text>
        
        {/* Texto STUDIOS */}
        <text 
          x="100" 
          y="245" 
          fontFamily="Montserrat, sans-serif" 
          fontSize="10" 
          fontWeight="400" 
          fill="#c9a961" 
          textAnchor="middle"
          letterSpacing="5"
          opacity="0.9"
        >
          STUDIOS
        </text>
        
        {/* Gradientes mejorados */}
        <defs>
          <linearGradient id="diamondTopV" x1="100" y1="20" x2="100" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f5d977" />
            <stop offset="100%" stopColor="#c9a961" />
          </linearGradient>
          <linearGradient id="gradient2" x1="100" y1="80" x2="100" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c9a961" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8b7220" />
          </linearGradient>
          <linearGradient id="textGradientV" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c9a961" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#c9a961" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}