import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { supabase } from '../../utils/supabase/info';

// ─── Constantes ────────────────────────────────────────────────────────────────
const TIEMPO_GRATIS = 3 * 60; // 180 segundos
const STREAM_URL = 'https://stream.blackdiamondscorts.com/live/stream1/index.m3u8';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface StreamConPaywallProps {
  onRegistrarse: (tipo: 'registro' | 'login') => void;
}

// ─── Formatear MM:SS ───────────────────────────────────────────────────────────
function formatTiempo(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function StreamConPaywall({ onRegistrarse }: StreamConPaywallProps) {
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_GRATIS);
  const [streamCortado, setStreamCortado]   = useState(false);
  const [streamActivo, setStreamActivo]     = useState(false);
  const [errorStream, setErrorStream]       = useState(false);
  const [modelos, setModelos]               = useState<any[]>([]);

  const hlsRef   = useRef<Hls | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ── Cargar modelos disponibles ──────────────────────────────────────────────
  useEffect(() => {
    const cargarModelos = async () => {
      const { data } = await supabase
        .from('usuarios')
        .select(`
          id,
          nombre_artistico,
          estado,
          modelo_fotos (url, es_principal),
          servicios_modelo!servicios_modelo_modelo_id_fkey (nombre, precio_sede, activo)
        `)
        .eq('role', 'modelo')
        .eq('estado', 'activo');

      setModelos(data || []);
    };
    cargarModelos();
  }, []);

  // ── Temporizador regresivo ──────────────────────────────────────────────────
  useEffect(() => {
    if (!streamActivo || streamCortado) return;

    const intervalo = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(intervalo);
          cortarStream();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [streamActivo, streamCortado]);

  // ── Cleanup al desmontar ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  // ── Cortar stream ────────────────────────────────────────────────────────────
  const cortarStream = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setStreamCortado(true);
  };

  // ── Iniciar HLS ─────────────────────────────────────────────────────────────
  const iniciarStream = () => {
    if (!videoRef.current) return;

    if (Hls.isSupported()) {
      // Destruir instancia previa
      if (hlsRef.current) hlsRef.current.destroy();

      const hls = new Hls({
        maxBufferLength: 10,
        manifestLoadingTimeOut: 5000,
        manifestLoadingMaxRetry: 2,
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
        },
      });

      hls.loadSource(STREAM_URL);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {});
        setStreamActivo(true);
        setErrorStream(false);
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          hls.destroy();
          hlsRef.current = null;
          setStreamActivo(false);
          setErrorStream(true);
        }
      });

      hlsRef.current = hls;

    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari nativo
      videoRef.current.src = STREAM_URL;
      videoRef.current.play().catch(() => {});
      setStreamActivo(true);
    } else {
      setErrorStream(true);
    }
  };

  // ── Color dinámico del timer ─────────────────────────────────────────────────
  const colorTimer =
    tiempoRestante > 60
      ? '#c9a961'  // dorado
      : tiempoRestante > 20
        ? '#f59e0b' // ámbar
        : '#ef4444'; // rojo

  const pctProgreso = ((TIEMPO_GRATIS - tiempoRestante) / TIEMPO_GRATIS) * 100;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full">

      {/* ══════════════════════════════════════════════════════
          PANEL STREAM ACTIVO (antes del paywall)
      ══════════════════════════════════════════════════════ */}
      {!streamCortado && (
        <div className="relative w-full h-full bg-black">

          {/* Elemento video — siempre montado para inicialización limpia */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ display: streamActivo ? 'block' : 'none' }}
          />

          {/* ── ERROR DE CORS / STREAM CAÍDO ── */}
          {errorStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0b0d]">
              <span style={{ fontSize: '2.5rem' }}>📡</span>
              <p style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.875rem',
                fontFamily: "'Montserrat', sans-serif",
                textAlign: 'center',
                padding: '0 1rem',
              }}>
                Stream no disponible en este momento
              </p>
              <button
                onClick={() => setStreamCortado(true)}
                style={{
                  color: '#c9a961',
                  fontSize: '0.875rem',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Ver nuestras acompañantes →
              </button>
            </div>
          )}

          {/* ── PANTALLA DE INICIO (sin stream aún) ── */}
          {!streamActivo && !errorStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85">
              <div className="text-center">
                <div style={{
                  width: 64, height: 64,
                  border: '2px solid rgba(201,169,97,0.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  background: 'rgba(201,169,97,0.07)',
                }}>
                  <span style={{ fontSize: '1.6rem' }}>📡</span>
                </div>
                <p style={{
                  color: '#c9a961',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: 4,
                }}>
                  Stream en vivo
                </p>
                <p style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.75rem',
                  fontFamily: "'Montserrat', sans-serif",
                  marginBottom: 20,
                }}>
                  3 minutos gratis sin registro
                </p>
                <button
                  onClick={iniciarStream}
                  style={{
                    padding: '10px 28px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #c9a961, #a07c3a)',
                    color: '#0f1014',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  ▶ Ver stream en vivo
                </button>
              </div>
            </div>
          )}

          {/* ── TEMPORIZADOR sobre el video ── */}
          {streamActivo && (
            <div
              className="absolute top-3 right-3 flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(0,0,0,0.72)',
                border: `1px solid ${colorTimer}`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: colorTimer }}
              />
              <span
                className="font-mono font-bold text-sm"
                style={{ color: colorTimer }}
              >
                {formatTiempo(tiempoRestante)}
              </span>
              <span style={{ color: '#888', fontSize: '0.7rem' }}>
                restantes
              </span>
            </div>
          )}

          {/* ── Badge EN VIVO ── */}
          {streamActivo && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ background: '#dc2626' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                EN VIVO
              </span>
            </div>
          )}

          {/* ── Barra de progreso del tiempo ── */}
          {streamActivo && (
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${pctProgreso}%`, backgroundColor: colorTimer }}
              />
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PAYWALL — Stream cortado
      ══════════════════════════════════════════════════════ */}
      {streamCortado && (
        <div
          className="w-full overflow-y-auto"
          style={{
            background: '#0a0b0d',
            minHeight: '100%',
          }}
        >
          {/* ── Header ── */}
          <div className="text-center pt-8 pb-4 px-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{
                background: 'rgba(201,169,97,0.08)',
                border: '1px solid rgba(201,169,97,0.25)',
              }}
            >
              <span style={{ fontSize: '1rem' }}>⏱️</span>
              <span style={{ color: '#c9a961', fontSize: '0.8rem', fontWeight: 600 }}>
                Tu tiempo gratis terminó
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                fontWeight: 700,
                color: '#e8e6e3',
                marginBottom: 8,
              }}
            >
              ¿Te gustó lo que viste?
            </h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 20 }}>
              Regístrate gratis y agenda tu experiencia con nuestras acompañantes
            </p>

            {/* ── CTAs ── */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => onRegistrarse('registro')}
                style={{
                  padding: '11px 28px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #c9a961, #a07c3a)',
                  color: '#0f1014',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                ◆ Crear cuenta gratis
              </button>
              <button
                onClick={() => onRegistrarse('login')}
                style={{
                  padding: '11px 28px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid #2a2a2a',
                  color: '#888',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,169,97,0.5)';
                  e.currentTarget.style.color = '#c9a961';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.color = '#888';
                }}
              >
                Ya tengo cuenta
              </button>
            </div>
          </div>

          {/* ── Grid de modelos ── */}
          <div className="px-4 pb-6">
            <p
              className="text-center mb-4"
              style={{
                color: '#555',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Disponibles para agendar hoy
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modelos.map(modelo => {
                const foto =
                  (modelo.modelo_fotos as any[])?.find((f: any) => f.es_principal)?.url ||
                  (modelo.modelo_fotos as any[])?.[0]?.url;

                const precios = ((modelo.servicios_modelo as any[]) || [])
                  .filter((s: any) => s.activo)
                  .map((s: any) => s.precio || s.precio_sede || 0)
                  .filter((p: number) => p > 0);

                const precioBase = precios.length > 0 ? Math.min(...precios) : null;

                return (
                  <div
                    key={modelo.id}
                    onClick={() => onRegistrarse('registro')}
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                    style={{
                      border: '1px solid #2a2a2a',
                      transition: 'border-color 0.3s, box-shadow 0.3s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,97,0.5)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(201,169,97,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Foto */}
                    <div className="relative bg-[#1a1a1a]" style={{ aspectRatio: '3/4' }}>
                      {foto ? (
                        <img
                          src={foto}
                          alt={modelo.nombre_artistico || 'Modelo'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-bold"
                          style={{ color: '#c9a961', fontSize: '2.5rem' }}
                        >
                          {(modelo.nombre_artistico || '◆')[0]}
                        </div>
                      )}

                      {/* Gradiente inferior */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                        }}
                      />

                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p
                          className="truncate font-bold"
                          style={{
                            color: '#c9a961',
                            fontSize: '0.8rem',
                            fontFamily: "'Playfair Display', serif",
                          }}
                        >
                          {modelo.nombre_artistico}
                        </p>
                        {precioBase && (
                          <p style={{ color: '#888', fontSize: '0.68rem' }}>
                            Desde ${precioBase.toLocaleString('es-CO')}
                          </p>
                        )}
                      </div>

                      {/* Overlay hover */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(201,169,97,0.15)' }}
                      >
                        <span
                          className="font-bold rounded-full px-3 py-1.5"
                          style={{
                            background: '#c9a961',
                            color: '#0f1014',
                            fontSize: '0.7rem',
                          }}
                        >
                          ◆ Agendar
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
