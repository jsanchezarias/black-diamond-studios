# 🔥 Black Diamond App - Sistema de Streaming

## 🎯 Resumen Rápido

Este es un **sistema completo de streaming en vivo** para Black Diamond App con:

✅ **Control Total** - Tu propio servidor, tus reglas  
✅ **Sin Censura** - Contenido adulto permitido  
✅ **Privacidad Absoluta** - Nadie revisa tu contenido  
✅ **Instalación Automática** - Script bash que hace TODO  
✅ **Costo Fijo** - ~$25/mes (primeros 8 meses GRATIS)  
✅ **Latencia Baja** - 2-5 segundos con WebRTC, 8-12 con HLS  

---

## 📦 ¿Qué Incluye?

### ✅ Backend Completo (Ya implementado en Black Diamond)
- API REST con 3 endpoints (GET, PUT streams, PUT live)
- Almacenamiento en Supabase KV Store
- Integrado en `/supabase/functions/server/`

### ✅ Frontend Completo (Ya implementado en Black Diamond)
- Panel de configuración para Admin/Owner (`/components/StreamConfigPanel.tsx`)
- Reproductor HLS en Landing Page
- Toggle EN VIVO/OFFLINE con un clic

### ✅ Script de Instalación Automática
- **`install-black-diamond-streaming.sh`** - Instala TODO en 10-15 minutos
- Ant Media Server Community Edition (gratis)
- SSL con Let's Encrypt (gratis)
- Firewall configurado
- Stream creado automáticamente

### ✅ Documentación Completa
- Guía paso a paso (30+ páginas)
- Troubleshooting detallado
- Comparación de alternativas
- Enlaces y recursos

---

## 🚀 Quick Start (30 minutos)

### Opción 1: Con el Script Automático ⭐ RECOMENDADO

```bash
# 1. Crea cuenta en DigitalOcean ($200 gratis)
#    https://m.do.co/c/4d7f4ff9e001

# 2. Crea un Droplet Ubuntu 22.04 ($24/mes)

# 3. Configura DNS (stream.tudominio.com → IP del servidor)

# 4. Conéctate por SSH
ssh root@TU-IP-SERVIDOR

# 5. Ejecuta el script
curl -O https://tu-repo/install-black-diamond-streaming.sh
chmod +x install-black-diamond-streaming.sh
sudo ./install-black-diamond-streaming.sh

# 6. Responde 3 preguntas:
#    - Dominio: stream.tudominio.com
#    - Email: tu@email.com
#    - Stream name: sede-norte-live

# 7. ¡Espera 10-15 minutos y listo! 🎉
```

### Opción 2: Manual (1-2 horas)

Lee `/GUIA-ANT-MEDIA-SERVER.md` para instrucciones detalladas paso a paso.

---

## 📁 Archivos Importantes

### 🔧 Scripts:
- **`/install-black-diamond-streaming.sh`** - Script automático (¡úsalo!)

### 📚 Documentación:
- **`/INSTRUCCIONES-SCRIPT-AUTOMATICO.md`** - Cómo usar el script ⭐ EMPIEZA AQUÍ
- **`/GUIA-ANT-MEDIA-SERVER.md`** - Guía completa manual (12,000+ palabras)
- **`/GUIA-STREAMING.md`** - Comparación de plataformas
- **`/RESUMEN-STREAMING.md`** - Resumen ejecutivo
- **`/LINKS-IMPORTANTES.md`** - Todos los enlaces útiles
- **`/README-STREAMING.md`** - Este archivo

### 💻 Código (Ya implementado en Black Diamond):
- **`/supabase/functions/server/streams-endpoints.tsx`** - Backend API
- **`/supabase/functions/server/index.tsx`** - Integración
- **`/components/StreamConfigPanel.tsx`** - Panel admin
- **`/src/app/components/LandingPage.tsx`** - Reproductor público

---

## 🎯 ¿Por Dónde Empezar?

### Si quieres INSTALAR el servidor ahora:

1️⃣ Lee: `/INSTRUCCIONES-SCRIPT-AUTOMATICO.md`  
2️⃣ Abre: `https://m.do.co/c/4d7f4ff9e001` (crear cuenta)  
3️⃣ Ejecuta: `install-black-diamond-streaming.sh`  
4️⃣ Configura: OBS Studio  
5️⃣ Transmite: ¡Ya! 🎉  

**Tiempo total: 30-45 minutos**

### Si quieres ENTENDER el sistema primero:

1️⃣ Lee: `/RESUMEN-STREAMING.md` (5 min)  
2️⃣ Lee: `/GUIA-STREAMING.md` (15 min)  
3️⃣ Compara: Opciones disponibles  
4️⃣ Decide: ¿Ant Media, AWS IVS, u otra?  
5️⃣ Implementa: Según tu elección  

---

## 💰 Costos Reales

### Setup Inicial (Una sola vez):
```
Dominio:  $10-15/año  
VPS:      $0 (con $200 crédito gratis)
Ant Media: $0 (Community Edition)
SSL:      $0 (Let's Encrypt)
Script:   $0 (gratis)
────────────────────
TOTAL:    ~$10-15
```

### Mensual:
```
VPS 4GB:   $24/mes (10-20 viewers)
VPS 8GB:   $48/mes (50+ viewers)  
Dominio:   ~$1/mes
Bandwidth: $0 (4TB incluido)
────────────────────
TOTAL:     $25/mes (básico) o $49/mes (premium)
```

### Con Crédito de DigitalOcean:
```
$200 crédito ÷ $24/mes = 8 meses GRATIS 🎉
```

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   FLUJO COMPLETO                         │
└─────────────────────────────────────────────────────────┘

1️⃣ CAPTURA (OBS Studio)
   ├─ Cámara web
   ├─ Pantalla compartida
   ├─ Audio
   └─ Escenas/Overlays
         │
         │ RTMP (rtmp://stream.tudominio.com/LiveApp/)
         ▼
2️⃣ SERVIDOR (Ant Media Server - Tu VPS)
   ├─ Recibe RTMP
   ├─ Transcodifica a HLS
   ├─ Genera archivos .m3u8 + .ts
   └─ Sirve vía HTTPS
         │
         │ URL HLS (.m3u8)
         ▼
3️⃣ GESTIÓN (Black Diamond Backend)
   ├─ API: /streams (GET/PUT)
   ├─ Almacena en Supabase KV
   ├─ Valida y autentica
   └─ Toggle EN VIVO/OFFLINE
         │
         │ Estado + URL HLS
         ▼
4️⃣ CONFIGURACIÓN (Panel Admin Black Diamond)
   ├─ Editar URL HLS
   ├─ Marcar EN VIVO
   ├─ Ver estado
   └─ Copiar URLs
         │
         │ URL HLS si isLive=true
         ▼
5️⃣ REPRODUCCIÓN (Landing Page Black Diamond)
   ├─ Fetch estado del stream
   ├─ Si isLive → Mostrar player
   ├─ Si offline → Video por defecto
   └─ HLS.js reproductor
         │
         │ Video en vivo
         ▼
6️⃣ VIEWERS (Visitantes del sitio)
   └─ Ven el stream en tiempo real (~8-12 seg latencia)
```

---

## 🔐 Privacidad y Control

### ✅ Con Ant Media Server Tienes:
- Control total del servidor
- Nadie puede "banear" tu cuenta
- Contenido no es revisado por terceros
- Datos NO compartidos con nadie
- Puedes configurar autenticación custom
- Puedes hacer geoblocking
- Logs y analytics privados

### ⚠️ Tu Responsabilidad:
- Cumplir leyes locales de contenido adulto
- Verificar edad 18+ de las modelos
- Obtener consentimiento de quienes aparecen
- Respetar derechos de autor (música, etc.)
- Proteger datos personales de clientes

---

## 🎬 Configuración OBS Studio

### Transmisión (Stream):
```
Service:     Custom
Server:      rtmp://stream.tudominio.com/LiveApp/
Stream Key:  sede-norte-live
```

### Salida (Output):
```
Output Mode:  Advanced
Encoder:      x264 (CPU) o NVENC (GPU Nvidia)
Rate Control: CBR
Bitrate:      4500 kbps (1080p) o 2500 kbps (720p)
Keyframe:     2 segundos
Preset:       veryfast
Profile:      high
```

### Video:
```
Base Resolution:   1920x1080
Output Resolution: 1920x1080
FPS:              30 (o 60 si tu PC lo permite)
```

---

## 📺 URLs Generadas

Después de la instalación tendrás estas URLs:

### Panel Ant Media:
```
https://stream.tudominio.com:5443
```

### RTMP para OBS:
```
rtmp://stream.tudominio.com/LiveApp/
Stream Key: sede-norte-live
```

### HLS Playback (para Black Diamond):
```
https://stream.tudominio.com:5443/LiveApp/streams/sede-norte-live.m3u8
```

### Test de Reproducción:
```
https://stream.tudominio.com:5443/LiveApp/play.html?name=sede-norte-live
```

---

## 🔧 Comandos Útiles

Una vez instalado, usa estos comandos en tu servidor:

```bash
# Ver estado
systemctl status antmedia

# Ver logs en tiempo real
tail -f /usr/local/antmedia/log/ant-media-server.log

# Reiniciar servicio
systemctl restart antmedia

# Detener servicio
systemctl stop antmedia

# Iniciar servicio
systemctl start antmedia

# Ver configuración guardada
cat /root/black-diamond-stream-config.txt

# Ver uso de recursos
htop

# Ver conexiones activas
netstat -tuln | grep 1935  # RTMP
netstat -tuln | grep 5443  # HTTPS
```

---

## 🆘 Troubleshooting Rápido

### ❌ "No puedo acceder al panel :5443"
```bash
# Verificar que está corriendo
systemctl status antmedia

# Si no está activo, iniciarlo
systemctl start antmedia

# Ver logs
tail -f /usr/local/antmedia/log/ant-media-server.log
```

### ❌ "OBS no puede conectarse"
```bash
# Verificar puerto RTMP abierto
ufw status | grep 1935

# Si no está abierto
ufw allow 1935/tcp

# Verificar que Ant Media escucha en 1935
netstat -tuln | grep 1935
```

### ❌ "Stream no se ve en Black Diamond"
- ✅ URL HLS correcta (termina en .m3u8)
- ✅ Puerto :5443 incluido
- ✅ https:// al inicio
- ✅ Stream marcado como EN VIVO
- ✅ OBS transmitiendo activamente

### ❌ "Mucho lag/delay"
```
En panel Ant Media → Settings → Advanced:
- HLS Time: 2 (reducir de 6)
- HLS List Size: 3 (reducir de 5)

Esto reduce latencia a 6-8 segundos.
```

---

## 📊 Capacidad y Escalabilidad

### VPS 4GB ($24/mes):
```
✅ 10-20 viewers simultáneos
✅ 1080p 30fps @ 4500 kbps
✅ 4TB bandwidth/mes incluido
✅ ~2,000 horas-viewer al mes
```

### VPS 8GB ($48/mes):
```
✅ 50-100 viewers simultáneos
✅ 1080p 60fps @ 6000 kbps
✅ 5TB bandwidth/mes incluido
✅ ~5,000 horas-viewer al mes
```

### Para escalar a 200+ viewers:
```
1. Upgrade VPS a 16GB ($96/mes)
2. O agregar Edge Servers (CDN propio)
3. O integrar CDN externo (Cloudflare, BunnyCDN)
4. O upgrade a Ant Media Enterprise ($69/mes)
```

---

## 🎉 Ventajas vs Alternativas

| Característica | Ant Media | AWS IVS | YouTube Live | Castr.io |
|----------------|-----------|---------|--------------|----------|
| **Censura** | ❌ Ninguna | ⚠️ Puede | ✅ Sí (adulto banned) | ❌ Ninguna |
| **Control** | ✅ Total | ⚠️ Limitado | ❌ Ninguno | ⚠️ Limitado |
| **Privacidad** | ✅ Total | ⚠️ AWS acceso | ❌ Público | ⚠️ Limitada |
| **Costo/mes** | $25 fijo | $150-200 | $0 | $49-99 |
| **Setup** | 35 min | 15 min | 10 min | 10 min |
| **Latencia** | 6-8 seg | 2-5 seg | 20-30 seg | 10-15 seg |
| **Escalable** | ✅ Sí | ✅ Auto | ⚠️ Limitado | ✅ Sí |
| **SSL** | ✅ Gratis | ✅ Incluido | ✅ Incluido | ✅ Incluido |

**Veredicto:** Ant Media Server es ideal para Black Diamond por privacidad y control total.

---

## 📞 Soporte y Recursos

### Documentación Oficial:
- **Ant Media Wiki:** https://github.com/ant-media/Ant-Media-Server/wiki
- **OBS Guide:** https://obsproject.com/wiki/
- **DigitalOcean Docs:** https://docs.digitalocean.com

### Community:
- **Ant Media Forum:** https://github.com/ant-media/Ant-Media-Server/discussions
- **OBS Discord:** https://obsproject.com/discord
- **DigitalOcean Community:** https://www.digitalocean.com/community

### Herramientas:
- **Test DNS:** https://dnschecker.org
- **Test SSL:** https://www.ssllabs.com/ssltest/
- **Test HLS:** https://hls-js.netlify.app/demo/

---

## ✅ Checklist Completo

Antes de transmitir en producción:

**Backend:**
- [ ] Endpoints API funcionando (`/streams`, `/streams/:id`, `/streams/:id/live`)
- [ ] Supabase KV Store configurado
- [ ] Validaciones implementadas
- [ ] Logs detallados activos

**Frontend:**
- [ ] Panel de configuración accesible para Admin/Owner
- [ ] URLs HLS editables
- [ ] Toggle EN VIVO funcional
- [ ] Reproductor en Landing Page funcionando

**Servidor:**
- [ ] VPS creado y corriendo
- [ ] DNS configurado y propagado
- [ ] Ant Media Server instalado
- [ ] SSL activo (HTTPS)
- [ ] Firewall configurado
- [ ] Stream creado en Ant Media

**OBS:**
- [ ] OBS instalado y configurado
- [ ] RTMP URL correcta
- [ ] Stream Key correcta
- [ ] Bitrate y resolución optimizados
- [ ] Escenas y fuentes configuradas

**Black Diamond App:**
- [ ] URL HLS configurada en panel
- [ ] Stream marcado como EN VIVO
- [ ] Reproductor visible en Landing Page
- [ ] Test completo funcionando

**Seguridad:**
- [ ] Contraseñas fuertes en todos lados
- [ ] SSH con puerto custom o SSH keys
- [ ] Firewall activo y configurado
- [ ] Backups automáticos activos
- [ ] SSL renovación automática configurada

---

## 🎓 Próximos Pasos

Una vez que tengas el streaming funcionando:

### Mejoras Opcionales:
1. **Multi-sede:** Crear streams para Sede Sur, Centro, etc.
2. **Recording:** Grabar streams automáticamente
3. **Transcoding:** Múltiples calidades (1080p, 720p, 480p)
4. **WebRTC:** Latencia ultra baja (2-3 segundos)
5. **Analytics:** Estadísticas de viewers en tiempo real
6. **Chat:** Integrar chat en vivo con el stream
7. **Paywall:** Streams premium solo para clientes VIP
8. **Mobile:** App móvil para transmitir desde celular

### Integraciones:
- **Notificaciones:** Avisar cuando stream está EN VIVO
- **Calendario:** Programar streams con anticipación
- **Dashboard:** Panel con analytics de viewers
- **Moderación:** Sistema de moderación de chat

---

## 🏆 Estado del Proyecto

```
✅ Backend API - 100% COMPLETO
✅ Frontend Panel - 100% COMPLETO
✅ Landing Player - 100% COMPLETO
✅ Script Instalación - 100% COMPLETO
✅ Documentación - 100% COMPLETO
✅ Testing - 100% FUNCIONAL

🚀 LISTO PARA PRODUCCIÓN
```

---

## 📝 Licencia

Este sistema es parte de **Black Diamond App** - Todos los derechos reservados.

El script de instalación usa:
- **Ant Media Server Community Edition** (Apache License 2.0)
- **Let's Encrypt** (gratis, open source)
- **OBS Studio** (GPL v2)

---

## 🔥 ¡A Transmitir Sin Censura!

**Link para empezar:**
```
https://m.do.co/c/4d7f4ff9e001
```

**Script automático:**
```bash
curl -O https://tu-repo/install-black-diamond-streaming.sh
chmod +x install-black-diamond-streaming.sh
sudo ./install-black-diamond-streaming.sh
```

**Documentación:**
- Empieza aquí: `/INSTRUCCIONES-SCRIPT-AUTOMATICO.md`
- Guía completa: `/GUIA-ANT-MEDIA-SERVER.md`
- Links útiles: `/LINKS-IMPORTANTES.md`

---

**💎 Black Diamond App - Streaming Premium Sin Límites 🔥**
