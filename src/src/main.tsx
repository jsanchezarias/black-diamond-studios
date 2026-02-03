import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '../styles/globals.css'

// Asegurar que el body tenga el fondo oscuro
document.documentElement.classList.add('dark');
document.body.style.backgroundColor = '#0d0d0d';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)