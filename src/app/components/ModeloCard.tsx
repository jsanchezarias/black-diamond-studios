import { useState, useEffect } from 'react';

interface LightboxState {
  fotos: { url: string }[];
  indice: number;
  nombreModelo: string;
}

export const ModeloCard = ({ modelo, onAgendar }: { modelo: any; onAgendar?: (m: any) => void }) => {
  const [fotoActual, setFotoActual] = useState(0);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Normaliza el array de fotos: acepta modelo_fotos (Supabase join) o fotos (legado)
  const rawFotos: any[] = modelo.modelo_fotos || modelo.fotos || [];
  const fotos: { url: string }[] =
    rawFotos.length > 0
      ? [...rawFotos].sort((a, b) => (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0))
      : modelo.foto_url
      ? [{ url: modelo.foto_url }]
      : [];

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
    setLightbox({ fotos, indice, nombreModelo: modelo.nombre_artistico || modelo.nombre || '' });

  return (
    <>
      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Botón izquierda */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(p => p ? { ...p, indice: p.indice === 0 ? p.fotos.length - 1 : p.indice - 1 } : null); }}
            style={{
              position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', width: 48, height: 48, color: 'white', fontSize: 24,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}
          >‹</button>

          <img
            src={lightbox.fotos[lightbox.indice]?.url}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
          />

          {/* Botón derecha */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(p => p ? { ...p, indice: p.indice === p.fotos.length - 1 ? 0 : p.indice + 1 } : null); }}
            style={{
              position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', width: 48, height: 48, color: 'white', fontSize: 24,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}
          >›</button>

          {/* Cerrar */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed', top: 16, right: 16,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: 40, height: 40,
              color: 'white', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}
          >×</button>

          {/* Contador */}
          <div style={{ position: 'fixed', bottom: 50, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 12, zIndex: 10000 }}>
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
                  background: i === lightbox.indice ? '#FFD700' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── CARD ── */}
      <div
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '0.5px solid rgba(255,215,0,0.2)',
          borderRadius: 12, overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
      >
        {/* FOTO GRANDE */}
        <div style={{ position: 'relative', height: 360 }}>
          {fotos.length > 0 ? (
            <img
              key={fotos[fotoActual]?.url}
              src={fotos[fotoActual]?.url}
              alt={modelo.nombre_artistico || 'Modelo'}
              loading="lazy"
              onClick={() => abrirLightbox(fotoActual)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 56, color: '#FFD700', opacity: 0.15 }}>◆</span>
            </div>
          )}

          {/* Gradiente + nombre + badge */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '32px 14px 14px', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 6px #4CAF50' }} />
              <span style={{ fontSize: 11, color: '#4CAF50', fontWeight: 500 }}>Disponible</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: 0 }}>
              {modelo.nombre_artistico || modelo.nombre}
            </h3>
          </div>
        </div>

        {/* MINIATURAS */}
        {fotos.length > 1 && (
          <div style={{ display: 'flex', gap: 4, padding: '8px', background: 'rgba(0,0,0,0.6)' }}>
            {fotos.slice(0, 5).map((foto, i) => (
              <div
                key={i}
                onClick={() => { setFotoActual(i); abrirLightbox(i); }}
                style={{
                  width: 48, height: 48, borderRadius: 6, overflow: 'hidden',
                  cursor: 'pointer', flexShrink: 0,
                  border: fotoActual === i ? '2px solid #FFD700' : '2px solid transparent',
                  opacity: fotoActual === i ? 1 : 0.6, transition: 'all 0.15s',
                }}
              >
                <img src={foto.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {fotos.length > 5 && (
              <div style={{
                width: 48, height: 48, borderRadius: 6,
                background: 'rgba(255,215,0,0.1)', border: '2px solid rgba(255,215,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#FFD700', fontSize: 11, fontWeight: 600,
              }}>
                +{fotos.length - 5}
              </div>
            )}
          </div>
        )}

        {/* PRECIOS */}
        <div style={{ borderTop: '0.5px solid rgba(255,215,0,0.1)', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '10px 14px 6px', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
            PRECIOS DESDE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '0 14px 12px' }}>
            {preciosVisibles.map((s: any) => (
              <div
                key={s.nombre}
                onClick={() => onAgendar && onAgendar({ ...modelo, servicioPreseleccionado: s })}
                style={{
                  background: 'rgba(255,215,0,0.05)', border: '0.5px solid rgba(255,215,0,0.15)',
                  borderRadius: 6, padding: '7px 6px', textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,215,0,0.15)')}
              >
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{s.nombre}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFD700' }}>${Math.round(s.precio / 1000)}k</div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTÓN */}
        <div style={{ padding: '0 14px 14px' }}>
          <button
            onClick={() => onAgendar && onAgendar(modelo)}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #B8860B, #FFD700)',
              border: 'none', borderRadius: 8,
              color: 'black', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Reservar ahora
          </button>
        </div>
      </div>
    </>
  );
};
