#!/bin/bash

###############################################################################
#                                                                             #
#          BLACK DIAMOND APP - INSTALADOR AUTOMÁTICO ANT MEDIA SERVER        #
#                                                                             #
#  Este script instala y configura Ant Media Server completamente            #
#  en un servidor Ubuntu 22.04 nuevo para Black Diamond App                  #
#                                                                             #
###############################################################################

set -e  # Detener si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          ██████╗ ██╗      █████╗  ██████╗██╗  ██╗            ║
║          ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝            ║
║          ██████╔╝██║     ███████║██║     █████╔╝             ║
║          ██╔══██╗██║     ██╔══██║██║     ██╔═██╗             ║
║          ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗            ║
║          ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝            ║
║                                                               ║
║              ██████╗ ██╗ █████╗ ███╗   ███╗ ██████╗ ███╗   ██╗██████╗     ║
║              ██╔══██╗██║██╔══██╗████╗ ████║██╔═══██╗████╗  ██║██╔══██╗    ║
║              ██║  ██║██║███████║██╔████╔██║██║   ██║██╔██╗ ██║██║  ██║    ║
║              ██║  ██║██║██╔══██║██║╚██╔╝██║██║   ██║██║╚██╗██║██║  ██║    ║
║              ██████╔╝██║██║  ██║██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██████╔╝    ║
║              ╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝     ║
║                                                               ║
║              INSTALADOR AUTOMÁTICO ANT MEDIA SERVER           ║
║                    Streaming Sin Censura                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}🔥 Instalación automatizada de Ant Media Server para Black Diamond${NC}\n"

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Este script debe ejecutarse como root (usa 'sudo')${NC}" 
   exit 1
fi

# Verificar Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo -e "${YELLOW}⚠️  Este script está optimizado para Ubuntu 22.04${NC}"
    read -p "¿Deseas continuar de todos modos? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Verificaciones iniciales completadas${NC}\n"

# Solicitar información al usuario
echo -e "${BLUE}📝 Configuración inicial${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Dominio
while true; do
    read -p "🌐 Ingresa tu dominio (ej: stream.blackdiamond.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        echo -e "${RED}❌ El dominio no puede estar vacío${NC}"
        continue
    fi
    
    # Verificar que el DNS apunta a este servidor
    echo -e "${CYAN}🔍 Verificando DNS...${NC}"
    SERVER_IP=$(curl -s ifconfig.me)
    DOMAIN_IP=$(dig +short "$DOMAIN" | tail -n1)
    
    if [[ "$DOMAIN_IP" == "$SERVER_IP" ]]; then
        echo -e "${GREEN}✅ DNS configurado correctamente ($DOMAIN → $SERVER_IP)${NC}"
        break
    else
        echo -e "${YELLOW}⚠️  El dominio $DOMAIN apunta a: $DOMAIN_IP${NC}"
        echo -e "${YELLOW}⚠️  Pero este servidor tiene la IP: $SERVER_IP${NC}"
        read -p "¿Continuar de todos modos? (s/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            break
        fi
    fi
done

# Email para SSL
while true; do
    read -p "📧 Ingresa tu email (para certificado SSL): " EMAIL
    if [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        break
    else
        echo -e "${RED}❌ Email inválido, intenta de nuevo${NC}"
    fi
done

# Stream name
read -p "🎬 Nombre del stream (default: sede-norte-live): " STREAM_NAME
STREAM_NAME=${STREAM_NAME:-sede-norte-live}

echo -e "\n${GREEN}📋 Resumen de configuración:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "🌐 Dominio:      ${GREEN}$DOMAIN${NC}"
echo -e "📧 Email:        ${GREEN}$EMAIL${NC}"
echo -e "🎬 Stream:       ${GREEN}$STREAM_NAME${NC}"
echo -e "🖥️  IP Servidor:  ${GREEN}$SERVER_IP${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

read -p "¿Continuar con la instalación? (S/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]] && [[ ! -z $REPLY ]]; then
    echo -e "${RED}❌ Instalación cancelada${NC}"
    exit 1
fi

# Función para mostrar progreso
show_progress() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Iniciar instalación
echo -e "\n${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║         🚀 INICIANDO INSTALACIÓN AUTOMÁTICA           ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}\n"

# 1. Actualizar sistema
show_progress "1/8 Actualizando sistema operativo..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq > /dev/null 2>&1
apt-get upgrade -y -qq > /dev/null 2>&1
show_success "Sistema actualizado"

# 2. Instalar dependencias
show_progress "2/8 Instalando dependencias (wget, curl, certbot, ufw)..."
apt-get install -y wget curl certbot software-properties-common ufw net-tools -qq > /dev/null 2>&1
show_success "Dependencias instaladas"

# 3. Descargar instalador de Ant Media
show_progress "3/8 Descargando Ant Media Server Community Edition..."
cd /tmp
wget -q https://raw.githubusercontent.com/ant-media/Scripts/master/install_ant-media-server.sh -O install_ant-media-server.sh
chmod +x install_ant-media-server.sh
show_success "Instalador descargado"

# 4. Instalar Ant Media Server (modo no interactivo)
show_progress "4/8 Instalando Ant Media Server (esto puede tomar 5-10 minutos)..."

# Crear archivo de configuración para instalación no interactiva
cat > /tmp/antmedia_install_config.txt << EOF
1
EOF

# Ejecutar instalador
./install_ant-media-server.sh -i < /tmp/antmedia_install_config.txt > /tmp/antmedia_install.log 2>&1

# Esperar a que el servicio esté listo
sleep 10

# Verificar instalación
if systemctl is-active --quiet antmedia; then
    show_success "Ant Media Server instalado y corriendo"
else
    show_error "Ant Media Server no se inició correctamente"
    echo "Ver logs en: /tmp/antmedia_install.log"
    exit 1
fi

# 5. Configurar SSL con Certbot
show_progress "5/8 Configurando certificado SSL (Let's Encrypt)..."

# Detener Ant Media temporalmente para liberar puertos
systemctl stop antmedia

# Obtener certificado
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" > /tmp/certbot.log 2>&1

if [ $? -eq 0 ]; then
    show_success "Certificado SSL obtenido"
    
    # Configurar Ant Media para usar el certificado
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
    
    # Crear keystore desde los certificados de Let's Encrypt
    show_progress "5b/8 Configurando certificado en Ant Media..."
    
    openssl pkcs12 -export \
        -in "$CERT_PATH/fullchain.pem" \
        -inkey "$CERT_PATH/privkey.pem" \
        -out /tmp/antmedia.p12 \
        -name antmedia \
        -password pass:changeit > /dev/null 2>&1
    
    keytool -importkeystore \
        -deststorepass changeit \
        -destkeypass changeit \
        -destkeystore /usr/local/antmedia/conf/antmedia.keystore \
        -srckeystore /tmp/antmedia.p12 \
        -srcstoretype PKCS12 \
        -srcstorepass changeit \
        -alias antmedia \
        -noprompt > /dev/null 2>&1
    
    # Configurar renovación automática
    cat > /etc/cron.d/antmedia-ssl-renew << 'CRON_EOF'
0 3 * * * root certbot renew --quiet --deploy-hook "systemctl restart antmedia"
CRON_EOF
    
    show_success "SSL configurado en Ant Media"
else
    show_error "No se pudo obtener certificado SSL"
    echo "Ver logs en: /tmp/certbot.log"
    echo "Continuando sin SSL (puedes configurarlo manualmente después)"
fi

# Reiniciar Ant Media
systemctl start antmedia
sleep 5

# 6. Configurar Firewall
show_progress "6/8 Configurando firewall (UFW)..."

ufw --force enable > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1

# Permitir puertos necesarios
ufw allow 22/tcp comment 'SSH' > /dev/null 2>&1
ufw allow 80/tcp comment 'HTTP' > /dev/null 2>&1
ufw allow 443/tcp comment 'HTTPS' > /dev/null 2>&1
ufw allow 5080/tcp comment 'Ant Media HTTP' > /dev/null 2>&1
ufw allow 5443/tcp comment 'Ant Media HTTPS' > /dev/null 2>&1
ufw allow 1935/tcp comment 'RTMP' > /dev/null 2>&1
ufw allow 5000:65000/udp comment 'WebRTC UDP' > /dev/null 2>&1

ufw reload > /dev/null 2>&1

show_success "Firewall configurado"

# 7. Crear stream en Ant Media (vía API REST)
show_progress "7/8 Creando stream '$STREAM_NAME' en Ant Media..."

# Esperar a que la API esté disponible
sleep 10

# Crear stream usando la API REST de Ant Media
STREAM_CREATED=$(curl -s -X POST \
    "http://localhost:5080/LiveApp/rest/v2/broadcasts/create" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$STREAM_NAME\",
        \"type\": \"liveStream\",
        \"publicStream\": true
    }" | grep -o '"streamId":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$STREAM_CREATED" ]; then
    show_success "Stream creado exitosamente (ID: $STREAM_CREATED)"
else
    show_error "No se pudo crear el stream automáticamente"
    echo "Puedes crearlo manualmente desde el panel web"
fi

# 8. Optimizar configuración de Ant Media para baja latencia
show_progress "8/8 Optimizando configuración para baja latencia..."

# Configurar red.properties para mejor rendimiento
cat >> /usr/local/antmedia/webapps/LiveApp/WEB-INF/red5-web.properties << 'PROPERTIES_EOF'

# Black Diamond optimizations
settings.hlsTime=2
settings.hlsListSize=3
settings.hlsPlayListType=event
settings.deleteHLSFilesOnEnded=true
settings.previewOverwrite=true
PROPERTIES_EOF

systemctl restart antmedia
sleep 5

show_success "Optimización completada"

# Limpiar archivos temporales
rm -f /tmp/antmedia_install_config.txt /tmp/antmedia.p12

# ============================================================================
# INSTALACIÓN COMPLETADA - MOSTRAR INFORMACIÓN
# ============================================================================

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║    ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE! 🎉         ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 INFORMACIÓN IMPORTANTE - GUARDA ESTO${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${MAGENTA}🌐 PANEL DE ADMINISTRACIÓN ANT MEDIA:${NC}"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "   ${GREEN}https://$DOMAIN:5443${NC}"
else
    echo -e "   ${YELLOW}http://$DOMAIN:5080${NC} (SSL no configurado)"
fi
echo ""

echo -e "${MAGENTA}🎬 CONFIGURACIÓN PARA OBS STUDIO:${NC}"
echo -e "   ${CYAN}Servicio:${NC}    Custom (Personalizado)"
echo -e "   ${CYAN}Servidor:${NC}    ${GREEN}rtmp://$DOMAIN/LiveApp/${NC}"
echo -e "   ${CYAN}Stream Key:${NC}  ${GREEN}$STREAM_NAME${NC}"
echo ""

echo -e "${MAGENTA}📺 URL HLS PARA BLACK DIAMOND APP:${NC}"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    HLS_URL="https://$DOMAIN:5443/LiveApp/streams/$STREAM_NAME.m3u8"
else
    HLS_URL="http://$DOMAIN:5080/LiveApp/streams/$STREAM_NAME.m3u8"
fi
echo -e "   ${GREEN}$HLS_URL${NC}"
echo ""

echo -e "${MAGENTA}🔍 VERIFICAR STREAM (en navegador):${NC}"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    PLAY_URL="https://$DOMAIN:5443/LiveApp/play.html?name=$STREAM_NAME"
else
    PLAY_URL="http://$DOMAIN:5080/LiveApp/play.html?name=$STREAM_NAME"
fi
echo -e "   ${GREEN}$PLAY_URL${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}📝 PRÓXIMOS PASOS:${NC}\n"
echo -e "  1️⃣  Abre el panel web en tu navegador"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "     ${GREEN}https://$DOMAIN:5443${NC}"
else
    echo -e "     ${YELLOW}http://$DOMAIN:5080${NC}"
fi
echo ""
echo -e "  2️⃣  Crea tu cuenta de administrador"
echo -e "     (Solo la primera vez que accedas)"
echo ""
echo -e "  3️⃣  Configura OBS Studio:"
echo -e "     • Server: ${GREEN}rtmp://$DOMAIN/LiveApp/${NC}"
echo -e "     • Stream Key: ${GREEN}$STREAM_NAME${NC}"
echo ""
echo -e "  4️⃣  En Black Diamond App → Panel Admin → Streams:"
echo -e "     • Pega la URL HLS: ${GREEN}$HLS_URL${NC}"
echo -e "     • Click 'Marcar como En Vivo'"
echo ""
echo -e "  5️⃣  ¡Inicia transmisión en OBS!"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}🔧 COMANDOS ÚTILES:${NC}\n"
echo -e "  Ver estado:     ${CYAN}systemctl status antmedia${NC}"
echo -e "  Ver logs:       ${CYAN}tail -f /usr/local/antmedia/log/ant-media-server.log${NC}"
echo -e "  Reiniciar:      ${CYAN}systemctl restart antmedia${NC}"
echo -e "  Detener:        ${CYAN}systemctl stop antmedia${NC}"
echo -e "  Iniciar:        ${CYAN}systemctl start antmedia${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${GREEN}✨ ¡Sistema listo para transmitir sin censura! 💎${NC}\n"

# Guardar configuración en archivo
cat > /root/black-diamond-stream-config.txt << CONFIG_EOF
╔════════════════════════════════════════════════════════╗
║      BLACK DIAMOND STREAMING - CONFIGURACIÓN           ║
╚════════════════════════════════════════════════════════╝

Fecha instalación: $(date)
Dominio: $DOMAIN
Email: $EMAIL
Stream Name: $STREAM_NAME
IP Servidor: $SERVER_IP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PANEL ANT MEDIA:
$(if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then echo "https://$DOMAIN:5443"; else echo "http://$DOMAIN:5080"; fi)

OBS CONFIGURATION:
Server: rtmp://$DOMAIN/LiveApp/
Stream Key: $STREAM_NAME

BLACK DIAMOND HLS URL:
$HLS_URL

VERIFICAR STREAM:
$PLAY_URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMANDOS ÚTILES:
systemctl status antmedia
systemctl restart antmedia
tail -f /usr/local/antmedia/log/ant-media-server.log

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este archivo está guardado en:
/root/black-diamond-stream-config.txt

CONFIG_EOF

echo -e "${GREEN}💾 Configuración guardada en: ${CYAN}/root/black-diamond-stream-config.txt${NC}\n"

echo -e "${MAGENTA}🎉 ¡Disfruta tu streaming sin censura con Black Diamond App! 💎${NC}\n"

exit 0
