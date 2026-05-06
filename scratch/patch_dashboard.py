import os

path = r"c:\Users\DELL\Desktop\Black damion\black-diamond-studios\src\app\components\ClienteDashboard.tsx"

new_code = """interface PremiumModelCardProps {
  modelo: any;
  index: number;
  onAgendar: () => void;
}

function PremiumModelCard({ modelo, index, onAgendar }: PremiumModelCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const delay = `${index * 100}ms`;
  const precioBase = modelo.services?.[0]?.price || null;
  const photoToShow = modelo.photo || '';

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col w-full h-[600px]"
      style={{
        background: C.card,
        border: hovered ? `1px solid ${C.borderGold}` : `1px solid ${C.border}`,
        boxShadow: hovered ? '0 0 20px rgba(201,169,97,0.15)' : 'none',
        transition: 'border 0.3s, box-shadow 0.3s',
        animation: `bdFadeInUp 0.4s ease ${delay} both`,
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 1. Foto Area (400px) */}
      <div className="relative overflow-hidden h-[400px] flex-none">
        {photoToShow && !imgError ? (
          <img
            src={photoToShow}
            alt={modelo.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            style={{
              transform: hovered ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a1c20 0%, #0f1014 100%)' }}>
            <Sparkles style={{ color: C.gold, width: 40, height: 40, opacity: 0.3 }} />
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        }} />

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-2">
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.15rem', fontWeight: 700,
              color: 'white', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}>
              ◆ {modelo.name}
            </h3>
            {modelo.disponible ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"
                  style={{ animation: 'bdPulse 2s infinite' }} />
                Disponible
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0"
                style={{ background: 'rgba(107,114,128,0.22)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.3)' }}>
                Sin horarios
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Content Area (200px) */}
      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        {/* Tags */}
        <div className="flex-1 overflow-hidden">
          {modelo.services?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-hidden">
              {modelo.services.slice(0, 4).map((s: any, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
                  style={{ background: 'rgba(201,169,97,0.1)', color: C.gold, border: '1px solid rgba(201,169,97,0.2)' }}>
                  {s.name}
                </span>
              ))}
              {modelo.services.length > 4 && (
                <span className="px-2 py-1 text-[10px]" style={{ color: C.muted }}>
                  +{modelo.services.length - 4} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info y Precio */}
        <div className="mt-auto">
          {precioBase && (
            <div className="mb-2" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: C.muted }}>Desde </span>
              <span style={{ color: C.gold, fontWeight: 700, fontSize: '0.95rem' }}>
                ${precioBase}
              </span>
            </div>
          )}

          <button
            onClick={onAgendar}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${C.gold} 0%, #a07c3a 100%)`,
              color: '#0f1014',
              transform: hovered ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.2s',
            }}
          >
            ◆ AGENDAR AHORA
          </button>
        </div>
      </div>
    </div>
"""

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import re
# Regex to find the PremiumModelCard function and its props interface
pattern = r"interface PremiumModelCardProps \{.*?\}.*?function PremiumModelCard.*?\{.*?\n\}"
# We need to be careful because the function body contains braces.
# Let's find by markers.

start_marker = "interface PremiumModelCardProps"
end_marker = "}\n\n// ─── CitaCard" # This is a strong marker in the file

start_idx = content.find(start_marker)
end_idx = content.find("// ─── CitaCard")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_code + "\\n\\n" + content[end_idx:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched ClienteDashboard.tsx")
else:
    print(f"Could not find markers: {start_idx}, {end_idx}")
