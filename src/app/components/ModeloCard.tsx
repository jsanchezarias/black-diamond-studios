import React, { useState } from 'react';

export const ModeloCard = ({ modelo, onAgendar }: { modelo: any; onAgendar?: (m: any) => void }) => {
  const [fotoActual, setFotoActual] = useState(0);

  const fotos = modelo.fotos?.length > 0
    ? modelo.fotos
    : modelo.foto_url ? [{ url: modelo.foto_url }] : [];

  // Precios reales desde servicios_modelo
  const serviciosActivos = (modelo.servicios_modelo || []).filter((s: any) => s.activo);
  const preciosReales = serviciosActivos
    .map((s: any) => ({ nombre: s.nombre, precio: s.precio_sede || s.precio_domicilio || 0 }))
    .filter((s: any) => s.precio > 0)
    .slice(0, 6);

  // Fallback si no hay precios en la BD
  const preciosFallback = [
    { nombre: 'Rato', precio: 130000 },
    { nombre: '30 Min', precio: 160000 },
    { nombre: '1 Hora', precio: 190000 },
    { nombre: '2 Horas', precio: 360000 },
    { nombre: '3 Horas', precio: 520000 },
    { nombre: '6 Horas', precio: 1000000 },
  ];

  const preciosVisibles = preciosReales.length > 0 ? preciosReales : preciosFallback;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: '0.5px solid rgba(255,215,0,0.2)',
      borderRadius: 12, overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.5)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.2)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* ── FOTO GRANDE ── */}
      <div style={{ position: 'relative', height: 360 }}>
        {fotos.length > 0 ? (
          <img
            key={fotos[fotoActual]?.url}
            src={fotos[fotoActual]?.url}
            alt={modelo.nombre_artistico || 'Modelo'}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 56, color: '#FFD700', opacity: 0.15 }}>◆</span>
          </div>
        )}

        {/* Gradiente + nombre + badge */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
          padding: '32px 14px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#4CAF50', boxShadow: '0 0 6px #4CAF50',
            }} />
            <span style={{ fontSize: 11, color: '#4CAF50', fontWeight: 500 }}>Disponible</span>
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: 0 }}>
            {modelo.nombre_artistico || modelo.nombre}
          </h3>
        </div>
      </div>

      {/* ── MINIATURAS ── */}
      {fotos.length > 1 && (
        <div style={{
          display: 'flex', gap: 4, padding: '8px',
          background: 'rgba(0,0,0,0.6)',
        }}>
          {fotos.slice(0, 5).map((foto: any, i: number) => (
            <div
              key={i}
              onClick={() => setFotoActual(i)}
              style={{
                width: 48, height: 48, borderRadius: 6,
                overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                border: fotoActual === i ? '2px solid #FFD700' : '2px solid transparent',
                opacity: fotoActual === i ? 1 : 0.6,
                transition: 'all 0.15s',
              }}
            >
              <img
                src={foto.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
          {fotos.length > 5 && (
            <div style={{
              width: 48, height: 48, borderRadius: 6,
              background: 'rgba(255,215,0,0.1)',
              border: '2px solid rgba(255,215,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: '#FFD700', fontSize: 11, fontWeight: 600,
            }}>
              +{fotos.length - 5}
            </div>
          )}
        </div>
      )}

      {/* ── PRECIOS + BOTÓN ── */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.08em', marginBottom: 8,
        }}>
          PRECIOS DESDE
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(preciosVisibles.length, 3)}, 1fr)`,
          gap: 6, marginBottom: 12,
        }}>
          {preciosVisibles.map((s: any) => (
            <div key={s.nombre} style={{
              background: 'rgba(255,215,0,0.05)',
              border: '0.5px solid rgba(255,215,0,0.15)',
              borderRadius: 6, padding: '6px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                {s.nombre}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFD700' }}>
                ${Math.round(s.precio / 1000)}k
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onAgendar && onAgendar(modelo)}
          style={{
            width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, #B8860B, #FFD700)',
            border: 'none', borderRadius: 8,
            color: 'black', fontWeight: 700,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          Reservar ahora
        </button>
      </div>
    </div>
  );
};
