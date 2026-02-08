import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // ✅ Corregido: importar desde el mismo directorio /src/
import '../styles/globals.css'

// ✅ CAPTURAR ERRORES ANTES DE QUE REACT SE MONTE
console.log('🚀 main.tsx: Iniciando aplicación...');

// ✅ FORZAR TEMA OSCURO PERMANENTE - Black Diamond App
document.body.style.backgroundColor = '#0d0d0d';
document.body.style.color = '#e8e6e3';
document.documentElement.style.backgroundColor = '#0d0d0d';
document.documentElement.style.colorScheme = 'dark';

// Asegurar que las clases de modo oscuro estén siempre presentes
document.documentElement.classList.add('dark');
document.documentElement.setAttribute('data-mode', 'dark');
document.body.classList.add('dark');
document.body.setAttribute('data-mode', 'dark');

console.log('🔄 main.tsx: Configuración de tema completada');

// Capturar errores globales
window.addEventListener('error', (event) => {
  console.error('❌ ERROR GLOBAL EN MAIN.TSX:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

console.log('🔄 main.tsx: Montando React...');

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ main.tsx: React montado correctamente');
} catch (error) {
  console.error('❌ ERROR AL MONTAR REACT:', error);
  document.body.innerHTML = `
    <div style="min-height: 100vh; background: #0a0a0f; color: #e8e6e3; display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <div style="text-align: center; max-width: 600px;">
        <h1 style="color: #c9a961; font-size: 2rem; margin-bottom: 1rem;">❌ Error Fatal</h1>
        <p style="margin-bottom: 1rem;">Error al montar React:</p>
        <pre style="background: #1a1a24; padding: 1rem; border-radius: 8px; overflow: auto; text-align: left; font-size: 0.875rem;">${error}</pre>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #c9a961; color: #0a0a0f; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
          Recargar Página
        </button>
      </div>
    </div>
  `;
}