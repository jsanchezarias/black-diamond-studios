import React, { useState } from 'react';

export const ModeloCard = ({ modelo, onAgendar }: { modelo: any, onAgendar?: (m: any) => void }) => {
  const [idx, setIdx] = useState(0);

  // Ordenar fotos: principal primero
  const fotos = [...(modelo.modelo_fotos || [])]
    .sort((a: any, b: any) => 
      (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0)
    );

  const fotoUrl = fotos[idx]?.url || modelo.foto_url;

  // Precio mínimo — solo precio_sede y precio_domicilio
  const precios = (modelo.servicios_modelo || [])
    .filter((s: any) => s.activo)
    .map((s: any) => s.precio_sede || s.precio_domicilio || 0)
    .filter((p: number) => p > 0);
    
  const precioBase = precios.length > 0
    ? Math.min(...precios)
    : null;

  const servicios = (modelo.servicios_modelo || [])
    .filter((s: any) => s.activo)
    .slice(0, 3);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx(i => i === 0 ? fotos.length - 1 : i - 1);
  };
  
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx(i => i === fotos.length - 1 ? 0 : i + 1);
  };

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      background: '#16181c',
      border: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.3s'
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,97,0.5)')}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
    >

      {/* ══ FOTO CON CARRUSEL ══ */}
      <div style={{
        position: 'relative',
        height: 280,
        background: '#111',
        flexShrink: 0
      }}>

        {fotoUrl ? (
          <img
            key={fotoUrl}
            src={fotoUrl}
            alt={modelo.nombre_artistico}
            loading='lazy'
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'opacity 0.3s'
            }}
            onError={(e) => {
              // Si falla, intenta la siguiente foto
              if (idx < fotos.length - 1)
                setIdx(i => i + 1);
            }}
          />
        ) : (
          <div style={{
            width:'100%', height:'100%',
            display:'flex', alignItems:'center',
            justifyContent:'center',
            background:'#1a1c21'
          }}>
            <span style={{
              fontSize:48, color:'#c9a961', opacity:0.3
            }}>◆</span>
          </div>
        )}

        {/* Gradiente nombre */}
        <div style={{
          position:'absolute', inset:0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)',
          pointerEvents: 'none'
        }}/>

        {/* Nombre sobre foto */}
        <p style={{
          position:'absolute', bottom:12, left:12,
          margin:0, color:'#c9a961',
          fontWeight:'bold', fontSize:16,
          fontFamily:'"Playfair Display", serif',
          textShadow:'0 2px 6px rgba(0,0,0,0.9)',
          zIndex:2
        }}>
          {modelo.nombre_artistico}
        </p>

        {/* Flechas — solo si hay más de 1 foto */}
        {fotos.length > 1 && (
          <>
            <button onClick={prev} style={{
              position:'absolute', left:8, top:'45%',
              transform:'translateY(-50%)',
              background:'rgba(0,0,0,0.65)',
              color:'#fff', border:'none',
              borderRadius:'50%', width:34, height:34,
              fontSize:20, cursor:'pointer',
              display:'flex', alignItems:'center',
              justifyContent:'center', zIndex:3
            }}>‹</button>

            <button onClick={next} style={{
              position:'absolute', right:8, top:'45%',
              transform:'translateY(-50%)',
              background:'rgba(0,0,0,0.65)',
              color:'#fff', border:'none',
              borderRadius:'50%', width:34, height:34,
              fontSize:20, cursor:'pointer',
              display:'flex', alignItems:'center',
              justifyContent:'center', zIndex:3
            }}>›</button>

            {/* Puntos indicadores */}
            <div style={{
              position:'absolute', bottom:38,
              left:0, right:0,
              display:'flex', justifyContent:'center',
              gap:5, zIndex:3
            }}>
              {fotos.map((_: any, i: number) => (
                <div
                  key={i}
                  onClick={e => { e.stopPropagation(); setIdx(i); }}
                  style={{
                    width: i === idx ? 18 : 6,
                    height: 6, borderRadius: 3,
                    background: i === idx
                      ? '#c9a961'
                      : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ CONTENIDO ══ */}
      <div style={{
        padding: '14px 14px 16px',
        display:'flex', flexDirection:'column',
        gap:10, flex:1
      }}>

        {/* PRECIO — siempre visible */}
        <div style={{
          display:'flex', alignItems:'baseline', gap:4
        }}>
          {precioBase ? (
            <>
              <span style={{color:'#888', fontSize:11}}>
                Desde
              </span>
              <span style={{
                color:'#c9a961', fontWeight:'bold',
                fontSize:18
              }}>
                ${precioBase.toLocaleString('es-CO')}
              </span>
              <span style={{color:'#888', fontSize:11}}>
                COP
              </span>
            </>
          ) : (
            <span style={{color:'#666', fontSize:12}}>
              Consultar precio
            </span>
          )}
        </div>

        {/* Chips de servicios */}
        {servicios.length > 0 && (
          <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
            {servicios.map((s: any) => (
              <span key={s.id} style={{
                fontSize:11, padding:'3px 10px',
                borderRadius:20,
                background:'rgba(201,169,97,0.1)',
                color:'#c9a961',
                border:'1px solid rgba(201,169,97,0.2)'
              }}>
                {s.nombre}
              </span>
            ))}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={() => onAgendar && onAgendar(modelo)}
          style={{
            marginTop:'auto', padding:'11px 0',
            borderRadius:10, background:'#c9a961',
            color:'#0f1014', fontWeight:'bold',
            fontSize:13, border:'none',
            cursor:'pointer', width:'100%'
          }}
        >
          ◆ Ver perfil y agendar
        </button>
      </div>
    </div>
  );
};
