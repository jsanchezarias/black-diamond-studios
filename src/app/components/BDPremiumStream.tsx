/**
 * BDPremiumStream.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reproductor HLS premium con:
 *  • Paywall por balance de Diamantes (useWallet)
 *  • Auto-reconexión cada 5 s ante pérdida de señal
 *  • Muted por defecto + botón "Activar Sonido"
 *  • Overlay de espectadores simulados
 *  • Blur + pausa HLS cuando balance = 0 (ahorra ancho de banda)
 *  • Cleanup completo del useEffect para evitar fugas de memoria
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import Hls from 'hls.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXTO DE BILLETERA (WalletContext)
// ═══════════════════════════════════════════════════════════════════════════════

interface WalletContextType {
  balance: number;        // Cantidad de Diamantes del usuario
  onRecargar: () => void; // Callback para abrir el modal/flujo de recarga
}

const WalletContext = createContext<WalletContextType>({
  balance: 10,
  onRecargar: () => {},
});

/** Hook para consumir el contexto de billetera desde cualquier hijo */
export function useWallet(): WalletContextType {
  return useContext(WalletContext);
}

/**
 * Provider de billetera.
 * Ejemplo de uso:
 *   <BDWalletProvider balance={user.diamantes} onRecargar={openRechargeModal}>
 *     <BDPremiumStream />
 *   </BDWalletProvider>
 */
interface BDWalletProviderProps {
  balance: number;
  onRecargar: () => void;
  children: React.ReactNode;
}

export function BDWalletProvider({ balance, onRecargar, children }: BDWalletProviderProps) {
  return (
    <WalletContext.Provider value={{ balance, onRecargar }}>
      {children}
    </WalletContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const STREAM_URL      = 'https://stream.blackdiamondscorts.com/live/stream1/index.m3u8';
const RETRY_DELAY_MS  = 5_000;
const GOLD            = '#d4af37';
const GOLD_DIM        = 'rgba(212,175,55,0.18)';
const GOLD_BORDER     = 'rgba(212,175,55,0.35)';

type StreamState = 'idle' | 'connecting' | 'live' | 'error' | 'reconnecting';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

interface BDPremiumStreamProps {
  title?: string;
  className?: string;
}

export function BDPremiumStream({
  title = 'En Vivo — Sala Premium',
  className = '',
}: BDPremiumStreamProps) {

  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [muted, setMuted]             = useState(true);
  const [viewers, setViewers]         = useState(() => Math.floor(Math.random() * 80) + 20);

  const { balance, onRecargar } = useWallet();
  const hasFunds = balance > 0;

  const videoRef   = useRef<HTMLVideoElement | null>(null);
  const hlsRef     = useRef<Hls | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Destruir HLS de forma segura ─────────────────────────────────────────
  // Llamar SIEMPRE antes de crear una nueva instancia o al desmontar.
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.stopLoad();    // Detiene peticiones de segmentos en vuelo
      hlsRef.current.detachMedia(); // Desconecta el <video> del player HLS
      hlsRef.current.destroy();     // Libera listeners y referencias internas → sin memory leaks
      hlsRef.current = null;
    }
  }, []);

  // ─── Limpiar timer de reintento ───────────────────────────────────────────
  const clearRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  // ─── Montar instancia HLS ─────────────────────────────────────────────────
  const mountHls = useCallback(() => {
    if (!videoRef.current) return;

    // Destruir instancia previa antes de crear la nueva (evita duplicados)
    destroyHls();
    clearRetry();
    setStreamState('connecting');

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength:          8,
        maxMaxBufferLength:       16,
        liveSyncDurationCount:    2,
        liveMaxLatencyDurationCount: 4,
        manifestLoadingTimeOut:   8_000,
        manifestLoadingMaxRetry:  2,
        manifestLoadingRetryDelay: 1_000,
        // Header necesario para omitir la advertencia del túnel ngrok
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
        },
      });

      // Manifiesto cargado → reproducir
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStreamState('live');
        videoRef.current?.play().catch(() => {});
      });

      // Error fatal → destruir y reconectar automáticamente en 5 s
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        console.warn('[BDStream] Error fatal, reconectando en 5 s…', data.type, data.details);
        destroyHls();
        setStreamState('reconnecting');
        retryTimer.current = setTimeout(() => mountHls(), RETRY_DELAY_MS);
      });

      hls.loadSource(STREAM_URL);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls; // Guardar referencia para cleanup

    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari: HLS nativo sin librería
      videoRef.current.src = STREAM_URL;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      setStreamState('live');
    } else {
      setStreamState('error');
    }
  }, [destroyHls, clearRetry]);

  // ─── Efecto principal: montar/pausar según balance de Diamantes ───────────
  //  • Con fondos  → montar HLS y reproducir
  //  • Sin fondos  → destruir HLS para ahorrar ancho de banda del servidor
  //  • Desmontaje  → cleanup completo (sin fugas de memoria)
  useEffect(() => {
    if (hasFunds) {
      mountHls();
    } else {
      videoRef.current?.pause();
      destroyHls();
      clearRetry();
      setStreamState('idle');
    }

    // CLEANUP: se ejecuta antes de re-correr el efecto o al desmontar el componente
    return () => {
      destroyHls();
      clearRetry();
    };
  }, [hasFunds, mountHls, destroyHls, clearRetry]);

  // ─── Fluctuación de espectadores simulada ─────────────────────────────────
  useEffect(() => {
    if (streamState !== 'live') return;
    const interval = setInterval(() => {
      setViewers(v => Math.max(10, Math.min(999, v + Math.floor(Math.random() * 5) - 2)));
    }, 7_000);
    return () => clearInterval(interval);
  }, [streamState]);

  // ─── Sincronizar muted con el elemento <video> ────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const isLive       = streamState === 'live';
  const isConnecting = streamState === 'connecting' || streamState === 'reconnecting';
  const isError      = streamState === 'error';

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: '#000000',
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: 4,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Estilos inline para animaciones y fuentes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes bd-pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
        @keyframes bd-spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes bd-fade-in    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bd-shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .bd-shimmer-text {
          background: linear-gradient(90deg, ${GOLD} 25%, #fff8e1 50%, ${GOLD} 75%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: bd-shimmer 3s linear infinite;
        }
      `}</style>

      {/* ── HEADER: título + badge EN VIVO ── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
      >
        <p
          className="bd-shimmer-text truncate"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(0.8rem, 2vw, 1rem)', fontWeight: 700, letterSpacing: '0.03em' }}
        >
          {title}
        </p>

        {isLive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(220,38,38,0.9)', animation: 'bd-fade-in 0.4s ease' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', display: 'block', animation: 'bd-pulse-dot 1.4s ease-in-out infinite' }} />
            <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em' }}>EN VIVO</span>
          </div>
        )}

        {isConnecting && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
            <span style={{ color: GOLD, fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em' }}>
              {streamState === 'reconnecting' ? 'Reconectando…' : 'Conectando…'}
            </span>
          </div>
        )}
      </div>

      {/* ── OVERLAY SUPERIOR DERECHO: espectadores ── */}
      {isLive && (
        <div
          className="absolute top-12 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.08)', animation: 'bd-fade-in 0.5s ease' }}
        >
          {/* Ícono ojo SVG */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.68rem', fontWeight: 500 }}>
            {viewers.toLocaleString('es-CO')}
          </span>
        </div>
      )}

      {/* ── ELEMENTO VIDEO (siempre en DOM para que HLS pueda adjuntarse) ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{
          // Blur visual del paywall (sin fondos) — HLS ya está pausado por código
          filter: !hasFunds ? 'blur(18px) brightness(0.55) saturate(0.4)' : 'none',
          transition: 'filter 0.6s ease',
          opacity: isLive || !hasFunds ? 1 : 0,
        }}
      />

      {/* ── PANTALLA: CONECTANDO / RECONECTANDO ── */}
      {isConnecting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(0,0,0,0.88)' }}>
          <div style={{ width: 44, height: 44, border: `3px solid ${GOLD_DIM}`, borderTop: `3px solid ${GOLD}`, borderRadius: '50%', animation: 'bd-spin 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', letterSpacing: '0.06em' }}>
            {streamState === 'reconnecting' ? 'Reconectando…' : 'Cargando stream…'}
          </p>
        </div>
      )}

      {/* ── PANTALLA: ERROR / SIN SEÑAL ── */}
      {isError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ background: '#000' }}>
          <span style={{ fontSize: '2.5rem' }}>📡</span>
          <p style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700 }}>Sin señal</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', textAlign: 'center', maxWidth: 240 }}>
            El stream no está disponible en este momento
          </p>
          <button
            onClick={mountHls}
            style={{ marginTop: 8, padding: '9px 24px', borderRadius: 8, background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = GOLD_DIM)}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── PAYWALL: OVERLAY BLUR — Usuario sin Diamantes ── */}
      {!hasFunds && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', animation: 'bd-fade-in 0.5s ease' }}
        >
          {/* Ícono diamante rotado */}
          <div style={{ width: 60, height: 60, background: GOLD_DIM, border: `2px solid ${GOLD_BORDER}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
            <span style={{ fontSize: '1.5rem', transform: 'rotate(-45deg)' }}>💎</span>
          </div>

          <div className="text-center px-6">
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1rem, 3vw, 1.3rem)', fontWeight: 700, color: GOLD, marginBottom: 6 }}>
              Acceso Bloqueado
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.5, maxWidth: 240 }}>
              Necesitas Diamantes para ver el stream en vivo
            </p>
          </div>

          {/* Botón principal Recargar Diamantes */}
          <button
            onClick={onRecargar}
            style={{ padding: '12px 32px', borderRadius: 10, background: `linear-gradient(135deg, ${GOLD} 0%, #b8941f 100%)`, color: '#0f0f0f', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', letterSpacing: '0.04em', boxShadow: `0 4px 24px rgba(212,175,55,0.35)`, transition: 'transform 0.15s, box-shadow 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(212,175,55,0.5)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 24px rgba(212,175,55,0.35)`; }}
          >
            💎 Recargar Diamantes
          </button>

          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            Balance actual: {balance} Diamantes
          </p>
        </div>
      )}

      {/* ── FOOTER: controles de audio + balance ── */}
      {isLive && hasFunds && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
        >
          {/* Badge balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
            <span style={{ fontSize: '0.75rem' }}>💎</span>
            <span style={{ color: GOLD, fontSize: '0.68rem', fontWeight: 600 }}>{balance}</span>
          </div>

          {/* Botón Activar / Silenciar Sonido */}
          <button
            onClick={() => setMuted(prev => !prev)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: muted ? GOLD_DIM : 'rgba(255,255,255,0.1)', border: `1px solid ${muted ? GOLD_BORDER : 'rgba(255,255,255,0.12)'}`, color: muted ? GOLD : 'rgba(255,255,255,0.75)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s' }}
          >
            {muted ? (
              <>
                {/* Mute icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
                Activar Sonido
              </>
            ) : (
              <>
                {/* Volume icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                Silenciar
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Línea dorada decorativa inferior ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`, pointerEvents: 'none', zIndex: 25 }} />
    </div>
  );
}

export default BDPremiumStream;
