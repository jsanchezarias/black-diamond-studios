# 💎 Black Diamond - Sistema de Gestión Premium

Aplicación web completa para gestión de agencia premium con 4 roles de usuario: Owner, Admin, Programador y Modelo.

## 🎨 Tema de Colores

### **Simple y Elegante**

```css
/* FONDOS */
--bg-black: #000000      /* Negro puro - Fondo principal */
--bg-dark: #0f0f0f       /* Negro carbón - Sidebars */
--bg-card: #1a1a1a       /* Gris muy oscuro - Cards */
--bg-hover: #242424      /* Gris oscuro - Hover */

/* TEXTOS */
--text-white: #ffffff    /* Blanco - Títulos */
--text-gray: #a0a0a0     /* Gris claro - Texto normal */
--text-muted: #666666    /* Gris oscuro - Secundario */

/* DORADO */
--gold: #d4af37          /* Dorado - Acentos únicos */
--gold-hover: #e5c158    /* Dorado claro - Hover */

/* ESTADOS */
--success: #10b981       /* Verde */
--error: #ef4444         /* Rojo */
--warning: #f59e0b       /* Amarillo */
```

## 📦 Uso de Clases

```jsx
// Fondos
<div className="bg-black">      {/* Negro puro */}
<div className="bg-dark">       {/* Negro carbón */}
<div className="bg-card">       {/* Cards */}

// Textos
<h1 className="text-white">     {/* Títulos */}
<p className="text-gray">       {/* Normal */}
<span className="text-muted">   {/* Secundario */}
<span className="text-gold">    {/* Dorado */}

// Botones
<button className="btn-primary">    {/* Dorado */}
<button className="btn-secondary">  {/* Outline */}
<button className="btn-ghost">      {/* Transparente */}

// Componentes
<div className="card">              {/* Card premium */}
<span className="badge-success">    {/* Badge verde */}
<span className="badge-gold">       {/* Badge dorado */}
```

## 🚀 Desarrollo

```bash
npm install
npm run dev
```

## 📁 Estructura

```
/
├── src/
│   ├── app/components/    # Componentes principales
│   ├── main.tsx           # Entry point
│   └── App.tsx            # App principal
├── components/            # Componentes compartidos
│   ├── ui/               # UI components (shadcn)
│   └── icons/            # Sistema de iconos premium
├── styles/
│   └── globals.css       # Tema global
└── supabase/
    └── functions/        # Edge functions
```

## 📖 Documentación

- `DICCIONARIO_NOMENCLATURA.md` - Nomenclatura oficial del sistema
- Ver `/guidelines/` para más documentación

---

**Mantén la simplicidad. Negro, gris, dorado. Nada más.**
