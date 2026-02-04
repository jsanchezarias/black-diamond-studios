import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '/styles/globals.css'

// ✅ FORZAR TEMA OSCURO PERMANENTE - Black Diamond App
// Aplicar estilos antes de renderizar para prevenir parpadeo
document.body.style.backgroundColor = '#0d0d0d';
document.body.style.color = '#e8e6e3';
document.documentElement.style.backgroundColor = '#0d0d0d';
document.documentElement.style.colorScheme = 'dark';

// Asegurar que las clases de modo oscuro estén siempre presentes
document.documentElement.classList.add('dark');
document.documentElement.setAttribute('data-mode', 'dark');
document.body.classList.add('dark');
document.body.setAttribute('data-mode', 'dark');

// Prevenir que cualquier script externo cambie el tema
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes') {
      const target = mutation.target as HTMLElement;
      if (!target.classList.contains('dark')) {
        target.classList.add('dark');
      }
      if (target.getAttribute('data-mode') !== 'dark') {
        target.setAttribute('data-mode', 'dark');
      }
    }
  });
});

observer.observe(document.documentElement, { 
  attributes: true, 
  attributeFilter: ['class', 'data-mode', 'style'] 
});
observer.observe(document.body, { 
  attributes: true, 
  attributeFilter: ['class', 'data-mode', 'style'] 
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)