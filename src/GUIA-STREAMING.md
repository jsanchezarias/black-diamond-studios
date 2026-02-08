# 🎥 Guía de Configuración de Streaming - Sede Norte

## 📋 Resumen

El sistema de streaming de Black Diamond App está completamente funcional para la **Sede Norte**. Los administradores y owners pueden configurar transmisiones en vivo desde OBS Studio directamente desde sus paneles de control.

**⚠️ IMPORTANTE:** Esta guía incluye plataformas que permiten contenido adulto sin censura.

---

## 🚀 Cómo Funciona

### 1️⃣ **Acceso al Panel de Streams**

**Owner:**
1. Inicia sesión como Owner
2. En el menú lateral, haz clic en **"Streams"** (icono de video 🎥)
3. Verás el panel de configuración de Sede Norte

**Admin:**
1. Inicia sesión como Admin
2. En el menú lateral, haz clic en **"Streams"** (icono de video 🎥)
3. Verás el panel de configuración de Sede Norte

---

### 2️⃣ **Configuración del Servicio de Streaming**

Para transmitir desde OBS, necesitas un servicio que convierta tu señal RTMP a HLS (formato web). 

**🔞 Plataformas que PERMITEN contenido adulto sin censura:**

#### **Opción A: AWS IVS (Interactive Video Service) ⭐ RECOMENDADO**
- ✅ Sin restricciones de contenido
- ✅ Profesional y escalable (AWS)
- ✅ Latencia ultra baja (2-5 segundos)
- ✅ CDN global incluido
- 💰 Precio: ~$1.50 USD/hora de streaming + $0.015/GB de salida
- 📚 [Documentación oficial](https://aws.amazon.com/ivs/)

**Cómo configurar:**
```
1. Crea una cuenta en AWS: https://aws.amazon.com
2. Ve a AWS IVS Console: https://console.aws.amazon.com/ivs/
3. Crea un canal (Channel)
4. Copia la "Ingest Server" (RTMP URL) y "Stream Key"
5. Copia la "Playback URL" (HLS - termina en .m3u8)
```

#### **Opción B: Castr.io**
- ✅ Permite contenido adulto explícitamente
- ✅ Multistreaming a varias plataformas
- ✅ Interfaz muy fácil de usar
- ✅ Transcoding incluido
- 💰 Precio: Desde $49/mes plan Pro
- 📚 [Sitio oficial](https://castr.io)

**Cómo configurar:**
```
1. Regístrate en https://castr.io
2. Crea un nuevo stream
3. Copia RTMP Server y Stream Key
4. Copia la URL HLS del player
```

#### **Opción C: Self-Hosted con Ant Media Server 🔥 CONTROL TOTAL**
- ✅ 100% control y privacidad
- ✅ Sin restricciones de ningún tipo
- ✅ Open source (Community Edition gratis)
- ✅ Ultra baja latencia con WebRTC
- ⚠️ Requiere servidor propio (VPS)
- 💰 Precio: Gratis (Community) o desde $9/mes VPS + $69/mes (Enterprise)
- 📚 [Documentación](https://antmedia.io)

**Cómo configurar:**
```
1. Alquila un VPS (DigitalOcean, Linode, AWS EC2)
   - Mínimo: 2 CPU cores, 4GB RAM, Ubuntu 20.04
   
2. Instala Ant Media Server:
   wget https://raw.githubusercontent.com/ant-media/Scripts/master/install_ant-media-server.sh
   chmod +x install_ant-media-server.sh
   sudo ./install_ant-media-server.sh

3. Accede al panel: http://TU-IP-SERVIDOR:5080
4. Crea una aplicación/stream
5. RTMP URL: rtmp://TU-IP-SERVIDOR/LiveApp/
6. Stream Key: nombre-de-tu-stream
7. HLS URL: http://TU-IP-SERVIDOR:5080/LiveApp/streams/nombre-de-tu-stream.m3u8
```

#### **Opción D: Wowza Streaming Cloud**
- ✅ Neutral con contenido (no censura adulto)
- ✅ Muy profesional y confiable
- ✅ Transcoding y DVR incluido
- 💰 Precio: Desde $49/mes + $0.06/GB
- 📚 [Documentación](https://www.wowza.com/pricing/cloud)

#### **Opción E: Streamyard + Restream (con precaución)**
- ⚠️ Revisar términos de servicio
- ✅ Fácil de usar
- 💰 Desde $25/mes

#### **Opción F: Plataformas Adultas Especializadas**
Si quieres usar plataformas específicas de la industria adulta:

**Chaturbate API:**
- ✅ Permite streaming adulto
- ✅ Genera ingresos adicionales (tokens/propinas)
- ✅ Puede embeberse en tu sitio
- 💰 Gratis para modelos (comisión en ganancias)
- 📚 [Affiliate API](https://chaturbate.com/affiliates/)

**Stripchat API:**
- ✅ Similar a Chaturbate
- ✅ White label disponible
- 📚 [Webmaster Program](https://stripchat.com/webmasters)

**CAM4:**
- ✅ RTMP disponible
- ✅ Embebible
- 📚 [Broadcaster Info](https://www.cam4.com/become-a-broadcaster)

---

### ⭐ RECOMENDACIÓN PARA BLACK DIAMOND APP

Para tu caso específico, recomiendo **AWS IVS** o **Ant Media Server self-hosted**:

**AWS IVS** si quieres:
- ✅ Fácil de configurar (30 minutos)
- ✅ Infraestructura de AWS (super confiable)
- ✅ No preocuparte por servidores
- ✅ Escalabilidad automática
- 💰 Pagas solo lo que usas

**Ant Media Server** si quieres:
- ✅ Control total y privacidad absoluta
- ✅ Sin costos por GB (solo VPS fijo)
- ✅ Personalización completa
- ✅ Sin depender de terceros
- 💰 Más económico a largo plazo con mucho tráfico

---

## 📝 GUÍA RÁPIDA: AWS IVS (Más fácil)

### 1. Crear Cuenta AWS
```
1. Ve a https://aws.amazon.com
2. Click en "Create an AWS Account"
3. Completa el registro (necesitas tarjeta de crédito)
```

### 2. Configurar AWS IVS
```
1. Inicia sesión en AWS Console: https://console.aws.amazon.com
2. Busca "IVS" en la barra de búsqueda
3. Click en "Amazon IVS"
4. Click en "Create channel"
5. Nombre del canal: "BlackDiamond-SedeNorte"
6. Tipo: Standard (permite latencia baja)
7. Click "Create channel"
```

### 3. Obtener Credenciales
```
Verás 3 datos importantes:

📍 Ingest server (RTMP):
   rtmps://a1b2c3d4e5f6.global-contribute.live-video.net:443/app/

🔑 Stream key:
   sk_us-west-2_AbCdEfGhIjKl1234567890

📺 Playback URL (HLS):
   https://a1b2c3d4e5f6.us-west-2.playback.live-video.net/api/video/v1/us-west-2.123456789012.channel.AbCdEfGhIjKl.m3u8
```

### 4. Configurar OBS
```
OBS Studio → Configuración → Transmisión:
- Servicio: Custom (Personalizado)
- Servidor: rtmps://a1b2c3d4e5f6.global-contribute.live-video.net:443/app/
- Stream Key: sk_us-west-2_AbCdEfGhIjKl1234567890
```

### 5. Configurar Black Diamond App
```
1. Copia la Playback URL (la larga que termina en .m3u8)
2. Ve al Panel de Streams en Black Diamond
3. Pega en "Stream URL HLS"
4. Click "Marcar como En Vivo"
```

**¡LISTO! Stream sin censura funcionando! 🎉**

---

## 📝 GUÍA RÁPIDA: Ant Media Server (Más control)

### 1. Contratar VPS
```
DigitalOcean (recomendado):
1. https://www.digitalocean.com
2. Create Droplet → Ubuntu 20.04
3. Plan: $12/mes (2 vCPUs, 4GB RAM) - suficiente para empezar
4. Datacenter: Closest to your users
5. Create Droplet
6. Anota la IP del servidor: 123.45.67.89
```

### 2. Instalar Ant Media Server
```bash
# Conecta por SSH a tu VPS
ssh root@123.45.67.89

# Descarga e instala Ant Media (Community - gratis)
wget https://raw.githubusercontent.com/ant-media/Scripts/master/install_ant-media-server.sh
chmod +x install_ant-media-server.sh
sudo ./install_ant-media-server.sh

# Sigue las instrucciones en pantalla
# Cuando pregunte qué versión: Selecciona "Community Edition"
```

### 3. Acceder al Panel
```
1. Abre el navegador
2. Ve a: http://123.45.67.89:5080
3. Crea usuario admin (primera vez)
4. Inicia sesión
```

### 4. Crear Stream
```
1. En el panel, click "New Live Stream"
2. Stream Name: "sede-norte-live"
3. Type: Live Stream
4. Click "Create"

Credenciales RTMP:
- Server: rtmp://123.45.67.89/LiveApp/
- Stream Key: sede-norte-live

URL HLS:
- http://123.45.67.89:5080/LiveApp/streams/sede-norte-live.m3u8
```

### 5. Configurar SSL (HTTPS) - IMPORTANTE
```bash
# Para que funcione en navegadores modernos, necesitas SSL

# Instala certbot
sudo apt update
sudo apt install certbot

# Configura un dominio (ejemplo: stream.blackdiamond.com apuntando a tu IP)

# Obtén certificado SSL
sudo certbot certonly --standalone -d stream.blackdiamond.com

# Configura Ant Media para usar SSL (ver docs)
```

### 6. URL Final con SSL
```
RTMP: rtmp://stream.blackdiamond.com/LiveApp/
Stream Key: sede-norte-live
HLS: https://stream.blackdiamond.com:5443/LiveApp/streams/sede-norte-live.m3u8
```

---

## 🔒 Seguridad y Privacidad

### AWS IVS:
- ✅ Encriptación TLS/SSL por defecto
- ✅ Control de acceso con tokens (opcional)
- ✅ Logs detallados
- ⚠️ Amazon puede suspender cuenta si detecta contenido ilegal

### Ant Media Server Self-Hosted:
- ✅ Control total - nadie revisa tu contenido
- ✅ Puedes configurar geoblocking
- ✅ Puedes agregar autenticación custom
- ✅ HTTPS con Let's Encrypt gratis
- ⚠️ Tú eres responsable de la seguridad del servidor

---

## 💰 Comparación de Costos (uso estimado: 100 horas/mes)

| Plataforma | Costo Mensual | Pros | Contras |
|------------|---------------|------|---------|
| **AWS IVS** | ~$150-200 | Fácil, escalable, confiable | Pago por uso (puede subir) |
| **Ant Media Server** | ~$12-50 (VPS) | Control total, costo fijo | Requiere mantenimiento |
| **Castr.io** | $49-99 | Muy fácil, sin setup | Límites de ancho de banda |
| **Wowza Cloud** | $100-150 | Profesional, features | Más caro |

**Recomendación para empezar:** AWS IVS (fácil) o Ant Media en VPS de $12/mes (económico)

---

## ⚠️ NOTAS LEGALES IMPORTANTES

1. **Asegúrate de cumplir con las leyes locales** sobre contenido adulto
2. **Verifica la edad de las modelos** (18+ siempre)
3. **Términos de servicio:** Lee siempre los TOS de la plataforma
4. **Privacidad:** Informa a las modelos que serán transmitidas
5. **Derechos de autor:** No uses música con copyright sin licencia
6. **DMCA:** Configura un proceso de takedown si alguien reporta contenido

---

## 🆘 Soporte

Para AWS IVS:
- [Documentación AWS IVS](https://docs.aws.amazon.com/ivs/)
- [Foro AWS](https://repost.aws/tags/TA4sDwtSVHQbyrCwuLfiLqtQ/amazon-interactive-video-service)

Para Ant Media Server:
- [Documentación oficial](https://github.com/ant-media/Ant-Media-Server/wiki)
- [Foro comunitario](https://github.com/ant-media/Ant-Media-Server/discussions)
- [YouTube tutorials](https://www.youtube.com/c/AntMediaServer)

---

**¡Black Diamond App - Streaming Profesional Sin Censura! 🎥💎**