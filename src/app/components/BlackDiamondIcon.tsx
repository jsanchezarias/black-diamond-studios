import React from 'react';

interface BlackDiamondIconProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
  style?: React.CSSProperties;
  alt?: string;
  variant?: 'image' | 'svg';
}

/**
 * Icono de Diamante Oficial de Black Diamond Studios
 * Reproduce exactamente el diamante facetado en blanco y negro con resplandor
 * extraído del logotipo de la marca.
 */
export function BlackDiamondIcon({
  size = 20,
  className = '',
  glow = true,
  style = {},
  alt = 'Black Diamond',
  variant = 'image'
}: BlackDiamondIconProps) {
  const dimensionStyle = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    ...style
  };

  if (variant === 'svg') {
    return (
      <svg
        viewBox="0 0 100 100"
        style={dimensionStyle}
        className={`object-contain inline-block ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={alt}
      >
        <defs>
          {glow && (
            <filter id="bd-diamond-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
          <radialGradient id="bd-halo" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo de luz suave */}
        {glow && <circle cx="50" cy="32" r="35" fill="url(#bd-halo)" />}

        {/* Silueta exterior oscura */}
        <polygon
          points="24,18 76,18 92,38 50,92 8,38"
          fill="#060709"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinejoin="round"
          filter={glow ? 'url(#bd-diamond-glow)' : undefined}
        />

        {/* Faceta de la mesa (superior) */}
        <polygon
          points="35,18 65,18 50,38"
          fill="#0c0e12"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Facetas laterales de la corona */}
        <line x1="24" y1="18" x2="8" y2="38" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="35" y1="18" x2="8" y2="38" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="65" y1="18" x2="92" y2="38" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="76" y1="18" x2="92" y2="38" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

        {/* Cinturón horizontal */}
        <line x1="8" y1="38" x2="92" y2="38" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

        {/* Facetas del pabellón inferior que convergen al vértice */}
        <line x1="50" y1="38" x2="50" y2="92" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="28" y1="38" x2="50" y2="92" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="72" y1="38" x2="50" y2="92" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center relative flex-shrink-0 select-none ${className}`}
      style={dimensionStyle}
    >
      {glow && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none opacity-50 filter blur-[4px] bg-white/25 -z-1"
          aria-hidden="true"
        />
      )}
      <img
        src="/brand/diamond.png"
        alt={alt}
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}
