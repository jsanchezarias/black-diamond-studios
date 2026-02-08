# ⚡ GUÍA RÁPIDA - Black Diamond

## 🤔 ¿Necesito Instalar Algo?

### Si estás en Figma Make:
```
❌ NO - Todo funciona automáticamente en el preview
```

### Si quieres trabajar localmente:
```bash
✅ SÍ
1. Instala Node.js 18+
2. npm install
3. npm run dev
```

---

## 🎨 Colores Disponibles

```jsx
// FONDOS
className="bg-black"    // #000000 - Negro puro
className="bg-dark"     // #0f0f0f - Sidebars
className="bg-card"     // #1a1a1a - Cards
className="bg-hover"    // #242424 - Hover

// TEXTOS
className="text-white"  // #ffffff - Títulos
className="text-gray"   // #a0a0a0 - Normal
className="text-muted"  // #666666 - Secundario
className="text-gold"   // #d4af37 - Dorado

// ESTADOS
className="text-success"  // #10b981 - Verde
className="text-error"    // #ef4444 - Rojo
className="text-warning"  // #f59e0b - Amarillo
```

---

## 🔧 Componentes Listos

```jsx
// BOTONES
<button className="btn-primary">Dorado</button>
<button className="btn-secondary">Outline</button>
<button className="btn-ghost">Ghost</button>

// CARDS
<div className="card">Contenido</div>

// BADGES
<span className="badge-success">Éxito</span>
<span className="badge-error">Error</span>
<span className="badge-gold">Premium</span>
```

---

## 📁 Archivos Importantes

```
📖 Documentación
├── LEEME-PRIMERO.md           ← Empieza aquí
├── ESTADO-ACTUAL.md           ← Qué se hizo hoy
├── README.md                  ← Doc principal
└── DICCIONARIO_NOMENCLATURA.md ← Nomenclatura

🎨 Estilos
└── styles/globals.css         ← TODO el tema aquí

⚛️ App
├── src/App.tsx                ← Componente principal
└── src/main.tsx               ← Entry point
```

---

## ⚡ Comandos Útiles (Solo Local)

```bash
npm install        # Instalar dependencias
npm run dev        # Iniciar desarrollo
npm run build      # Compilar producción
npm run preview    # Preview del build
```

---

## ✅ Checklist Rápido

En Figma Make:
- [ ] Preview carga con fondo negro
- [ ] Spinner dorado aparece al cargar
- [ ] Aplicación funciona correctamente

En Local (Opcional):
- [ ] Node.js 18+ instalado
- [ ] `npm install` ejecutado sin errores
- [ ] `npm run dev` funciona
- [ ] Abre en `localhost:5173`

---

## 🎯 Reglas del Tema

1. **Solo 11 colores** - Negro, Gris, Dorado, Blanco + Estados
2. **2 fuentes** - Inter (normal) + Playfair Display (títulos)
3. **No crear CSS custom** - Usar clases de globals.css
4. **No agregar colores** - El tema está finalizado

---

## 🚨 Si Algo Falla

### Preview no carga
```
1. Refresca el navegador
2. Revisa consola de errores
3. Verifica que globals.css exista
```

### Colores no aparecen
```
1. Usa clases exactas: bg-black, text-white, text-gold
2. NO uses: bg-obsidian, text-platinum (ya no existen)
3. Verifica /styles/globals.css
```

### Error al instalar (local)
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Más Ayuda

| Tema | Ver archivo |
|------|-------------|
| Instalación completa | `/INSTRUCCIONES-INSTALACION.md` |
| Nomenclatura del sistema | `/DICCIONARIO_NOMENCLATURA.md` |
| Cambios al tema | `/TEMA-REINICIADO.md` |
| Estado del proyecto | `/ESTADO-ACTUAL.md` |

---

## 💡 Tips Rápidos

```jsx
// ✅ BIEN
<div className="bg-black text-white">
  <h1 className="text-gold">Título</h1>
  <button className="btn-primary">Acción</button>
</div>

// ❌ MAL
<div className="bg-obsidian text-platinum">
  <h1 style={{color: '#d4af37'}}>Título</h1>
  <button className="bg-[#d4af37]">Acción</button>
</div>
```

---

**🎯 Listo. Con esto tienes todo lo que necesitas. ⚡**
