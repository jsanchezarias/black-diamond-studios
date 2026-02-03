# 🚀 DEPLOY RÁPIDO - BLACK DIAMOND APP

## ⚡ Pasos Rápidos para Subir a Producción

### 1️⃣ **Preparar Repositorio Git**

```bash
# Inicializar Git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "feat: Black Diamond App completa con chat en tiempo real"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/tu-usuario/black-diamond-app.git
git branch -M main
git push -u origin main
```

---

### 2️⃣ **Configurar Supabase**

1. **Ir a**: https://supabase.com/dashboard
2. **Crear nuevo proyecto** o usar uno existente
3. **Copiar credenciales**:
   - URL: `https://tu-proyecto.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Crear Tablas**: Ejecutar en SQL Editor

```sql
-- Tabla de clientes (para chat y sistema)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  telefono TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  sesion_activa BOOLEAN DEFAULT FALSE,
  sesion_expires_at TIMESTAMPTZ,
  sesion_ultimo_acceso TIMESTAMPTZ,
  total_servicios INTEGER DEFAULT 0,
  total_gastado NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes de chat
CREATE TABLE IF NOT EXISTS chat_mensajes_publicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_chat_sender ON chat_mensajes_publicos(sender_id);
CREATE INDEX idx_chat_receiver ON chat_mensajes_publicos(receiver_id);
CREATE INDEX idx_chat_created ON chat_mensajes_publicos(created_at DESC);
CREATE INDEX idx_clientes_sesion ON clientes(sesion_activa, sesion_expires_at);

-- Habilitar Row Level Security (opcional pero recomendado)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes_publicos ENABLE ROW LEVEL SECURITY;

-- Política permisiva para desarrollo (ajustar en producción)
CREATE POLICY "Allow all for authenticated users" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON chat_mensajes_publicos FOR ALL USING (true);
```

5. **Habilitar Realtime**:
   - Ir a: `Database > Replication`
   - Activar en:
     - ✅ `clientes`
     - ✅ `chat_mensajes_publicos`

6. **Crear Usuario Programador**:

```sql
INSERT INTO clientes (nombre, email, telefono, total_servicios, total_gastado)
VALUES ('Black Diamond', 'programador@app.com', '3000000000', 0, 0)
ON CONFLICT (email) DO NOTHING;
```

---

### 3️⃣ **Deploy en Vercel**

1. **Ir a**: https://vercel.com/new
2. **Importar repositorio** de GitHub
3. **Configurar variables de entorno**:
   ```
   VITE_SUPABASE_URL = https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Settings del proyecto**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy** 🚀

---

### 4️⃣ **Verificar Deployment**

#### **Landing Page:**
- [ ] Cargar URL: `https://tu-app.vercel.app`
- [ ] Header visible
- [ ] Chat visible al hacer scroll

#### **Chat de Cliente:**
- [ ] Click en "Iniciar Sesión" en el chat
- [ ] Ingresar: Nombre "Juan Salas" + Teléfono "3001234567"
- [ ] Escribir mensaje: "Hola"
- [ ] ✅ Mensaje aparece instantáneamente

#### **Dashboard de Programador:**
1. En otra pestaña o navegador:
2. Click en "Admin" (header)
3. Login: `programador@app.com` / (crear contraseña en Supabase Auth)
4. Ir a tab **"Chat"**
5. ✅ Ver conversación de "Juan Salas"
6. ✅ Ver mensaje "Hola"
7. Responder: "¡Bienvenido!"
8. ✅ Volver a pestaña del cliente
9. ✅ Ver respuesta instantáneamente

---

## 🎉 ¡LISTO!

Tu aplicación Black Diamond está en vivo y funcionando.

### 📱 URLs de Acceso:

- **Landing Pública**: `https://tu-app.vercel.app`
- **Login Admin**: Click en "Admin" en el header
- **Chat Público**: Scroll down en landing page

### 🔑 Credenciales:

**Crear en Supabase > Authentication > Users:**
- Owner: `owner@app.com`
- Admin: `admin@app.com`  
- Programador: `programador@app.com`
- Modelos: Crear según necesites

**Clientes del Chat:**
- Solo necesitan nombre y teléfono
- No requieren contraseña

---

## 🐛 Si Algo No Funciona:

1. **Verificar en Vercel > Deployment Logs**
2. **Verificar en Supabase > Table Editor**
3. **Abrir consola del navegador (F12)**
4. **Ver archivo**: `/DEPLOYMENT_CHECKLIST.md`

---

## 📊 Monitoreo:

- **Vercel Analytics**: Tráfico y performance
- **Supabase Dashboard**: Base de datos y realtime
- **Browser Console**: Errores del frontend

---

**¿Necesitas ayuda?** Revisa `/DEPLOYMENT_CHECKLIST.md` para troubleshooting detallado.
