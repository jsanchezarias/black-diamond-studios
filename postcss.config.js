export default {
  plugins: {
    // Tailwind v4 se maneja vía plugin de Vite
    // 🔥 VERCEL FIX: Agregar optimizaciones para producción
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: false, // Mantener comentarios para debugging
          },
          normalizeWhitespace: true,
          // NO reducir colores ni cambiar valores
          colormin: false,
          reduceIdents: false,
        }],
      },
    } : {}),
  },
}