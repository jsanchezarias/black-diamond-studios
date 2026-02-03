# 🚀 CHECKLIST DE DEPLOYMENT - BLACK DIAMOND APP

## ✅ PRE-DEPLOYMENT

### 1. **Configuración de Supabase**
- [ ] Proyecto de Supabase creado
- [ ] Tablas creadas y configuradas:
  - [ ] `clientes` (con campos: id, nombre, email, telefono, sesion_activa, sesion_expires_at, etc.)
  - [ ] `chat_mensajes_publicos` (con campos: id, sender_id, receiver_id, message, is_read, role, color, created_at)
  - [ ] `agendamientos`
  - [ ] `modelos`
  - [ ] `servicios`
  - [ ] `multas`
  - [ ] `pagos`
  - [ ] `gastos`
  - [ ] `testimonios`
  - [ ] `videos`
  - [ ] Otras tablas según tu sistema
- [ ] **Realtime habilitado** para:
  - [ ] `clientes` (Database > Replication)
  - [ ] `chat_mensajes_publicos` (Database > Replication)
- [ ] **Row Level Security (RLS)** configurado
- [ ] Usuario programador creado en tabla `clientes` con email: `programador@app.com`

### 2. **Variables de Entorno**
- [ ] Copiar `.env.example` a `.env.local`
- [ ] Configurar `VITE_SUPABASE_URL`
- [ ] Configurar `VITE_SUPABASE_ANON_KEY`

### 3. **Código**
- [ ] Todos los componentes compilando sin errores
- [ ] No hay errores de TypeScript
- [ ] Probar build local: `npm run build`
- [ ] Probar preview local: `npm run preview`

---

## 🌐 DEPLOYMENT EN VERCEL

### 1. **Conectar Repositorio**
- [ ] Crear repositorio en GitHub
- [ ] Push del código a GitHub
- [ ] Conectar repositorio en Vercel

### 2. **Configurar Variables de Entorno en Vercel**
Ir a: **Project Settings > Environment Variables**

Agregar:
```
VITE_SUPABASE_URL = https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY = tu-anon-key-aqui
```

### 3. **Build Settings**
Vercel debería detectar automáticamente:
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 4. **Deploy**
- [ ] Hacer deploy inicial
- [ ] Verificar que no hay errores de build
- [ ] Verificar que la app carga correctamente

---

## 🧪 POST-DEPLOYMENT - TESTING

### 1. **Landing Page Pública**
- [ ] La página carga correctamente
- [ ] Header se muestra correctamente
- [ ] Sección de modelos carga
- [ ] Chat público está visible
- [ ] Footer se muestra

### 2. **Chat Público (Usuario)**
- [ ] Botón "Iniciar Sesión" funciona
- [ ] Modal de login aparece
- [ ] Login con nombre y teléfono funciona
- [ ] Usuario puede escribir mensajes
- [ ] Mensajes aparecen instantáneamente (optimistic update)
- [ ] Usuario solo ve sus mensajes y los de la programadora
- [ ] Modal de propinas funciona

### 3. **Sistema de Login Administrativo**
- [ ] Botón "Admin" en el header funciona
- [ ] Modal de login aparece
- [ ] Login con credenciales funciona

### 4. **Dashboard de Owner**
- [ ] Login como owner funciona
- [ ] Dashboard carga correctamente
- [ ] Puede ver estadísticas
- [ ] Puede crear modelos
- [ ] Puede gestionar usuarios

### 5. **Dashboard de Admin**
- [ ] Login como admin funciona
- [ ] Dashboard carga correctamente
- [ ] Puede ver agendamientos
- [ ] Puede crear agendamientos

### 6. **Dashboard de Programador (CHAT)**
- [ ] Login como programador funciona
- [ ] Dashboard carga correctamente
- [ ] **Tab de Chat visible**
- [ ] **Lista de conversaciones carga**
- [ ] **Puede ver conversación de Juan Salas (o cualquier cliente que haya escrito)**
- [ ] **Puede leer mensajes del cliente**
- [ ] **Puede responder mensajes**
- [ ] **Mensajes llegan al cliente en tiempo real**
- [ ] **Cliente recibe respuestas instantáneamente**

### 7. **Dashboard de Modelo**
- [ ] Login como modelo funciona
- [ ] Dashboard carga correctamente
- [ ] Puede ver sus servicios

### 8. **Testing de Flujo Completo de Chat**

**Escenario A: Cliente → Programador**
1. [ ] Abrir landing page en una pestaña (Incógnito)
2. [ ] Iniciar sesión como "Juan Salas" (o crear nuevo cliente)
3. [ ] Escribir mensaje: "Hola, necesito información"
4. [ ] Mensaje aparece instantáneamente en el chat del cliente
5. [ ] En otra pestaña, login como programador
6. [ ] Ir al Tab de Chat
7. [ ] Verificar que aparece la conversación de "Juan Salas"
8. [ ] Abrir conversación
9. [ ] Verificar que se ve el mensaje "Hola, necesito información"

**Escenario B: Programador → Cliente**
1. [ ] Desde dashboard de programador, responder: "¡Claro! ¿En qué puedo ayudarte?"
2. [ ] Mensaje se envía correctamente
3. [ ] En la pestaña del cliente, verificar que llega la respuesta instantáneamente
4. [ ] Verificar que aparece con el nombre "Black Diamond" o "Programadora"
5. [ ] Verificar que tiene el color dorado (#d4af37)

**Escenario C: Conversación Completa**
1. [ ] Cliente escribe: "Quiero agendar para mañana"
2. [ ] Programador responde: "Perfecto, ¿qué hora prefieres?"
3. [ ] Cliente responde: "8pm"
4. [ ] Programador responde: "Listo, agendado para mañana 8pm"
5. [ ] Verificar que todos los mensajes llegan en tiempo real
6. [ ] Verificar que los mensajes se ordenan correctamente

---

## 🐛 TROUBLESHOOTING

### Problema: "AbortError: signal is aborted without reason"
**Solución:**
- Verificar que Realtime está habilitado en Supabase
- Verificar que las credenciales de Supabase son correctas
- Hacer hard refresh (Ctrl + Shift + R)

### Problema: Mensajes no llegan en tiempo real
**Solución:**
- Database > Replication en Supabase
- Habilitar Realtime para `chat_mensajes_publicos`
- Habilitar Realtime para `clientes`

### Problema: "No se encontró el usuario programador"
**Solución:**
- Crear usuario en tabla `clientes` con:
  - nombre: "Black Diamond" o "Programadora Black Diamond"
  - email: "programador@app.com"
  - telefono: "3000000000"

### Problema: Conversaciones no aparecen en el dashboard del programador
**Solución:**
- Verificar que el usuario programador existe
- Verificar que los mensajes tienen `sender_id` y `receiver_id` correctos
- Verificar en Supabase SQL Editor:
  ```sql
  SELECT * FROM chat_mensajes_publicos ORDER BY created_at DESC LIMIT 10;
  ```

---

## 📊 MÉTRICAS DE ÉXITO

- [ ] **Tiempo de carga inicial** < 3 segundos
- [ ] **Mensajes instantáneos** (optimistic update)
- [ ] **Sincronización en tiempo real** < 1 segundo
- [ ] **0 errores en consola** (excepto warnings esperados)
- [ ] **Responsive en móvil** y desktop

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Una vez que todos los checkboxes estén marcados, tu aplicación está lista para ser usada en producción.

**URLs de Prueba:**
- Landing Page: `https://tu-app.vercel.app`
- Chat Público: `https://tu-app.vercel.app` (scroll down al chat)
- Admin Login: `https://tu-app.vercel.app` (botón "Admin" en header)

**Credenciales de Prueba:**
- **Owner**: owner@app.com / (tu contraseña)
- **Admin**: admin@app.com / (tu contraseña)
- **Programador**: programador@app.com / (tu contraseña)
- **Modelo**: (emails de modelos creados)
- **Cliente Chat**: Solo nombre y teléfono (sin contraseña)

---

## 📝 NOTAS IMPORTANTES

1. **No borrar nunca** la tabla `clientes` sin backup
2. **Realtime debe estar habilitado** siempre
3. **Supabase tiene límite de 500MB** en plan free
4. **Considerar upgrade a Pro** si hay mucho tráfico
5. **Monitorear errores** con Sentry o similar (opcional)

---

## 🔗 RECURSOS ÚTILES

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Documentación Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Documentación Vercel](https://vercel.com/docs)
