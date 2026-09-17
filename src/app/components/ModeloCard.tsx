import { useState, useEffect } from 'react';
import { MessageCircle, Eye, ShieldCheck, Building2, Car } from 'lucide-react';

interface LightboxState {
  fotos: { url: string }[];
  indice: number;
  nombreModelo: string;
}

const WHATSAPP_NUMERO = '573017626768';

export const ModeloCard = ({ modelo, onAgendar }: { modelo: any; onAgendar?: (m: any) => void }) => {
  const [fotoActual, setFotoActual] = useState(0);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Normaliza el array de fotos: acepta modelo_fotos (Supabase join) o fotos (legado)
  const rawFotos: any[] = modelo.modelo_fotos || modelo.fotos || [];
  const fotosOrdenadas =
    rawFotos.length > 0
      ? [...rawFotos].sort((a, b) => (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0))
      : modelo.foto_url
      ? [{ url: modelo.foto_url }]
      : [];
  // Quita fotos duplicadas (misma URL guardada más de una vez), conservando la primera
  const fotos: { url: string }[] = Array.from(
    new Map(fotosOrdenadas.filter(f => f?.url).map(f => [f.url, f])).values()
  );

  // Precios desde servicios_modelo (real) o fallback fijo
  const serviciosActivos = (modelo.servicios_modelo || []).filter((s: any) => s.activo);
  const preciosReales = serviciosActivos
    .map((s: any) => ({ nombre: s.nombre, precio: s.precio_sede || s.precio_domicilio || 0 }))
    .filter((s: any) => s.precio > 0)
    .slice(0, 6);

  const preciosFallback = [
    { nombre: 'Rato',    precio: 130000 },
    { nombre: '30 Min',  precio: 160000 },
    { nombre: '1 Hora',  precio: 190000 },
    { nombre: '2 Horas', precio: 360000 },
    { nombre: '3 Horas', precio: 520000 },
    { nombre: '6 Horas', precio: 1000000 },
  ];

  const preciosVisibles = preciosReales.length > 0 ? preciosReales : preciosFallback;
  const nombreModelo = modelo.nombre_artistico || modelo.nombre || 'Modelo';

  // Teclado para lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight')
        setLightbox(p => p ? { ...p, indice: p.indice === p.fotos.length - 1 ? 0 : p.indice + 1 } : null);
      if (e.key === 'ArrowLeft')
        setLightbox(p => p ? { ...p, indice: p.indice === 0 ? p.fotos.length - 1 : p.indice - 1 } : null);
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightbox]);

  const abrirLightbox = (indice: number) =>
    setLightbox({ fotos, indice, nombreModelo });

  const agendarPorWhatsApp = (servicio?: { nombre: string; precio: number }) => {
    let mensaje = '';
    if (servicio) {
      const precioFmt = '$' + servicio.precio.toLocaleString('es-CO');
      mensaje = `Hola Black Diamond, deseo agendar una cita con *${nombreModelo}* para el servicio de *${servicio.nombre}* (${precioFmt}). ¿Tienen disponibilidad?`;
    } else {
      mensaje = `Hola Black Diamond, deseo agendar una cita con *${nombreModelo}*. ¿Tienen disponibilidad?`;
    }
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.96)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Botón izquierda */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(p => p ? { ...p, indice: p.indice === 0 ? p.fotos.length - 1 : p.indice - 1 } : null); }}
            style={{
              position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(201,169,97,0.15)', border: '1px solid rgba(201,169,97,0.3)',
              borderRadius: '50%', width: 48, height: 48, color: '#c9a961', fontSize: 24,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
              transition: 'all 0.2s',
            }}
          >‹</button>

          <img
            src={lightbox.fotos[lightbox.indice]?.url}
            onClick={e => e.stopPropagation()}
            alt={lightbox.nombreModelo}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}
          />

          {/* Botón derecha */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(p => p ? { ...p, indice: p.indice === p.fotos.length - 1 ? 0 : p.indice + 1 } : null); }}
            style={{
              position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(201,169,97,0.15)', border: '1px solid rgba(201,169,97,0.3)',
              borderRadius: '50%', width: 48, height: 48, color: '#c9a961', fontSize: 24,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
              transition: 'all 0.2s',
            }}
          >›</button>

          {/* Cerrar */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              color: 'white', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}
          >×</button>

          {/* Contador y Nombre */}
          <div style={{ position: 'fixed', bottom: 50, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: 13, zIndex: 10000, fontFamily: "'Montserrat', sans-serif" }}>
            {lightbox.indice + 1} / {lightbox.fotos.length}
            {lightbox.nombreModelo && ' · ' + lightbox.nombreModelo}
          </div>

          {/* Puntos */}
          <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10000 }}>
            {lightbox.fotos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setLightbox(p => p ? { ...p, indice: i } : null); }}
                style={{
                  width: i === lightbox.indice ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === lightbox.indice ? '#c9a961' : 'rgba(255,255,255,0.25)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── CARD DE MODELO ── */}
      <div
        className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group"
        style={{
          background: 'linear-gradient(180deg, #16181c 0%, #111317 100%)',
          border: '1px solid rgba(201, 169, 97, 0.18)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(201, 169, 97, 0.45)';
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6), 0 0 25px rgba(201, 169, 97, 0.1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(201, 169, 97, 0.18)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
        }}
      >
        {/* FOTO PRINCIPAL */}
        <div className="relative h-[360px] overflow-hidden cursor-pointer" onClick={() => abrirLightbox(fotoActual)}>
          {fotos.length > 0 ? (
            <img
              key={fotos[fotoActual]?.url}
              src={fotos[fotoActual]?.url}
              alt={nombreModelo}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-[#16181c] flex items-center justify-center">
              <span className="text-5xl text-[#c9a961]/20">◆</span>
            </div>
          )}

          {/* Badges superiores */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            {/* Disponibilidad */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-400">Disponible</span>
            </div>

            {/* Verificada */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#c9a961]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c9a961]" />
              <span className="text-[10px] font-medium text-[#c9a961] tracking-wide uppercase">100% Real</span>
            </div>
          </div>

          {/* Gradiente inferior + Nombre */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-12 pointer-events-none">
            <h3 className="text-2xl font-bold text-white mb-1 tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {nombreModelo}
            </h3>
            {/* Detalles rápidos de ubicación / sede */}
            <div className="flex items-center gap-3 text-xs text-[#aaa]">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#c9385a]" />
                {modelo.sede || 'Sede Exclusiva'}
              </span>
              {modelo.domicilio !== false && (
                <span className="flex items-center gap-1">
                  <Car className="w-3 h-3 text-[#c9a961]" />
                  A Domicilio
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MINIATURAS FOTOGRÁFICAS */}
        {fotos.length > 1 && (
          <div className="flex gap-2 p-3 bg-black/40 border-t border-b border-white/5 overflow-x-auto">
            {fotos.slice(0, 5).map((foto, i) => (
              <div
                key={i}
                onClick={() => { setFotoActual(i); abrirLightbox(i); }}
                className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all duration-200"
                style={{
                  border: fotoActual === i ? '2px solid #c9a961' : '1px solid rgba(255,255,255,0.1)',
                  opacity: fotoActual === i ? 1 : 0.65,
                }}
              >
                <img src={foto.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {fotos.length > 5 && (
              <div
                onClick={() => abrirLightbox(5)}
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer text-xs font-bold"
                style={{
                  background: 'rgba(201, 169, 97, 0.1)',
                  border: '1px solid rgba(201, 169, 97, 0.3)',
                  color: '#c9a961',
                }}
              >
                +{fotos.length - 5}
              </div>
            )}
          </div>
        )}

        {/* MOSAICO DE PRECIOS */}
        <div className="p-4 bg-black/20 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#888] tracking-wider mb-2 flex items-center justify-between">
              <span>Tarifas Disponibles</span>
              <span className="text-[#c9a961]/80 text-[9px] lowercase font-normal">toca una para agendar</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {preciosVisibles.map((s: any) => (
                <button
                  key={s.nombre}
                  onClick={() => agendarPorWhatsApp(s)}
                  className="rounded-lg p-2 text-center transition-all duration-200 hover:scale-[1.03] group/pill"
                  style={{
                    background: 'rgba(201, 169, 97, 0.06)',
                    border: '1px solid rgba(201, 169, 97, 0.18)',
                  }}
                  title={`Agendar ${s.nombre} por WhatsApp`}
                >
                  <div className="text-[10px] text-[#888] truncate mb-0.5 group-hover/pill:text-white transition-colors">{s.nombre}</div>
                  <div className="text-xs sm:text-sm font-bold text-[#c9a961] group-hover/pill:text-white transition-colors">
                    ${Math.round(s.precio / 1000)}k
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            {/* Botón principal: WhatsApp Express */}
            <button
              onClick={() => agendarPorWhatsApp()}
              className="w-full py-3 px-4 rounded-xl font-bold text-white text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #1ea952 100%)',
                boxShadow: '0 4px 16px rgba(37, 211, 102, 0.25)',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Reservar por WhatsApp
            </button>

            {/* Botón secundario: Ver perfil completo */}
            <button
              onClick={() => onAgendar && onAgendar(modelo)}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs tracking-wide transition-all duration-200 hover:bg-white/5 flex items-center justify-center gap-2"
              style={{
                border: '1px solid rgba(201, 169, 97, 0.3)',
                color: '#c9a961',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              Ver perfil completo
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

