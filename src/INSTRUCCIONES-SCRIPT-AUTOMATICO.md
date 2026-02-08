# 🚀 Instrucciones: Script Automático de Instalación

## 📦 ¿Qué hace este script?

El script **`install-black-diamond-streaming.sh`** automatiza **TODA** la instalación:

✅ Actualiza el sistema operativo  
✅ Instala Ant Media Server Community Edition  
✅ Configura certificado SSL (Let's Encrypt)  
✅ Configura el firewall  
✅ Crea el stream "sede-norte-live"  
✅ Optimiza para baja latencia  
✅ Te da todas las URLs listas para usar  

**Tiempo total: 10-15 minutos** ⏱️

---

## 🔗 PASO 1: Crear Cuenta en DigitalOcean

### Con $200 USD de crédito gratis:
```
https://m.do.co/c/4d7f4ff9e001
```

### O directo (sin crédito):
```
https://www.digitalocean.com
```

**Proceso:**
1. Click "Sign Up"
2. Usa tu email o Google/GitHub
3. Verifica tu email
4. Agrega tarjeta de crédito (no se cobra nada todavía)
5. ✅ Cuenta lista

---

## 💻 PASO 2: Crear tu VPS (Droplet)

1. **Dashboard → Click "Create" → "Droplets"**

2. **Choose Region:**
   ```
   🌎 Para LATAM: New York 3 o Toronto
   🇺🇸 Para USA: New York 3
   🇪🇺 Para Europa: Amsterdam o Frankfurt
   ```

3. **Choose an Image:**
   ```
   Ubuntu 22.04 (LTS) x64  ← IMPORTANTE: debe ser esta versión
   ```

4. **Choose Size:**
   ```
   ⭐ RECOMENDADO:
   
   BASIC PLAN → Regular
   
   💎 $24/mes
   - 4 GB RAM
   - 2 vCPUs  
   - 80 GB SSD
   - 4 TB Transfer
   
   (Suficiente para 10-20 viewers simultáneos)
   
   ---
   
   Si esperas MÁS tráfico:
   
   💎 $48/mes
   - 8 GB RAM
   - 4 vCPUs
   - 160 GB SSD
   - 5 TB Transfer
   
   (Suficiente para 50+ viewers)
   ```

5. **Authentication:**
   ```
   Opción 1 (MÁS FÁCIL): Password
   - Elige una contraseña FUERTE
   - Anótala en un lugar seguro
   
   Opción 2 (MÁS SEGURA): SSH Key
   - Si sabes cómo usar SSH keys
   ```

6. **Hostname:**
   ```
   black-diamond-stream
   ```

7. **Tags (opcional):**
   ```
   streaming, black-diamond, production
   ```

8. **Click "Create Droplet"**

9. **Espera 60 segundos** mientras se crea

10. **ANOTA LA IP DEL SERVIDOR:**
    ```
    Verás algo como: 159.203.45.67
    
    ⚠️ IMPORTANTE: Guarda esta IP
    ```

---

## 🌐 PASO 3: Configurar DNS (Tu Dominio)

**Necesitas un dominio apuntando a tu servidor.**

### Si AÚN NO tienes dominio:

**Comprar en Namecheap (Recomendado):**
```
https://www.namecheap.com
```

1. Busca un dominio disponible (ej: `mistream.com`)
2. Cómpralo (~$10-15/año)
3. Ve a tu dashboard de dominios

### Configurar DNS (en tu proveedor de dominio):

**Ejemplo: Si tu dominio es `blackdiamond.com`**

1. Ve a DNS Management / DNS Settings
2. Agrega un registro **A**:
   ```
   Tipo:   A
   Nombre: stream
   Valor:  159.203.45.67  (tu IP del VPS)
   TTL:    300 (5 minutos) o Automatic
   ```

3. **Resultado:** `stream.blackdiamond.com` → Tu servidor

### Verificar DNS (espera 5-10 minutos):

**En tu PC/Mac, abre terminal:**
```bash
ping stream.blackdiamond.com
```

**Deberías ver tu IP del VPS en la respuesta:**
```
PING stream.blackdiamond.com (159.203.45.67): 56 data bytes
64 bytes from 159.203.45.67: icmp_seq=0 ttl=54 time=45.2 ms
```

✅ Si ves tu IP → DNS configurado correctamente

---

## 🔌 PASO 4: Conectarse al Servidor

### En Windows:

**Opción A: PowerShell (Built-in)**
```powershell
# Abre PowerShell (Win + R → escribe "powershell")
ssh root@159.203.45.67
```

**Opción B: PuTTY**
```
1. Descarga: https://www.putty.org
2. Host Name: 159.203.45.67
3. Port: 22
4. Click "Open"
5. Username: root
6. Password: (tu password del Droplet)
```

### En Mac/Linux:

```bash
# Abre Terminal
ssh root@159.203.45.67
```

**Primera vez conectando:**
```
The authenticity of host '159.203.45.67' can't be established.
Are you sure you want to continue connecting? (yes/no/[fingerprint])

# Escribe: yes
```

**Ingresa tu password**

✅ **¡Estás dentro del servidor!**

Verás algo como:
```
root@black-diamond-stream:~#
```

---

## 🔥 PASO 5: Ejecutar el Script Automático

### Método 1: Descarga directa desde GitHub (cuando lo subas)

```bash
# Descargar el script
curl -O https://raw.githubusercontent.com/TU-USUARIO/TU-REPO/main/install-black-diamond-streaming.sh

# Dar permisos de ejecución
chmod +x install-black-diamond-streaming.sh

# Ejecutar
sudo ./install-black-diamond-streaming.sh
```

### Método 2: Copiar y pegar el contenido

**A) En tu PC, abre el archivo:**
```
/install-black-diamond-streaming.sh
```

**B) Copia TODO el contenido (Ctrl+A, Ctrl+C)**

**C) En tu servidor, crea el archivo:**
```bash
nano install-black-diamond-streaming.sh
```

**D) Pega el contenido completo (Click derecho → Paste)**

**E) Guarda el archivo:**
```
Ctrl + O  (guardar)
Enter     (confirmar)
Ctrl + X  (salir)
```

**F) Da permisos y ejecuta:**
```bash
chmod +x install-black-diamond-streaming.sh
sudo ./install-black-diamond-streaming.sh
```

---

## 📝 PASO 6: Responder las Preguntas del Script

El script te hará 3 preguntas:

### 1️⃣ **Dominio:**
```
🌐 Ingresa tu dominio (ej: stream.blackdiamond.com): 
```
**Respuesta:** `stream.blackdiamond.com` (el que configuraste en DNS)

### 2️⃣ **Email:**
```
📧 Ingresa tu email (para certificado SSL): 
```
**Respuesta:** `tu@email.com` (para Let's Encrypt)

### 3️⃣ **Nombre del Stream:**
```
🎬 Nombre del stream (default: sede-norte-live): 
```
**Respuesta:** Presiona `Enter` (usa el default) o escribe otro nombre

### 4️⃣ **Confirmar:**
```
¿Continuar con la instalación? (S/n):
```
**Respuesta:** `S` + Enter

---

## ⏳ PASO 7: Esperar a que Termine

El script hará TODO automáticamente:

```
▶ 1/8 Actualizando sistema operativo...
✅ Sistema actualizado

▶ 2/8 Instalando dependencias...
✅ Dependencias instaladas

▶ 3/8 Descargando Ant Media Server...
✅ Instalador descargado

▶ 4/8 Instalando Ant Media Server (5-10 minutos)...
✅ Ant Media Server instalado y corriendo

▶ 5/8 Configurando certificado SSL...
✅ Certificado SSL obtenido
✅ SSL configurado en Ant Media

▶ 6/8 Configurando firewall...
✅ Firewall configurado

▶ 7/8 Creando stream 'sede-norte-live'...
✅ Stream creado exitosamente

▶ 8/8 Optimizando configuración...
✅ Optimización completada

╔════════════════════════════════════════════════╗
║  ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE! 🎉   ║
╚════════════════════════════════════════════════╝
```

**Tiempo total: 10-15 minutos** ⏱️

---

## 📋 PASO 8: Copiar la Información

Al final, el script te mostrará TODA la información importante:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMACIÓN IMPORTANTE - GUARDA ESTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 PANEL DE ADMINISTRACIÓN ANT MEDIA:
   https://stream.blackdiamond.com:5443

🎬 CONFIGURACIÓN PARA OBS STUDIO:
   Servicio:    Custom (Personalizado)
   Servidor:    rtmp://stream.blackdiamond.com/LiveApp/
   Stream Key:  sede-norte-live

📺 URL HLS PARA BLACK DIAMOND APP:
   https://stream.blackdiamond.com:5443/LiveApp/streams/sede-norte-live.m3u8

🔍 VERIFICAR STREAM (en navegador):
   https://stream.blackdiamond.com:5443/LiveApp/play.html?name=sede-norte-live
```

**💾 IMPORTANTE:** Esta info también se guarda en:
```
/root/black-diamond-stream-config.txt
```

Puedes verla en cualquier momento con:
```bash
cat /root/black-diamond-stream-config.txt
```

---

## 🎬 PASO 9: Configurar OBS Studio

### 1. Descargar OBS
```
https://obsproject.com
```

### 2. Abrir OBS → Settings (Configuración)

### 3. Stream (Transmisión):
```
Service:     Custom
Server:      rtmp://stream.blackdiamond.com/LiveApp/
Stream Key:  sede-norte-live
```

### 4. Output (Salida):
```
Output Mode:  Advanced
Encoder:      x264 (o NVENC si tienes GPU Nvidia)
Rate Control: CBR
Bitrate:      4500 (para 1080p) o 2500 (para 720p)
Keyframe:     2
Preset:       veryfast
```

### 5. Video:
```
Base Resolution:   1920x1080
Output Resolution: 1920x1080
FPS: 30
```

### 6. Click "Apply" → "OK"

### 7. Crear tu escena con fuentes (cámara, etc.)

### 8. Click "Start Streaming" ▶️

---

## 💎 PASO 10: Configurar Black Diamond App

### 1. Login como Admin u Owner

### 2. Menú → "Streams"

### 3. Encuentra la tarjeta "Sede Norte"

### 4. Pega la URL HLS:
```
https://stream.blackdiamond.com:5443/LiveApp/streams/sede-norte-live.m3u8
```

### 5. Click ✓ Guardar

### 6. Click 🟢 "Marcar como En Vivo"

---

## ✅ PASO 11: Verificar que Funciona

### 1. Abre la Landing Page de Black Diamond

### 2. Busca la sección de Stream

### 3. ¡Deberías ver tu transmisión en vivo! 🎉

---

## 🔧 Comandos Útiles

Una vez instalado, puedes usar estos comandos:

```bash
# Ver estado del servicio
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
```

---

## 🆘 Solución de Problemas

### ❌ "No puedo conectarme por SSH"

**Solución:**
```bash
# Verificar que el servidor está encendido en DigitalOcean
# Verificar la IP correcta
# Verificar el password
```

### ❌ "El DNS no resuelve"

**Solución:**
```
- Espera 10-15 minutos más
- Verifica el registro A en tu proveedor DNS
- Usa https://dnschecker.org para verificar propagación
```

### ❌ "Error al instalar Ant Media"

**Solución:**
```bash
# Ver logs de instalación
cat /tmp/antmedia_install.log

# Reintentar manualmente
cd /tmp
./install_ant-media-server.sh
```

### ❌ "No se puede obtener certificado SSL"

**Probable causa:** DNS aún no propagado

**Solución:**
```bash
# Espera 15 minutos y ejecuta manualmente:
certbot certonly --standalone -d stream.blackdiamond.com

# Luego reinicia Ant Media
systemctl restart antmedia
```

### ❌ "OBS no puede conectarse"

**Checklist:**
- ✅ Ant Media corriendo: `systemctl status antmedia`
- ✅ URL correcta: `rtmp://stream.blackdiamond.com/LiveApp/`
- ✅ Stream Key: `sede-norte-live`
- ✅ Puerto 1935 abierto: `ufw status`

---

## 💰 Costos

### Setup (una sola vez):
- Dominio: $10-15/año
- VPS: $0 (primeros $200 gratis con referral link)
- Script: $0 (gratis)
- Ant Media: $0 (Community Edition)
- SSL: $0 (Let's Encrypt)

### Mensual:
- VPS 4GB: $24/mes
- Dominio: ~$1/mes
- Bandwidth: Incluido (4TB)

**TOTAL: ~$25/mes** 💵

### Con crédito de DigitalOcean:
**Primeros 8 meses GRATIS** (con los $200 de crédito) 🎉

---

## 📞 ¿Necesitas Ayuda?

Si te atoras en algún paso:

1. **Lee los logs:**
   ```bash
   cat /tmp/antmedia_install.log
   tail -f /usr/local/antmedia/log/ant-media-server.log
   ```

2. **Verifica servicios:**
   ```bash
   systemctl status antmedia
   ufw status
   ```

3. **Revisa la configuración guardada:**
   ```bash
   cat /root/black-diamond-stream-config.txt
   ```

4. **Consulta la documentación oficial:**
   - Ant Media: https://github.com/ant-media/Ant-Media-Server/wiki
   - DigitalOcean: https://docs.digitalocean.com

---

## 🎉 ¡Eso es Todo!

Con estos pasos tendrás:

✅ Servidor privado con Ant Media  
✅ SSL configurado (HTTPS)  
✅ Stream creado y listo  
✅ OBS configurado  
✅ Black Diamond App transmitiendo  
✅ Control total y privacidad absoluta  

**Tiempo total: 30-45 minutos** ⏱️

**¡A transmitir sin censura! 🔥💎**
