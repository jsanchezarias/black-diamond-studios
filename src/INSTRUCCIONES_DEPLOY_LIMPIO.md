# Instrucciones para Deploy Limpio en Vercel

## El Problema

El error `Cannot find module '@tailwindcss/postcss'` indica que Vercel está usando un caché viejo de cuando el proyecto usaba Tailwind v4. Necesitamos hacer un deploy limpio.

## Solución: Limpiar Caché de Vercel

### Opción 1: Desde la UI de Vercel (Más Rápido)

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona el proyecto "Black Diamond App"
3. Ve a **Settings** (Configuración)
4. En el menú lateral, busca **General**
5. Baja hasta encontrar **Build & Development Settings**
6. Activa la opción **"Install Command"** y pon:
   ```
   rm -rf .next && npm ci
   ```
7. Guarda los cambios
8. Ve a **Deployments**
9. Click en los tres puntos (...) del último deployment
10. Selecciona **"Redeploy"**
11. **IMPORTANTE**: Marca la casilla **"Use existing Build Cache"** como **DESACTIVADA**
12. Click en **"Redeploy"**

### Opción 2: Desde Terminal (Más Control)

```bash
# 1. Instala Vercel CLI si no la tienes
npm i -g vercel

# 2. Navega a tu proyecto
cd "/Users/juliansanchez/Downloads/Black Diamond App"

# 3. Limpia todo localmente
rm -rf node_modules package-lock.json .next dist

# 4. Instala dependencias limpias
npm install

# 5. Verifica que compile localmente
npm run build

# 6. Si compila bien, haz deploy limpio (sin caché)
vercel --prod --force
```

### Opción 3: Desde GitHub (Trigger automático)

Si el proyecto está conectado a GitHub:

```bash
# 1. Navega al proyecto
cd "/Users/juliansanchez/Downloads/Black Diamond App"

# 2. Haz un commit vacío para forzar redeploy
git commit --allow-empty -m "chore: force clean deploy after Tailwind v3 migration"

# 3. Push a main/master
git push origin main
```

Luego en Vercel:
1. Espera que se inicie el deployment automático
2. **CANCELA** ese deployment
3. Ve a Settings > General
4. En "Ignored Build Step", asegúrate que esté vacío o solo tenga:
   ```bash
   git diff HEAD^ HEAD --quiet
   ```
5. Vuelve a hacer push:
   ```bash
   git commit --allow-empty -m "chore: redeploy with clean cache"
   git push origin main
   ```

## Verificar que Funcionó

Después del deploy, verifica:

✅ No hay errores de PostCSS
✅ El fondo es negro (#0d0d0d), no blanco
✅ Los acentos dorados se ven correctamente
✅ Las fuentes premium están cargando (Playfair Display, Cinzel, Montserrat)
✅ Los efectos visuales (glow, shadows) funcionan

## Si Aún Falla

Si después de limpiar caché sigue fallando:

1. Verifica que estos archivos existan y estén correctos:
   - `/postcss.config.js`
   - `/.postcssrc.json`
   - `/tailwind.config.js`
   - `/package.json` (debe tener `tailwindcss: ^3.4.1`)

2. Verifica en Vercel Settings > Environment Variables que no haya variables viejas relacionadas con Tailwind

3. Como último recurso, elimina el proyecto en Vercel y crea uno nuevo conectado al mismo repo de GitHub

## Archivos Clave Actualizados

- ✅ `package.json` - Tailwind v3.4.1
- ✅ `postcss.config.js` - Configuración ES module
- ✅ `.postcssrc.json` - Configuración JSON redundante
- ✅ `tailwind.config.js` - Config completa v3
- ✅ `/styles/theme.css` - Colores hex directos (#0d0d0d)
- ✅ `/styles/tailwind.css` - Directivas @tailwind

## Comandos de Verificación Local

```bash
# Antes de hacer deploy, verifica localmente:
npm run build

# Si falla, limpia y reinstala:
rm -rf node_modules package-lock.json
npm install
npm run build

# Si compila, prueba en desarrollo:
npm run dev
```

El proyecto está 100% migrado a Tailwind v3 estable. Solo necesita un deploy limpio sin caché.
