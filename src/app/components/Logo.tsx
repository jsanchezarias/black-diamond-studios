import React from 'react';
import { BlackDiamondIcon } from './BlackDiamondIcon';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'vertical' | 'horizontal';
}

/**
 * Logotipo Oficial de Black Diamond Studios
 * Incorpora el diseño auténtico: recuadro estilizado, diamante facetado en 3D
 * con resplandor superior y tipografía "BLACK DIAMOND STUDIOS".
 */
export function Logo({ className = '', size = 'md', variant = 'vertical' }: LogoProps) {
  const horizontalSizeClasses = {
    sm: 'h-8 sm:h-9 max-w-[200px]',
    md: 'h-11 sm:h-12 max-w-[280px]',
    lg: 'h-16 sm:h-18 max-w-[380px]',
    xl: 'h-20 sm:h-24 max-w-[500px]',
    full: 'w-full max-w-xl h-auto'
  };

  const verticalSizeClasses = {
    sm: { diamond: 38, text: 'text-base', sub: 'text-[9px]', gap: 'gap-1' },
    md: { diamond: 56, text: 'text-xl', sub: 'text-[10px]', gap: 'gap-1.5' },
    lg: { diamond: 76, text: 'text-2xl', sub: 'text-xs', gap: 'gap-2' },
    xl: { diamond: 96, text: 'text-3xl', sub: 'text-sm', gap: 'gap-2.5' },
    full: { diamond: 110, text: 'text-4xl', sub: 'text-base', gap: 'gap-3' }
  };

  if (variant === 'horizontal') {
    return (
      <div className={`relative inline-flex items-center select-none group ${className}`}>
        <img
          src="/brand/logo.png"
          alt="Black Diamond Studios"
          className={`${horizontalSizeClasses[size]} w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] transition-all duration-300 group-hover:drop-shadow-[0_0_18px_rgba(255,255,255,0.3)]`}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  // Logo Vertical: Diamante auténtico arriba + BLACK DIAMOND + STUDIOS abajo
  const vConf = verticalSizeClasses[size];

  return (
    <div className={`relative flex flex-col items-center justify-center text-center select-none group ${className}`}>
      {/* Diamante oficial con resplandor */}
      <div className="relative mb-1 transition-transform duration-300 group-hover:scale-105">
        <BlackDiamondIcon size={vConf.diamond} glow={true} />
      </div>

      {/* Tipografía oficial */}
      <div className={`flex flex-col items-center ${vConf.gap}`}>
        <span
          className={`font-light text-white tracking-[0.2em] uppercase transition-colors duration-300 ${vConf.text}`}
          style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
        >
          BLACK <span className="font-semibold text-white">DIAMOND</span>
        </span>

        {/* Separador STUDIOS entre líneas estilizadas */}
        <div className="flex items-center gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="w-4 sm:w-6 h-[1px] bg-white/40" />
          <span
            className={`font-normal text-white/90 tracking-[0.35em] uppercase ${vConf.sub}`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            STUDIOS
          </span>
          <span className="w-4 sm:w-6 h-[1px] bg-white/40" />
        </div>
      </div>
    </div>
  );
}
