import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { BlackDiamondIcon } from './BlackDiamondIcon';

export function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const verified = localStorage.getItem('bd_age_verified');
      if (!verified) {
        setIsOpen(true);
      }
    } catch {
      // Fallback si localStorage no está disponible
      setIsOpen(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('bd_age_verified', 'true');
    } catch {}
    setIsOpen(false);
  };

  const handleReject = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden border border-[#c9a961]/30 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #16181c 0%, #0f1014 100%)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(161, 29, 58, 0.15)',
        }}
      >
        {/* Glow decorativo */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(194,58,84,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Icono + Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <BlackDiamondIcon size={24} glow={true} />
          <span style={{ color: '#fff', fontWeight: 300, fontSize: '1.25rem', letterSpacing: '0.08em', fontFamily: "'Cormorant Garamond', serif" }}>
            BLACK <strong style={{ color: '#ffffff', fontWeight: 700 }}>DIAMOND</strong>
          </span>
        </div>

        <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(161, 29, 58, 0.15)', border: '1px solid rgba(161, 29, 58, 0.3)' }}>
          <ShieldAlert className="w-6 h-6 text-[#c9385a]" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Contenido Exclusivo para Adultos
        </h3>

        <p className="text-xs sm:text-sm text-[#888] leading-relaxed mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Este sitio web contiene material y servicios destinados únicamente a personas mayores de edad (+18 años). Al hacer clic en entrar, confirmas bajo tu responsabilidad que eres mayor de edad según las leyes de tu país.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 mb-4">
          <button
            onClick={handleAccept}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-white text-xs tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #C23A54 0%, #A11D3A 60%, #6B1226 100%)',
              boxShadow: '0 4px 20px rgba(161, 29, 58, 0.4)',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            <ShieldCheck className="w-4 h-4 inline mr-2" />
            Soy mayor de 18 años — Entrar
          </button>

          <button
            onClick={handleReject}
            className="w-full py-2.5 px-4 rounded-xl text-xs text-[#666] hover:text-[#999] transition-colors border border-white/5 hover:border-white/10"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Soy menor de edad — Salir
          </button>
        </div>

        <p className="text-[10px] text-[#555] tracking-wide flex items-center justify-center gap-1.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <BlackDiamondIcon size={12} glow={false} />
          <span>Privacidad y discreción 100% garantizada</span>
        </p>
      </div>
    </div>
  );
}
