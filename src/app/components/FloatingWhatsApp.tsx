import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { getWhatsAppGeneralUrl, WHATSAPP_CONFIG } from '../../utils/whatsapp';

export const FloatingWhatsApp: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const [dismissBadge, setDismissBadge] = useState(false);

  const url = getWhatsAppGeneralUrl();

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex items-end gap-3 pointer-events-auto select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Toast informativo sutil flotante */}
      {!dismissBadge && (
        <div
          className={`hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
            hovered ? 'scale-105 opacity-100' : 'opacity-90'
          }`}
          style={{
            background: 'rgba(18, 20, 24, 0.95)',
            borderColor: 'rgba(37, 211, 102, 0.35)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(37, 211, 102, 0.15)',
          }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>

          <div className="flex flex-col text-left">
            <span
              className="text-[11px] font-bold text-white tracking-wide"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Atención Exclusiva 24/7
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              Escríbenos por WhatsApp
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissBadge(true);
            }}
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Cerrar aviso"
            aria-label="Cerrar aviso"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Botón flotante circular */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar a Black Diamond por WhatsApp"
        className="relative group w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          boxShadow: '0 6px 24px rgba(37, 211, 102, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Anillo de pulso exterior */}
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-25"
          style={{ background: '#25D366' }}
        />

        {/* Ícono de WhatsApp */}
        <MessageCircle className="w-7 h-7 text-white fill-white transition-transform group-hover:scale-110 duration-200" />

        {/* Punto indicador de estado en línea */}
        <span
          className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#121418] rounded-full shadow"
          title="Atención activa"
        />
      </a>
    </div>
  );
};
