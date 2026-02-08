import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    // 🚀 OPTIMIZACIONES DE BUILD PARA PRODUCCIÓN
    rollupOptions: {
      output: {
        // Separar vendor chunks para mejor caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui-vendor': ['lucide-react', 'recharts', 'date-fns'],
        },
      },
    },
    // Optimización de chunks
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.logs en producción
        drop_debugger: true,
      },
    },
  },
  // Optimización de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
})