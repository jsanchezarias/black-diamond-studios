/** @type {import('tailwindcss').Config} */
export default {
  // ✅ FORZAR MODO OSCURO PERMANENTE - Sin toggle de tema
  darkMode: ['class', '[data-mode="dark"]'], // Siempre oscuro, sin detección automática
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        // Colores Black Diamond Premium
        'black-diamond': '#0d0d0d',
        'gold-champagne': '#c9a961',
        'gold-accent': '#d4af37',
        'gold-bright': '#f5d977',
        'gold-dark': '#b8941f',
        'platinum': '#e8e6e3',
        'card-bg': '#1a1a1a',
        'muted-dark': '#252321',
        'warm-gray': '#2a2826',
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundColor: {
        'default': '#0d0d0d',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        'landing-heading': ["var(--font-landing-heading)", "serif"],
        'landing-body': ["var(--font-landing-body)", "sans-serif"],
        accent: ["var(--font-accent)", "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        'premium': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card': '0 2px 16px rgba(0, 0, 0, 0.3)',
        'glow-gold': '0 0 20px rgba(201, 169, 97, 0.1)',
        'glow-gold-strong': '0 0 30px rgba(201, 169, 97, 0.2)',
      },
    },
  },
  plugins: [],
}