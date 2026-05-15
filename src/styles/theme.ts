export const theme = {
  colors: {
    bg: {
      primary: '#080808',
      secondary: '#0f0f0f',
      tertiary: '#161616',
      card: '#111111',
      cardHover: '#1a1a1a',
      overlay: 'rgba(0,0,0,0.85)',
    },
    gold: {
      primary: '#C9A84C',
      light: '#E8C96B',
      dark: '#9A7A2E',
      glow: 'rgba(201,168,76,0.15)',
      border: 'rgba(201,168,76,0.25)',
    },
    red: {
      neon: '#FF0033',
      glow: 'rgba(255,0,51,0.2)',
      border: 'rgba(255,0,51,0.3)',
      soft: '#CC0029',
    },
    text: {
      primary: '#F5F0E8',
      secondary: 'rgba(245,240,232,0.6)',
      tertiary: 'rgba(245,240,232,0.35)',
      gold: '#C9A84C',
    },
    status: {
      success: '#2E7D32',
      successLight: '#4CAF50',
      warning: '#E65100',
      warningLight: '#FF9800',
      error: '#B71C1C',
      errorLight: '#FF4444',
    },
  },
  shadows: {
    gold: '0 0 20px rgba(201,168,76,0.3)',
    goldStrong: '0 0 40px rgba(201,168,76,0.5)',
    red: '0 0 20px rgba(255,0,51,0.4)',
    redStrong: '0 0 40px rgba(255,0,51,0.6)',
    card: '0 4px 24px rgba(0,0,0,0.6)',
    cardHover: '0 8px 40px rgba(0,0,0,0.8)',
  },
  borders: {
    gold: '0.5px solid rgba(201,168,76,0.25)',
    goldBright: '1px solid rgba(201,168,76,0.6)',
    red: '0.5px solid rgba(255,0,51,0.3)',
    subtle: '0.5px solid rgba(255,255,255,0.06)',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
} as const;

export type Theme = typeof theme;
