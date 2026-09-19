import React from 'react';
import { BlackDiamondIcon } from './BlackDiamondIcon';

interface LogoIsotipoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

/**
 * Isotipo Oficial de Black Diamond Studios
 * Versión compacta para dashboards, barras de navegación y áreas operativas.
 * Incluye el diamante auténtico y las siglas o texto estilizado.
 */
export function LogoIsotipo({ className = '', size = 'md', showText = true }: LogoIsotipoProps) {
  const sizeMap = {
    xs: { icon: 20, text: 'text-xs', sub: 'text-[7px]' },
    sm: { icon: 26, text: 'text-sm', sub: 'text-[8px]' },
    md: { icon: 32, text: 'text-base', sub: 'text-[9px]' },
    lg: { icon: 40, text: 'text-lg', sub: 'text-[10px]' },
    xl: { icon: 48, text: 'text-xl', sub: 'text-[11px]' }
  };

  const conf = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Diamante Oficial con resplandor */}
      <div className="relative transition-transform duration-300 group-hover:scale-105">
        <BlackDiamondIcon size={conf.icon} glow={true} />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-light text-white tracking-[0.14em] uppercase ${conf.text}`}
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            BLACK <span className="font-bold text-white">DIAMOND</span>
          </span>
          <span
            className={`text-white/60 tracking-[0.25em] uppercase font-medium ${conf.sub}`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            STUDIOS
          </span>
        </div>
      )}
    </div>
  );
}
