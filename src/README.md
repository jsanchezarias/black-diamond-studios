# Black Diamond App 💎

Sistema de gestión completo para Black Diamond Studios con autenticación, dashboards por rol, gestión de servicios, modelos, clientes, pagos, **chat en tiempo real** y más.

## 🌟 Características Destacadas

- 🔐 **4 Roles de Usuario** con permisos granulares
- 💬 **Chat en Tiempo Real** entre clientes y moderadores
- 📊 **14 Contextos** para gestión completa del negocio
- 🌐 **Multiidioma** (Español/English)
- 💎 **Diseño Premium** con paleta oscura y efectos de lujo
- 📱 **Responsive** para móvil y desktop
- ⚡ **Optimistic Updates** para UX fluida
- 🔄 **Sincronización en Tiempo Real** con Supabase

## 🏗️ Estructura del Proyecto

```
black-diamond-app/
├── public/
│   └── manifest.json
│
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Componente principal con routing
│   ├── vite-env.d.ts              # TypeScript declarations
│   │
│   ├── components/                 # Componentes de UI
│   │   ├── figma/                 # Componentes especiales de Figma
│   │   │   └── ImageWithFallback.tsx
│   │   ├── ui/                    # Componentes shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (40+ componentes)
│   │   │
│   │   ├── LandingPage.tsx        # Página pública principal
│   │   ├── LoginForm.tsx          # Formulario de autenticación
│   │   ├── OwnerDashboard.tsx     # Dashboard del propietario
│   │   ├── AdminDashboard.tsx     # Dashboard del administrador
│   │   ├── ModeloDashboard.tsx    # Dashboard de modelos
│   │   ├── ProgramadorDashboard.tsx  # Dashboard del programador
│   │   │
│   │   └── ... (80+ componentes)   # Modales, paneles, cards, etc.
│   │
│   ├── contexts/                  # Contextos de React (14 contextos)
│   │   ├── AgendamientosContext.tsx   # Sistema de agendamiento
│   │   ├── AsistenciaContext.tsx      # Control de asistencia
│   │   ├── CarritoContext.tsx         # Carrito de compras
│   │   ├── ClientesContext.tsx        # Gestión de clientes
│   │   ├── GastosContext.tsx          # Gastos operativos
│   │   ├── InventoryContext.tsx       # Inventario de productos
│   │   ├── LanguageContext.tsx        # Internacionalización (ES/EN)
│   │   ├── ModelosContext.tsx         # Gestión de modelos
│   │   ├── MultasContext.tsx          # Sistema de multas
│   │   ├── PagosContext.tsx           # Registro de pagos
│   │   ├── PublicUsersContext.tsx     # Usuarios públicos
│   │   ├── ServiciosContext.tsx       # Servicios activos/finalizados
│   │   ├── TestimoniosContext.tsx     # Testimonios del sitio
│   │   ├── TurnosContext.tsx          # Sistema de turnos
│   │   ├── translations.ts            # Traducciones ES/EN
│   │   └── sedesData.ts               # Datos de sedes
│   │
│   └── lib/
│       └── supabaseClient.ts      # Cliente de Supabase (singleton)
│
├── styles/
│   ├── globals.css                # Estilos globales + Tailwind
│   ├── animations.css             # Animaciones personalizadas
│   ├── fonts.css                  # Fuentes custom
│   ├── tailwind.css               # Configuración Tailwind v4
│   └── theme.css                  # Variables de tema
│
├── utils/
│   └── supabase/
│       ├── client.ts              # Cliente alternativo Supabase
│       ├── fetchWithAuth.ts       # Helper para peticiones autenticadas
│       └── info.ts                # Información del proyecto Supabase
│
├── docs/                          # Documentación del proyecto
│   ├── QUICK_FIX_RECURSION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SETUP_GUIDE.md
│   └── ... (guías y comandos)
│
├── supabase/                      # Scripts SQL
│   ├── supabase-setup.sql
│   ├── supabase-fix-recursion.sql
│   ├── supabase-fix-policies.sql
│   └── ...
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .gitignore
└── README.md
```

## 🚀 Tecnologías

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth + Database + Storage)
- **State Management**: React Context API (14 contextos)
- **Routing**: Basado en roles de usuario
- **Internacionalización**: Español / English

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crea un archivo .env con las credenciales de Supabase
# Ver utils/supabase/info.ts para más detalles

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

## 🎭 Roles de Usuario

El sistema maneja 4 roles diferentes con permisos específicos:

### 1. **Owner** (Propietario)
- Acceso completo a todo el sistema
- Gestión de usuarios y roles
- Configuración de sedes
- Reportes financieros completos
- Gestión de modelos, clientes, servicios
- Control de gastos operativos

### 2. **Admin** (Administrador)
- Gestión de servicios activos
- Control de modelos y clientes
- Agendamiento y turnos
- Registro de pagos y multas
- Acceso a dashboards de rendimiento
- Sin acceso a configuración avanzada

### 3. **Modelo**
- Dashboard personal
- Ver servicios activos propios
- Historial de servicios
- Estado de pagos y adelantos
- Solicitudes de tiempo adicional
- Gestión de boutique personal

### 4. **Programador**
- Acceso limitado para desarrollo
- Herramientas de debugging
- Logs y métricas del sistema
- Sin acceso a datos sensibles
- **💬 Terminal de Chat**: Gestión de conversaciones con clientes

## 💬 Sistema de Chat en Tiempo Real

### Características del Chat:

#### **Para Clientes (Landing Page)**
- ✅ **Login Simplificado**: Solo nombre y teléfono
- ✅ **Mensajes Instantáneos**: Optimistic updates
- ✅ **Chat Privado**: Solo ven sus mensajes y los de la programadora
- ✅ **Sistema de Propinas**: PayU (tarjetas) y PSE (transferencias)
- ✅ **Sincronización en Tiempo Real** con Supabase Realtime
- ✅ **Sesiones Persistentes**: No pierden su sesión al recargar

#### **Para Moderadores (Dashboard Programador)**
- ✅ **Lista de Conversaciones**: Agrupadas por cliente
- ✅ **Mensajes No Leídos**: Contador visible
- ✅ **Marcado Automático**: Mensajes marcados como leídos al abrir
- ✅ **Respuestas Instantáneas**: Los clientes reciben respuestas en tiempo real
- ✅ **Filtros**: Ver conversaciones activas, cerradas o todas
- ✅ **Búsqueda**: Por nombre o teléfono
- ✅ **Historial Completo**: Todo guardado en Supabase

#### **Arquitectura del Chat**
```
Cliente → Escribe mensaje → Supabase (tabla: chat_mensajes_publicos)
                                ↓
                    Realtime Broadcast (< 1 segundo)
                                ↓
                          Programador → Ve mensaje
                                ↓
                          Responde → Supabase
                                ↓
                    Realtime Broadcast (< 1 segundo)
                                ↓
                          Cliente → Ve respuesta
```

#### **Tablas Requeridas en Supabase**
1. **`clientes`**: 
   - Campos: `id`, `nombre`, `telefono`, `email`, `sesion_activa`, `sesion_expires_at`, `sesion_ultimo_acceso`
   
2. **`chat_mensajes_publicos`**:
   - Campos: `id`, `sender_id`, `receiver_id`, `message`, `is_read`, `role`, `color`, `created_at`
   
**⚠️ IMPORTANTE**: Habilitar **Realtime** para ambas tablas en: `Database > Replication`

## 🔐 Autenticación

El sistema usa Supabase Auth con:
- Email/Password
- Roles basados en tabla `usuarios`
- RLS (Row Level Security)
- Detección de errores de recursión
- Sesiones persistentes en localStorage

## 🌐 Internacionalización

Soporta 2 idiomas:
- **Español** (por defecto)
- **English**

El idioma se guarda en localStorage y persiste entre sesiones.

## 📊 Contextos del Sistema

1. **AgendamientosContext**: Citas y agendamiento
2. **AsistenciaContext**: Control de entradas/salidas
3. **CarritoContext**: Carrito de compras de boutique
4. **ClientesContext**: Base de datos de clientes
5. **GastosContext**: Gastos operativos
6. **InventoryContext**: Inventario de productos
7. **LanguageContext**: Idioma de la aplicación
8. **ModelosContext**: Gestión de modelos (sincronizado con Supabase)
9. **MultasContext**: Sistema de multas automáticas
10. **PagosContext**: Registro de pagos a modelos
11. **PublicUsersContext**: Usuarios del sitio público
12. **ServiciosContext**: Servicios activos y finalizados
13. **TestimoniosContext**: Testimonios del sitio web
14. **TurnosContext**: Sistema de turnos

## 🛠️ Scripts de Base de Datos

En `/supabase/` encontrarás scripts SQL para:
- Crear tablas iniciales
- Configurar políticas RLS
- Solucionar errores de recursión
- Crear funciones de seguridad

## 📝 Guías de Desarrollo

Ver carpeta `/docs/` para:
- Guía de despliegue en Vercel
- Solución de errores comunes
- Comandos de terminal
- Creación de usuarios
- Configuración de Supabase

## 🚧 Estado del Proyecto

✅ Autenticación funcionando
✅ 4 dashboards por rol
✅ 14 contextos implementados
✅ Sistema de servicios completo
✅ Agendamiento y turnos
✅ Sistema de multas automáticas
✅ Internacionalización (ES/EN)
✅ Landing page pública
✅ Chat en vivo
✅ Streaming de video
✅ Sistema de pagos
✅ Boutique/Inventario
✅ Gestión de clientes
✅ Control de asistencia

## 📄 Licencia

Ver archivo `LICENSE` para más información.

## 👥 Equipo

Black Diamond Studios - Sistema de Gestión Completo

---

**Nota**: Este proyecto está configurado para usar Supabase como backend. Asegúrate de configurar las credenciales correctamente en `/utils/supabase/info.ts` antes de ejecutar.