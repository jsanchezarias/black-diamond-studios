# 🚀 Cómo Subir Black Diamond App a GitHub

## 📋 Requisitos Previos

1. **Cuenta de GitHub**
   - Si no tienes: https://github.com/signup
   - Es gratis

2. **Git instalado en tu PC**
   - Windows: https://git-scm.com/download/win
   - Mac: Ya viene instalado o `brew install git`
   - Linux: `sudo apt install git`

3. **Terminal/CMD abierto**

---

## 🎯 MÉTODO RÁPIDO (5 minutos)

### Paso 1: Descargar el Proyecto

Desde Figma Make, descarga todo el proyecto a tu PC:
- Click en el botón de descarga/export
- Guárdalo en una carpeta, ejemplo: `C:\Projects\black-diamond-app`

### Paso 2: Crear Repositorio en GitHub

1. **Ve a GitHub:** https://github.com
2. **Login** con tu cuenta
3. **Click en "New repository"** (botón verde superior derecho)
4. **Configuración:**
   ```
   Repository name: black-diamond-app
   Description: Sistema de gestión premium con streaming para boutique
   Visibility: Private ⭐ (para que solo tú lo veas)
   
   ❌ NO marques "Initialize with README" (ya lo tienes)
   ❌ NO agregues .gitignore (ya lo tienes)
   ❌ NO agregues licencia
   ```
5. **Click "Create repository"**

### Paso 3: Conectar y Subir

Abre la terminal/CMD en la carpeta de tu proyecto:

```bash
# En Windows: Click derecho en la carpeta → "Open in Terminal" o "Git Bash Here"
# En Mac/Linux: Abre Terminal y navega con cd a la carpeta

# 1. Verificar que estás en la carpeta correcta
pwd
# Debería mostrar la ruta a black-diamond-app

# 2. Inicializar Git
git init

# 3. Agregar todos los archivos
git add .

# 4. Hacer el primer commit
git commit -m "🎉 Initial commit - Black Diamond App completo con streaming"

# 5. Agregar el repositorio remoto
# REEMPLAZA "TU-USUARIO" con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU-USUARIO/black-diamond-app.git

# 6. Verificar que se agregó correctamente
git remote -v

# 7. Subir a GitHub
git branch -M main
git push -u origin main
```

**⚠️ IMPORTANTE:** Si te pide usuario y contraseña:
- **Usuario:** Tu username de GitHub
- **Contraseña:** Usa un **Personal Access Token** (NO tu contraseña normal)

### Paso 4: Crear Personal Access Token (si es necesario)

Si git te pide contraseña:

1. **Ve a GitHub:** https://github.com/settings/tokens
2. **Click "Generate new token"** → "Generate new token (classic)"
3. **Configuración:**
   ```
   Note: Black Diamond App
   Expiration: No expiration (o elige 90 días)
   
   ✅ Marcar: repo (todas las opciones)
   ```
4. **Click "Generate token"**
5. **Copia el token** (solo se muestra una vez)
6. **Úsalo como contraseña** cuando git te lo pida

---

## 🔐 MÉTODO CON SSH (Más Seguro)

Si prefieres SSH (más rápido para futuros pushes):

### Paso 1: Generar SSH Key

```bash
# 1. Generar key
ssh-keygen -t ed25519 -C "tu@email.com"

# Presiona Enter 3 veces (usa valores por defecto)

# 2. Ver tu key pública
cat ~/.ssh/id_ed25519.pub
# En Windows Git Bash: cat /c/Users/TU-USUARIO/.ssh/id_ed25519.pub

# 3. Copiar el contenido completo
```

### Paso 2: Agregar SSH Key a GitHub

1. **Ve a:** https://github.com/settings/keys
2. **Click "New SSH key"**
3. **Title:** Black Diamond App PC
4. **Key:** Pega el contenido que copiaste
5. **Click "Add SSH key"**

### Paso 3: Subir con SSH

```bash
# En lugar del paso 5 del método rápido, usa:
git remote add origin git@github.com:TU-USUARIO/black-diamond-app.git

# Luego continúa normal:
git branch -M main
git push -u origin main
```

---

## 📝 Comandos Útiles para Después

### Subir cambios nuevos:
```bash
# 1. Ver archivos modificados
git status

# 2. Agregar archivos modificados
git add .

# 3. Hacer commit con mensaje
git commit -m "✨ Descripción del cambio"

# 4. Subir a GitHub
git push
```

### Ver historial:
```bash
git log --oneline
```

### Crear branch para features:
```bash
# Crear y cambiar a nueva branch
git checkout -b feature/nueva-funcionalidad

# Trabajar en la branch...

# Subir la nueva branch
git push -u origin feature/nueva-funcionalidad
```

### Descargar cambios:
```bash
git pull
```

---

## 🔒 Proteger Información Sensible

### ¡IMPORTANTE! Antes de subir, verifica:

```bash
# 1. Asegúrate de que .gitignore está correcto
cat .gitignore

# Debe incluir:
# .env
# .env.local
# .env.*.local
```

### Si accidentalmente subiste un .env:

```bash
# 1. Remover del historial
git rm --cached .env

# 2. Agregar al .gitignore si no está
echo ".env" >> .gitignore

# 3. Commit
git add .gitignore
git commit -m "🔒 Remove .env from repo"

# 4. Push forzado (solo si acabas de crear el repo)
git push -f
```

### Crear .env.example:

```bash
# Crear un archivo de ejemplo SIN valores reales
cat > .env.example << 'EOF'
# Supabase
VITE_SUPABASE_URL=tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Streaming (Opcional)
VITE_STREAM_URL=https://stream.tudominio.com:5443/LiveApp/streams/sede-norte-live.m3u8
EOF

# Agregar y subir
git add .env.example
git commit -m "📝 Add .env.example"
git push
```

---

## 📂 Estructura que se Subirá

```
black-diamond-app/
├── .git/                      # Git (automático)
├── .gitignore                 # ✅ Archivos a ignorar
├── README.md                  # ✅ Documentación principal
│
├── src/                       # ✅ Código fuente
├── components/                # ✅ Componentes UI
├── supabase/                  # ✅ Backend
├── public/                    # ✅ Assets
├── styles/                    # ✅ Estilos
│
├── install-black-diamond-streaming.sh  # ✅ Script
├── INSTRUCCIONES-SCRIPT-AUTOMATICO.md  # ✅ Docs
├── GUIA-ANT-MEDIA-SERVER.md           # ✅ Docs
├── GUIA-STREAMING.md                  # ✅ Docs
├── RESUMEN-STREAMING.md               # ✅ Docs
├── README-STREAMING.md                # ✅ Docs
├── LINKS-IMPORTANTES.md               # ✅ Docs
├── ENTREGABLE-FINAL-STREAMING.md      # ✅ Docs
├── SUBIR-A-GITHUB.md                  # ✅ Esta guía
│
├── package.json               # ✅ Dependencias
├── tsconfig.json              # ✅ Config TypeScript
├── vite.config.ts             # ✅ Config Vite
└── tailwind.config.js         # ✅ Config Tailwind
```

**NO se subirán (gracias a .gitignore):**
- ❌ `node_modules/`
- ❌ `.env`
- ❌ `.env.local`
- ❌ `dist/`
- ❌ `.vscode/`

---

## 🌟 Hacer el Repo Bonito

### Agregar badges al README:

Edita `/README.md` y agrega al inicio:

```markdown
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-Private-red)
```

### Agregar screenshot:

1. Toma screenshot de tu app
2. Súbelo a GitHub Issues temporalmente o usa Imgur
3. Agrega al README:
```markdown
![Black Diamond Screenshot](URL-de-tu-imagen)
```

---

## 🎯 Verificar que Todo Subió

1. **Ve a tu repo:** https://github.com/TU-USUARIO/black-diamond-app
2. **Verifica:**
   - ✅ Archivos están ahí
   - ✅ README.md se ve bien
   - ✅ .env NO está visible
   - ✅ Documentación completa

---

## 🔗 Compartir el Repo

### Si es privado (recomendado):

```bash
# Invitar colaboradores:
Settings → Collaborators → Add people
```

### Si quieres hacerlo público:

```bash
Settings → Danger Zone → Change visibility → Public
```

---

## 📦 Clonar en Otra PC

Para descargar tu proyecto en otra computadora:

```bash
# Con HTTPS:
git clone https://github.com/TU-USUARIO/black-diamond-app.git

# Con SSH:
git clone git@github.com:TU-USUARIO/black-diamond-app.git

# Entrar a la carpeta
cd black-diamond-app

# Instalar dependencias
npm install

# Crear .env.local con tus credenciales
cp .env.example .env.local
# Editar .env.local con tus keys

# Iniciar
npm run dev
```

---

## 🆘 Solución de Problemas

### Error: "fatal: not a git repository"
```bash
# Estás en la carpeta incorrecta
cd /ruta/a/black-diamond-app
git init
```

### Error: "remote origin already exists"
```bash
# Remover y agregar de nuevo
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/black-diamond-app.git
```

### Error: "failed to push some refs"
```bash
# Primero hacer pull
git pull origin main --rebase

# Luego push
git push
```

### Error: "large files"
```bash
# Ver archivos grandes
du -sh * | sort -h

# Remover del staging
git rm --cached archivo-grande.mp4

# Agregar a .gitignore
echo "*.mp4" >> .gitignore
```

### Subí .env por error
```bash
# Método 1: Remover del último commit
git rm --cached .env
git commit --amend --no-edit
git push -f

# Método 2: Revertir commit
git reset HEAD~1
# Agregar .env a .gitignore
# Hacer commit de nuevo
```

**⚠️ IMPORTANTE:** Si subiste claves secretas a GitHub:
1. **REGENERA** todas las claves en Supabase
2. Actualiza tu .env.local
3. Nunca uses las claves viejas

---

## ✅ Checklist Final

Antes de compartir tu repo, verifica:

- [ ] .gitignore incluye .env
- [ ] .env NO está en el repo
- [ ] README.md se ve bien
- [ ] Toda la documentación subió
- [ ] Scripts tienen permisos ejecutables
- [ ] package.json está correcto
- [ ] No hay claves secretas en el código
- [ ] El repo es privado (o público si quieres)

---

## 🎉 ¡Listo!

Tu repositorio ya está en GitHub. Ahora puedes:

✅ Trabajar desde múltiples computadoras  
✅ Tener respaldo automático  
✅ Ver historial de cambios  
✅ Colaborar con otros devs  
✅ Usar CI/CD en el futuro  

**URL de tu repo:**
```
https://github.com/TU-USUARIO/black-diamond-app
```

---

**💎 Black Diamond App - Ahora en GitHub 🚀**
