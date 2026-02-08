# 🚀 Guía de Deployment - Black Diamond App

**Última actualización**: 2026-02-08  
**Versión**: 1.0.0  
**Estado**: ✅ Listo para Producción

---

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Variables de Entorno](#variables-de-entorno)
3. [Configuración de Supabase](#configuración-de-supabase)
4. [Deployment en Vercel](#deployment-en-vercel)
5. [Configuración Post-Deployment](#configuración-post-deployment)
6. [Verificación y Testing](#verificación-y-testing)
7. [Troubleshooting](#troubleshooting)
8. [Mantenimiento](#mantenimiento)

---

## 🔧 Requisitos Previos

### Servicios Necesarios

- ✅ **Cuenta de Supabase** (https://supabase.com)
- ✅ **Cuenta de Vercel** (https://vercel.com)
- ✅ **Node.js 18+** instalado localmente
- ✅ **Git** instalado y configurado

### Conocimientos Técnicos

- Básico de terminal/consola
- Básico de Git
- Acceso a configuración de DNS (si usas dominio personalizado)

---

## 🔐 Variables de Entorno

### Archivo `.env.local` (Para desarrollo)

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Database URL (opcional, para migraciones)
DATABASE_URL=postgresql://postgres:[password]@db.tu-proyecto.supabase.co:5432/postgres
```

### ⚠️ IMPORTANTE: Seguridad de Variables

- ✅ **NUNCA** subas el archivo `.env.local` a Git
- ✅ El archivo `.gitignore` ya está configurado para ignorar archivos `.env*`
- ✅ Usa el prefijo `VITE_` para variables accesibles desde el frontend
- ❌ **NO** expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend

### Dónde Encontrar las Claves de Supabase

1. Ve a tu dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `VITE_SUPABASE_SERVICE_ROLE_KEY` (¡cuidado!)

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto en Supabase

```bash
1. Ve a https://app.supabase.com
2. Click en "New Project"
3. Nombre: black-diamond-app (o el que prefieras)
4. Database Password: [genera una contraseña segura]
5. Region: South America (São Paulo) - más cercana a Colombia
6. Pricing Plan: Free (para empezar) o Pro (producción)
```

### 2. Configurar Autenticación

```bash
1. Ve a Authentication → Settings
2. Configurar URL permitidas:
   - Site URL: https://tu-dominio.com
   - Redirect URLs: https://tu-dominio.com/*, http://localhost:5173/*
3. Habilitar Email Provider
4. Configurar Email Templates (opcional)
```

### 3. Configurar Base de Datos

La aplicación usa **KV Store** (Key-Value Store) en Supabase, que ya está configurado en el código.

**Tabla `kv_store_9dadc017`** (se crea automáticamente):
- `key` (texto) - PRIMARY KEY
- `value` (jsonb) - Datos en formato JSON
- `created_at` (timestamp)
- `updated_at` (timestamp)

**No necesitas ejecutar migraciones SQL manualmente**, el sistema se auto-configura.

### 4. Configurar Edge Functions (Backend)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login a Supabase
supabase login

# Link a tu proyecto
supabase link --project-ref tu-project-ref

# Deploy las Edge Functions
supabase functions deploy make-server-9dadc017
```

**Archivos de Edge Functions**:
- `/supabase/functions/server/index.tsx` - Router principal
- `/supabase/functions/server/servicios-endpoints.tsx` - Endpoints de servicios
- `/supabase/functions/server/notificaciones-endpoints.tsx` - Endpoints de notificaciones
- `/supabase/functions/server/upload-modelos-fotos.tsx` - Upload de fotos

### 5. Configurar Storage (Opcional)

Si usas el sistema de fotos de modelos:

```bash
1. Ve a Storage en Supabase Dashboard
2. Crea un bucket llamado: make-9dadc017-modelos-fotos
3. Configuración:
   - Public: No (privado)
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp
```

---

## 🌐 Deployment en Vercel

### Opción 1: Deployment desde Git (Recomendado)

#### Paso 1: Preparar Repositorio

```bash
# Si aún no tienes Git inicializado
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit - Black Diamond App v1.0"

# Crear repo en GitHub y enlazar
git remote add origin https://github.com/tu-usuario/black-diamond-app.git
git push -u origin main
```

#### Paso 2: Conectar con Vercel

```bash
1. Ve a https://vercel.com
2. Click en "Add New Project"
3. Import desde GitHub
4. Selecciona tu repositorio black-diamond-app
5. Configuración del proyecto:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: build
```

#### Paso 3: Configurar Variables de Entorno en Vercel

```bash
1. En la página de configuración del proyecto
2. Ve a "Environment Variables"
3. Agregar las siguientes variables:

VITE_SUPABASE_URL = https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY = tu-anon-key-aqui
VITE_SUPABASE_SERVICE_ROLE_KEY = tu-service-role-key-aqui
```

⚠️ **Importante**: Marca `VITE_SUPABASE_SERVICE_ROLE_KEY` como sensible.

#### Paso 4: Deploy

```bash
1. Click en "Deploy"
2. Esperar 2-3 minutos
3. ¡Listo! Tu app está en producción
```

### Opción 2: Deployment con Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login a Vercel
vercel login

# Deploy
vercel

# Para producción
vercel --prod
```

---

## ⚙️ Configuración Post-Deployment

### 1. Configurar Dominio Personalizado (Opcional)

```bash
1. En Vercel Dashboard → Settings → Domains
2. Agregar dominio: blackdiamond.com
3. Configurar DNS en tu proveedor:
   - Tipo: A
   - Host: @
   - Value: 76.76.21.21 (IP de Vercel)
   
   O usar CNAME:
   - Tipo: CNAME
   - Host: www
   - Value: cname.vercel-dns.com
```

### 2. Configurar SSL/HTTPS

✅ Vercel configura SSL automáticamente con Let's Encrypt.

### 3. Crear Usuario Owner (Primera vez)

```bash
1. Ve a tu app: https://tu-dominio.vercel.app
2. En la consola del navegador, ejecuta el siguiente código para crear el owner:

// Usar la función InitOwnerPage integrada en la app
// O crear manualmente en Supabase:

# En Supabase SQL Editor:
INSERT INTO kv_store_9dadc017 (key, value) VALUES 
('user_owner@blackdiamond.com', '{
  "id": "owner-uuid",
  "email": "owner@blackdiamond.com",
  "role": "owner",
  "password": "HASH_AQUI",
  "created_at": "2026-02-08T00:00:00.000Z"
}');
```

**Recomendación**: Usa la página `/init-owner` incluida en la app para crear el owner de forma segura.

### 4. Configurar Políticas de Seguridad

#### En Supabase:

```sql
-- Habilitar Row Level Security
ALTER TABLE kv_store_9dadc017 ENABLE ROW LEVEL SECURITY;

-- Política de lectura (solo usuarios autenticados)
CREATE POLICY "Enable read for authenticated users" 
ON kv_store_9dadc017 FOR SELECT 
TO authenticated 
USING (true);

-- Política de escritura (solo service role)
CREATE POLICY "Enable write for service role" 
ON kv_store_9dadc017 FOR ALL 
TO service_role 
USING (true);
```

### 5. Configurar CORS en Edge Functions

Las Edge Functions ya tienen CORS configurado en `/supabase/functions/server/index.tsx`:

```typescript
app.use('*', cors({
  origin: [
    'https://tu-dominio.com',
    'https://tu-dominio.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

**Actualiza** los origins con tu dominio real antes de deploy.

---

## ✅ Verificación y Testing

### Checklist Post-Deployment

- [ ] La app carga correctamente en producción
- [ ] El login funciona con credenciales de prueba
- [ ] Los dashboards cargan según el rol
- [ ] Las imágenes y assets se cargan correctamente
- [ ] El sistema de agendamientos funciona
- [ ] El sistema de pagos registra transacciones
- [ ] Las notificaciones se muestran
- [ ] El sistema de analytics muestra datos
- [ ] Los formularios validan correctamente
- [ ] No hay errores en la consola del navegador
- [ ] El sistema es responsive en móvil

### Testing de Roles

```bash
1. Crear usuarios de prueba para cada rol:
   - Owner: owner@test.com
   - Admin: admin@test.com
   - Programador: programador@test.com
   - Modelo: modelo@test.com

2. Verificar que cada rol:
   ✅ Ve solo los módulos permitidos
   ✅ Puede realizar solo las acciones autorizadas
   ✅ No puede acceder a secciones restringidas
```

### Pruebas de Carga

```bash
# Opcional: Usar herramientas como
- Lighthouse (Chrome DevTools)
- WebPageTest.org
- GTmetrix

Métricas objetivo:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch" o CORS Error

**Causa**: Configuración de CORS en Edge Functions

**Solución**:
```typescript
// En /supabase/functions/server/index.tsx
// Asegúrate de incluir tu dominio en los origins
app.use('*', cors({
  origin: ['https://tu-dominio-real.com'],
  credentials: true
}));
```

### Error: "Invalid API Key"

**Causa**: Variables de entorno mal configuradas

**Solución**:
1. Verifica las variables en Vercel Dashboard
2. Re-deploy después de cambiar variables
3. Verifica que usas el prefijo `VITE_` correctamente

### Error: "Cannot connect to database"

**Causa**: URL de Supabase incorrecta o proyecto pausado

**Solución**:
1. Verifica que el proyecto de Supabase esté activo
2. Verifica la URL en las variables de entorno
3. Chequea el estado de Supabase: https://status.supabase.com

### La app carga lento

**Soluciones**:
1. Habilita compresión en Vercel (ya está por defecto)
2. Optimiza imágenes (usar WebP)
3. Verifica el tamaño del bundle en Analytics
4. Considera usar CDN para assets estáticos

### Errores de autenticación

**Solución**:
1. Verifica la configuración de Auth en Supabase
2. Chequea las Redirect URLs permitidas
3. Revisa los logs en Supabase Dashboard → Logs

---

## 🔄 Mantenimiento

### Actualizaciones de Código

```bash
# 1. Hacer cambios en local
git add .
git commit -m "Descripción del cambio"
git push origin main

# 2. Vercel hace auto-deploy automáticamente
# 3. Verificar en staging antes de merge a producción
```

### Backups de Base de Datos

```bash
# Backup manual desde Supabase Dashboard
1. Database → Backups
2. Create Backup
3. Descargar SQL dump

# O usar CLI:
supabase db dump -f backup-$(date +%Y%m%d).sql
```

### Monitoreo

**Herramientas recomendadas**:
- Vercel Analytics (incluido)
- Supabase Dashboard → Logs
- Sentry para error tracking (opcional)
- Google Analytics (opcional)

### Logs

```bash
# Ver logs en tiempo real
vercel logs tu-proyecto-url --follow

# Logs de Supabase
# Dashboard → Logs → API / Database / Realtime
```

### Updates de Dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias (cuidado con breaking changes)
npm update

# Actualizar React/Vite (revisar changelog primero)
npm install react@latest react-dom@latest
npm install vite@latest
```

---

## 📊 Métricas de Éxito

### KPIs de Deployment

- ✅ Uptime: > 99.9%
- ✅ Response Time: < 200ms promedio
- ✅ Error Rate: < 0.1%
- ✅ Build Time: < 3 minutos
- ✅ Deploy Time: < 5 minutos

### Optimizaciones Aplicadas

- ✅ Lazy loading de componentes pesados
- ✅ Code splitting por ruta
- ✅ Minificación de JS/CSS
- ✅ Compresión Gzip/Brotli
- ✅ Caché de assets estáticos
- ✅ CDN global de Vercel

---

## 🆘 Soporte

### Recursos

- **Documentación de Vercel**: https://vercel.com/docs
- **Documentación de Supabase**: https://supabase.com/docs
- **Documentación de Vite**: https://vitejs.dev

### Contacto

Para soporte técnico de Black Diamond App:
- Email: soporte@blackdiamond.com
- Documentación interna: Ver `/README.md`

---

## 🎉 ¡Felicitaciones!

Si llegaste hasta aquí, tu aplicación Black Diamond está **100% desplegada en producción**.

### Próximos Pasos Recomendados

1. ✅ Configurar backups automáticos
2. ✅ Implementar monitoreo de errores
3. ✅ Configurar alertas de downtime
4. ✅ Capacitar a los usuarios
5. ✅ Implementar CI/CD para staging/production

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-08  
**Estado**: ✅ Producción
