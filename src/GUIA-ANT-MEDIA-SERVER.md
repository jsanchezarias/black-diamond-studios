# 🔥 Guía Completa: Ant Media Server para Black Diamond App

## 🎯 ¿Por qué Ant Media Server?

✅ **100% Control Total** - Tu servidor, tus reglas  
✅ **Privacidad Absoluta** - Nadie revisa tu contenido  
✅ **Sin Censura** - No hay términos de servicio que te limiten  
✅ **Open Source** - Community Edition completamente gratis  
✅ **Latencia Ultra Baja** - 2-5 segundos con WebRTC, 8-12 con HLS  
✅ **Costo Fijo** - Solo pagas el VPS (~$12-24/mes)  
✅ **Escalable** - Puedes agregar más servidores después  

---

## 📋 Requisitos Previos

Antes de empezar, necesitas:

1. **Dominio propio** (obligatorio para SSL/HTTPS)
   - Ejemplo: `stream.blackdiamond.com`
   - Puedes comprarlo en Namecheap, GoDaddy, etc. (~$10-15/año)

2. **Tarjeta de crédito/débito** para el VPS

3. **30-60 minutos de tiempo**

4. **Conocimientos básicos de terminal** (te guiaré paso a paso)

---

## 🚀 PASO 1: Contratar VPS

### Opción A: DigitalOcean (Recomendado) 💙

**¿Por qué DigitalOcean?**
- ✅ Interfaz muy fácil
- ✅ $200 USD de crédito gratis para nuevos usuarios
- ✅ Datacenter en múltiples países
- ✅ Soporte excelente

**Proceso:**

1. **Crea cuenta en DigitalOcean:**
   - Ve a: https://www.digitalocean.com
   - Click en "Sign Up"
   - Usa tu email de Gmail/GitHub
   - **IMPORTANTE:** Usa este link para $200 gratis: https://m.do.co/c/4d7f4ff9e001

2. **Verifica tu cuenta:**
   - Agrega tu tarjeta de crédito
   - No se cobrará nada inmediatamente
   - Recibes $200 de crédito por 60 días

3. **Crea un Droplet (servidor):**
   ```
   Dashboard → Create → Droplets
   
   📍 Choose Region:
   - Si tu audiencia está en Latinoamérica: "Toronto" o "New York"
   - Si está en Colombia específicamente: "New York 3"
   
   🖥️ Choose an image:
   - Ubuntu 22.04 (LTS) x64
   
   💪 Choose Size:
   - BASIC PLAN
   - Regular - $24/mes (4GB RAM, 2 vCPUs) ⭐ RECOMENDADO PARA EMPEZAR
     * Soporta 10-20 viewers simultáneos
   - Premium - $48/mes (8GB RAM, 4 vCPUs) - Para 50+ viewers
   
   🔐 Authentication:
   - SSH Key (más seguro) o Password (más fácil)
   - Si eliges Password, usa una contraseña FUERTE
   
   📝 Hostname:
   - stream-blackdiamond
   
   Click "Create Droplet"
   ```

4. **Espera 60 segundos** mientras se crea tu servidor

5. **Anota tu IP:**
   - Verás algo como: `159.89.123.45`
   - Copia esta IP, la usaremos mucho

---

### Opción B: Linode/Akamai

```
1. https://www.linode.com
2. Sign Up
3. Create Linode
4. Ubuntu 22.04 LTS
5. Shared CPU → $24/mes (4GB RAM)
6. Region: Closer to your users
7. Create Linode
```

---

### Opción C: Vultr

```
1. https://www.vultr.com
2. Sign Up  
3. Deploy New Server
4. Cloud Compute - Shared CPU
5. Ubuntu 22.04 x64
6. $18/mes (4GB RAM)
7. Deploy Now
```

---

## 🔧 PASO 2: Configurar Dominio

**IMPORTANTE:** Ant Media NECESITA un dominio con SSL/HTTPS para funcionar en navegadores modernos.

### 1. Configurar DNS

Si tu dominio es `blackdiamond.com`, vas a crear un subdominio:

**En tu proveedor de DNS (Namecheap, GoDaddy, Cloudflare, etc.):**

```
Tipo: A
Nombre: stream
Valor: 159.89.123.45  (tu IP del VPS)
TTL: 300 (5 minutos)
```

**Resultado:** `stream.blackdiamond.com` apunta a tu servidor

**Verificar que funciona:**
```bash
# En tu PC/Mac, abre terminal y escribe:
ping stream.blackdiamond.com

# Deberías ver respuestas con tu IP
```

⏰ **Espera 5-10 minutos** para que el DNS se propague globalmente

---

## 💻 PASO 3: Conectarse al Servidor

### En Windows:

**Opción 1: PowerShell (Recomendado)**
```powershell
# Abre PowerShell (busca "PowerShell" en el menú inicio)
ssh root@159.89.123.45
# Escribe tu password cuando te lo pida
```

**Opción 2: PuTTY**
```
1. Descarga PuTTY: https://www.putty.org
2. Host Name: 159.89.123.45
3. Port: 22
4. Click "Open"
5. Username: root
6. Password: tu-password
```

### En Mac/Linux:

```bash
# Abre Terminal
ssh root@159.89.123.45
# Escribe tu password
```

**Primera vez conectando:**
```
The authenticity of host '159.89.123.45' can't be established.
Are you sure you want to continue connecting? YES

# Escribe: yes
```

✅ **Ahora estás dentro de tu servidor!** Verás algo como:
```
root@stream-blackdiamond:~#
```

---

## 🎬 PASO 4: Instalar Ant Media Server

**Copia y pega estos comandos uno por uno:**

### 1. Actualizar el sistema
```bash
apt update && apt upgrade -y
```
⏰ Toma 2-3 minutos

### 2. Descargar el instalador
```bash
wget https://raw.githubusercontent.com/ant-media/Scripts/master/install_ant-media-server.sh
```

### 3. Dar permisos de ejecución
```bash
chmod +x install_ant-media-server.sh
```

### 4. Ejecutar instalador
```bash
sudo ./install_ant-media-server.sh
```

### 5. Proceso de instalación

Te preguntará varias cosas:

**❓ "Choose Ant Media Server Edition"**
```
1. Community Edition (FREE)
2. Enterprise Edition (Paid)

Escribe: 1
```

**❓ "Enter your domain name"**
```
Escribe: stream.blackdiamond.com
```

**❓ "Install SSL Certificate? (y/n)"**
```
Escribe: y
```

**❓ "Enter your email for SSL certificate"**
```
Escribe: tu@email.com
```

**El instalador hará:**
- ✅ Instalar Java
- ✅ Descargar Ant Media Server
- ✅ Configurar servicios
- ✅ Instalar certificado SSL de Let's Encrypt
- ✅ Configurar firewall

⏰ **Toma 5-10 minutos**

### 6. Verificar instalación

Al final verás:
```
✅ Ant Media Server installation completed!

Access your server at:
https://stream.blackdiamond.com:5443

Default credentials:
Username: admin
Password: [se genera automáticamente]
```

**IMPORTANTE:** Anota el password que te muestra

---

## 🌐 PASO 5: Acceder al Panel de Administración

1. **Abre tu navegador**

2. **Ve a:** `https://stream.blackdiamond.com:5443`
   - ⚠️ Nota el puerto `:5443` (HTTPS)

3. **Primera vez:**
   - Te pedirá crear usuario admin
   - Username: `admin`
   - Password: Elige uno fuerte (guárdalo en un lugar seguro)
   - Email: tu@email.com

4. **Login**
   - Ingresa tus credenciales
   - ✅ ¡Estás dentro!

---

## 🎥 PASO 6: Crear tu Stream

### En el Panel de Ant Media:

1. **Ve a "Applications" en el menú izquierdo**
   - Verás "LiveApp" (aplicación por defecto)
   - Click en "LiveApp"

2. **Click en "New Live Stream"**

3. **Configuración del Stream:**
   ```
   Name: sede-norte-live
   Type: Live Stream
   Public: Yes (para que sea accesible)
   ```

4. **Click "Create"**

5. **Anota las URLs generadas:**

   **RTMP Ingest URL (para OBS):**
   ```
   rtmp://stream.blackdiamond.com/LiveApp/
   ```
   
   **Stream Key:**
   ```
   sede-norte-live
   ```
   
   **HLS Playback URL (para tu web):**
   ```
   https://stream.blackdiamond.com:5443/LiveApp/streams/sede-norte-live.m3u8
   ```

---

## 🎬 PASO 7: Configurar OBS Studio

### 1. Descargar OBS
- https://obsproject.com
- Instala la versión para tu sistema operativo

### 2. Configurar Stream en OBS

**Abrir configuración:**
```
OBS → Configuración (Settings) → Stream (Transmisión)
```

**Configurar servidor:**
```
Service (Servicio): Custom (Personalizado)

Server: rtmp://stream.blackdiamond.com/LiveApp/

Stream Key: sede-norte-live
```

**Click "Apply" → "OK"**

### 3. Configurar Calidad de Video

```
OBS → Settings → Output

Output Mode: Advanced

🎬 Streaming Tab:
  Encoder: x264 (o NVENC si tienes GPU Nvidia)
  
  Rate Control: CBR
  
  Bitrate: 
    - 720p: 2500 kbps
    - 1080p: 4500 kbps ⭐ RECOMENDADO
    
  Keyframe Interval: 2
  
  Preset: veryfast
  
  Profile: high
```

**Settings → Video:**
```
Base Resolution: 1920x1080
Output Resolution: 1920x1080
FPS: 30 (o 60 si tu PC es potente)
```

**Click "Apply" → "OK"**

### 4. Crear tu Escena

```
Sources (Fuentes):
+ Video Capture Device (Cámara web)
+ Display Capture (Pantalla completa)
+ Window Capture (Una ventana específica)
+ Image (Logo, marca de agua)
+ Text (Texto superpuesto)
```

### 5. ¡A Transmitir!

```
Click en "Start Streaming" (Iniciar transmisión)
```

**Verificar en Ant Media:**
- Ve al panel de Ant Media
- En "Live Streams" verás "sede-norte-live" con badge 🔴 LIVE
- Click en "Play" para previsualizar

---

## 🌐 PASO 8: Configurar Black Diamond App

### 1. Login como Admin u Owner

### 2. Ve a "Streams" en el menú lateral

### 3. Encuentra la tarjeta "Sede Norte"

### 4. Configurar URLs:

**RTMP Server (informativo):**
```
rtmp://stream.blackdiamond.com/LiveApp/
```

**Stream Key (informativo):**
```
sede-norte-live
```

**Stream URL HLS (IMPORTANTE - esta es la que se usa):**
```
https://stream.blackdiamond.com:5443/LiveApp/streams/sede-norte-live.m3u8
```

### 5. Guardar y activar:

- Click ✓ Guardar en cada campo
- Click 🟢 **"Marcar como En Vivo"**

### 6. ¡Verificar en la Landing Page!

- Abre la landing page de Black Diamond
- Deberías ver tu stream transmitiéndose en vivo! 🎉

---

## 🔒 PASO 9: Seguridad Adicional (Opcional pero Recomendado)

### 1. Cambiar Puerto SSH (Evitar bots)

```bash
nano /etc/ssh/sshd_config
```

Busca la línea:
```
#Port 22
```

Cámbiala a:
```
Port 2222
```

Reinicia SSH:
```bash
systemctl restart ssh
```

**Ahora conectas con:**
```bash
ssh root@stream.blackdiamond.com -p 2222
```

### 2. Configurar Firewall

```bash
# Instalar UFW
apt install ufw -y

# Permitir puertos necesarios
ufw allow 2222/tcp    # SSH (tu nuevo puerto)
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 5443/tcp    # Ant Media HTTPS
ufw allow 1935/tcp    # RTMP
ufw allow 5080/tcp    # Ant Media HTTP

# Activar firewall
ufw enable

# Verificar estado
ufw status
```

### 3. Agregar Autenticación a Streams (Opcional)

**En Ant Media Panel:**
```
Settings → Security
- Enable One-Time Token: Yes
```

Esto requiere tokens para ver streams (más seguro)

### 4. Configurar Backups Automáticos

**En DigitalOcean:**
```
Droplet → Backups → Enable Backups
Costo: +20% del precio del droplet
```

---

## 📊 PASO 10: Monitoreo y Optimización

### Ver Logs en Tiempo Real

```bash
# Logs de Ant Media
tail -f /usr/local/antmedia/log/ant-media-server.log

# Ver recursos del sistema
htop

# Ver uso de ancho de banda
iftop
```

### Dashboard de Ant Media

**Panel → Dashboard te muestra:**
- 👥 Viewers actuales
- 📊 Bitrate
- 🎬 Streams activos
- 💾 Uso de CPU/RAM
- 🌐 Ancho de banda consumido

### Optimización de Rendimiento

**Si tienes lag o cortes:**

1. **Reducir resolución en OBS:**
   - De 1080p a 720p
   - De 60fps a 30fps

2. **Reducir bitrate:**
   - De 4500 kbps a 2500 kbps

3. **Cambiar preset en OBS:**
   - De "veryfast" a "faster" o "fast"

4. **Verificar internet:**
   - Upload mínimo: 5 Mbps
   - Recomendado: 10+ Mbps

---

## 🎯 URLs Finales de Referencia

**Panel de Administración Ant Media:**
```
https://stream.blackdiamond.com:5443
```

**RTMP Ingest (OBS):**
```
Server: rtmp://stream.blackdiamond.com/LiveApp/
Stream Key: sede-norte-live
```

**HLS Playback (Black Diamond App):**
```
https://stream.blackdiamond.com:5443/LiveApp/streams/sede-norte-live.m3u8
```

**Verificar Stream (Navegador):**
```
https://stream.blackdiamond.com:5443/LiveApp/play.html?name=sede-norte-live
```

---

## 🆘 Solución de Problemas

### ❌ "No puedo acceder al panel en :5443"

**Solución:**
```bash
# Verificar que Ant Media está corriendo
systemctl status antmedia

# Si no está activo, iniciarlo
systemctl start antmedia

# Ver logs
tail -f /usr/local/antmedia/log/ant-media-server.log
```

### ❌ "OBS no puede conectarse al servidor RTMP"

**Checklist:**
- ✅ URL correcta: `rtmp://stream.blackdiamond.com/LiveApp/`
- ✅ Stream Key correcta: `sede-norte-live`
- ✅ Puerto 1935 abierto en firewall
- ✅ Ant Media corriendo: `systemctl status antmedia`

**Test manual:**
```bash
# Verificar que el puerto RTMP está escuchando
netstat -tuln | grep 1935
```

### ❌ "El stream no se ve en Black Diamond App"

**Checklist:**
- ✅ URL HLS correcta (termina en `.m3u8`)
- ✅ Incluye el puerto `:5443`
- ✅ Incluye `https://` al inicio
- ✅ Stream está marcado como "EN VIVO" en el panel
- ✅ OBS está transmitiendo activamente

**Test manual:**
```bash
# Verificar que el stream está generando HLS
ls -la /usr/local/antmedia/webapps/LiveApp/streams/sede-norte-live*
```

### ❌ "Error SSL/HTTPS certificate"

**Renovar certificado:**
```bash
# Let's Encrypt se renueva automáticamente, pero si falla:
certbot renew

# Reiniciar Ant Media
systemctl restart antmedia
```

### ❌ "El stream tiene mucho delay"

**Solución:**
```
Panel de Ant Media → Settings → Advanced

HLS Time: 2 (default 6)
HLS List Size: 3 (default 5)

Esto reduce latency de ~20s a ~6-8s
```

**Para latency ultra baja (2-3s):**
- Usa WebRTC en lugar de HLS
- Requiere cambios en el frontend (más complejo)

### ❌ "Me quedé sin espacio en disco"

**Ver uso:**
```bash
df -h
```

**Limpiar logs viejos:**
```bash
# Limpiar logs de Ant Media mayores a 7 días
find /usr/local/antmedia/log/ -name "*.log" -mtime +7 -delete

# Limpiar streams grabados (si habilitaste recording)
rm -rf /usr/local/antmedia/webapps/LiveApp/streams/*.mp4
```

---

## 💰 Costos Reales

### Desglose Mensual:

**VPS DigitalOcean:**
- 4GB RAM: $24/mes ⭐
- 8GB RAM: $48/mes (para 50+ viewers)

**Dominio:**
- $10-15/año = ~$1/mes

**SSL Certificate:**
- $0 (Let's Encrypt gratis)

**Ant Media Community:**
- $0 (gratis)

**Ancho de banda:**
- DigitalOcean incluye 4TB/mes gratis
- Si excedes: $0.01/GB adicional

**TOTAL: ~$25/mes** 🎉

### ¿Cuánto tráfico es 4TB?

**Ejemplo con stream 1080p @ 4500 kbps:**
- 1 viewer por 1 hora = ~2GB
- 4TB = 2,000 horas-viewer
- = 66 horas con 30 viewers simultáneos
- = 133 horas con 15 viewers simultáneos

**Para la mayoría de boutiques, 4TB es MÁS que suficiente.**

---

## 📈 Escalabilidad Futura

### Cuando crezcas, puedes:

1. **Upgrade del VPS** ($48/mes para 50+ viewers)

2. **Agregar Edge Servers** (CDN propio)
   - Servidor origen: $48/mes
   - 2-3 edge servers: $12/mes c/u
   - Total: ~$80/mes para 200+ viewers globales

3. **Ant Media Enterprise** ($69/mes)
   - Cluster de servidores
   - WebRTC ultra baja latencia
   - Recording automático
   - Transcoding adaptativo

4. **Integrar CDN externo**
   - Cloudflare (gratis o $20/mes)
   - BunnyCDN ($0.01/GB)

---

## 🎉 ¡Checklist Final!

Marca cuando completes cada paso:

- [ ] VPS contratado en DigitalOcean/Linode/Vultr
- [ ] DNS configurado (stream.blackdiamond.com → IP del VPS)
- [ ] Conectado por SSH al servidor
- [ ] Ant Media Server instalado exitosamente
- [ ] Certificado SSL activo
- [ ] Panel de Ant Media accesible en :5443
- [ ] Stream "sede-norte-live" creado
- [ ] OBS descargado e instalado
- [ ] OBS configurado con RTMP URL y Stream Key
- [ ] Test de transmisión exitoso en OBS
- [ ] URL HLS configurada en Black Diamond App panel
- [ ] Stream marcado como "EN VIVO" en Black Diamond
- [ ] Stream visible en Landing Page de Black Diamond
- [ ] Firewall configurado (opcional)
- [ ] Backups habilitados (opcional)

---

## 📚 Recursos Adicionales

**Documentación Oficial:**
- https://github.com/ant-media/Ant-Media-Server/wiki

**Community Forum:**
- https://github.com/ant-media/Ant-Media-Server/discussions

**YouTube Tutorials:**
- https://www.youtube.com/c/AntMediaServer

**OBS Studio Guide:**
- https://obsproject.com/wiki/

---

## 🔐 IMPORTANTE: Privacidad y Legalidad

✅ **Con Ant Media self-hosted:**
- Tienes control total del contenido
- No hay moderación de terceros
- Nadie puede "banear" tu cuenta
- Tus datos NO se comparten con nadie

⚠️ **TU responsabilidad:**
- Cumplir con leyes locales
- Verificar edad 18+ de modelos
- Tener consentimiento de quienes aparecen
- Respetar derechos de autor (música, etc.)
- Proteger datos personales de clientes

---

**🔥 ¡Black Diamond con Ant Media Server - Control Total! 💎**

*¿Dudas? Te ayudo en cada paso. Let's go! 🚀*
