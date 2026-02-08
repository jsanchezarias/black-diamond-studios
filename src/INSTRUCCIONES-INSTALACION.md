# 🚀 Instrucciones de Instalación - Black Diamond App

## ✅ BUENAS NOTICIAS

**NO NECESITAS INSTALAR NADA si estás usando Figma Make** (el entorno actual).

La aplicación ya está configurada y funcionando en el preview. Todas las dependencias se instalan automáticamente.

---

## 📦 Si Quieres Descargar el Proyecto a tu PC

Si deseas trabajar localmente en tu computadora, sigue estos pasos:

### **1. Requisitos Previos**

Necesitas tener instalado:
- **Node.js** versión 18 o superior ([descargar aquí](https://nodejs.org/))
- **npm** (viene incluido con Node.js)

Verifica que los tienes instalados:
```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
```

---

### **2. Descargar el Proyecto**

Desde Figma Make, descarga todos los archivos del proyecto a una carpeta en tu PC.

---

### **3. Instalar Dependencias**

Abre una terminal/consola en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará automáticamente:
- ✅ Vite
- ✅ React 18
- ✅ TypeScript
- ✅ Tailwind CSS v4
- ✅ Supabase
- ✅ Todas las demás dependencias

**Tiempo estimado:** 2-3 minutos

---

### **4. Configurar Variables de Entorno**

El proyecto usa Supabase. Las credenciales ya están configuradas en:
- `/src/utils/supabase/info.ts`
- `/utils/supabase/info.tsx`

**No necesitas crear archivo `.env`** porque las credenciales están en el código.

---

### **5. Iniciar el Servidor de Desarrollo**

```bash
npm run dev
```

Esto abrirá la aplicación en: **http://localhost:5173**

---

### **6. Compilar para Producción**

Cuando estés listo para deployar:

```bash
npm run build
```

Esto generará los archivos optimizados en la carpeta `/build/`

Para probar el build de producción:
```bash
npm run preview
```

---

## 🎨 Estructura del Proyecto

```
black-diamond-app/
├── src/                          # Código fuente principal
│   ├── App.tsx                   # Componente principal
│   ├── main.tsx                  # Entry point
│   ├── app/components/           # Componentes de la app
│   └── utils/                    # Utilidades
├── components/                   # Componentes compartidos
│   └── ui/                       # UI components (shadcn)
├── styles/
│   └── globals.css               # ⭐ Tema global (NUEVO)
├── supabase/
│   └── functions/                # Edge functions del backend
├── index.html                    # HTML principal
├── package.json                  # Dependencias
├── vite.config.ts                # Configuración de Vite
├── tsconfig.json                 # Configuración de TypeScript
└── postcss.config.js             # Configuración de PostCSS
```

---

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Compila para producción
npm run preview      # Preview del build de producción
npm run lint         # Ejecuta ESLint
```

---

## 🎨 Tema de Colores

El nuevo tema simplificado está en `/styles/globals.css`:

```css
/* 4 fondos */
--bg-black: #000000
--bg-dark: #0f0f0f
--bg-card: #1a1a1a
--bg-hover: #242424

/* 3 textos */
--text-white: #ffffff
--text-gray: #a0a0a0
--text-muted: #666666

/* 1 dorado */
--gold: #d4af37
```

---

## 🔧 Solución de Problemas

### Error: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error de Tailwind CSS
El proyecto usa **Tailwind CSS v4** con sintaxis de variables CSS.
- No necesitas `tailwind.config.js`
- Todo está en `/styles/globals.css`

### Puerto 5173 ocupado
```bash
npm run dev -- --port 3000
```

### Build muy lento
```bash
# Limpiar cache
npm run build -- --force
```

---

## 📚 Tecnologías Usadas

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool super rápido
- **Tailwind CSS v4** - Estilos utility-first
- **Supabase** - Backend (auth, database, storage)
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de datos
- **Lucide React** - Iconos
- **Recharts** - Gráficas
- **Sonner** - Notificaciones toast

---

## 🚀 Deploy a Producción

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Build manual
```bash
npm run build
# Los archivos estarán en /build/
# Sube esa carpeta a tu hosting
```

---

## ⚡ Resumen Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar desarrollo
npm run dev

# 3. Abrir navegador
# → http://localhost:5173

# ✅ Listo!
```

---

## 📞 Soporte

- Documentación: Ver `/README.md`
- Nomenclatura: Ver `/DICCIONARIO_NOMENCLATURA.md`
- Tema: Ver `/TEMA-REINICIADO.md`

---

**🎯 IMPORTANTE: Si estás en Figma Make, NO necesitas hacer nada de esto. Todo ya funciona en el preview.**
