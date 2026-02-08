# 📖 Diccionario de Nomenclatura - Black Diamond App

Este documento establece la nomenclatura oficial del sistema para mantener consistencia en todo el código, base de datos y documentación.

**Fecha de creación**: 2026-02-08  
**Última actualización**: 2026-02-08 (Tema Simplificado)

---

## 🎯 Principios de Nomenclatura

1. **Consistencia**: Usar siempre los mismos términos en español/inglés según el contexto
2. **Claridad**: Nombres descriptivos y autoexplicativos
3. **Estandarización**: Seguir convenciones de camelCase para variables, PascalCase para componentes
4. **Español en BD**: Campos de base de datos en español para facilitar lectura
5. **Inglés en código**: Nombres de componentes y funciones en español si son del dominio del negocio

---

## 🎨 TEMA DE COLORES SIMPLIFICADO

### **Filosofía: Simple y Elegante**

Solo 4 tipos de colores:
1. **Fondos**: Negro → Gris oscuro (4 tonos)
2. **Textos**: Blanco → Gris (3 tonos)
3. **Dorado**: Un tono principal + hover (2 tonos)
4. **Estados**: Verde, Rojo, Amarillo, Azul

### Colores Base

```css
/* FONDOS - Del más oscuro al más claro */
--bg-black: #000000;           /* Negro puro - Fondo principal */
--bg-dark: #0f0f0f;            /* Negro carbón - Sidebars */
--bg-card: #1a1a1a;            /* Gris muy oscuro - Cards */
--bg-hover: #242424;           /* Gris oscuro - Hover states */

/* BORDES */
--border-color: #2a2a2a;       /* Gris medio - Bordes sutiles */
--border-hover: #d4af37;       /* Dorado - Bordes activos */

/* TEXTOS - De más claro a más oscuro */
--text-white: #ffffff;         /* Blanco - Títulos importantes */
--text-gray: #a0a0a0;          /* Gris claro - Texto normal */
--text-muted: #666666;         /* Gris oscuro - Texto secundario */

/* DORADO - Un solo tono principal */
--gold: #d4af37;               /* Dorado único - Acentos */
--gold-hover: #e5c158;         /* Dorado claro - Hover */
--gold-dark: #b8941f;          /* Dorado oscuro - Active */

/* ESTADOS */
--success: #10b981;            /* Verde éxito */
--error: #ef4444;              /* Rojo error */
--warning: #f59e0b;            /* Amarillo advertencia */
--info: #3b82f6;               /* Azul información */
```

### Uso en Código

```typescript
// ✅ FONDOS
className="bg-black"           // Negro puro - Fondo principal
className="bg-dark"            // Negro carbón - Sidebars
className="bg-card"            // Gris muy oscuro - Cards
className="bg-hover"           // Gris oscuro - Hover

// ✅ TEXTOS
className="text-white"         // Blanco - Títulos importantes
className="text-gray"          // Gris claro - Texto normal
className="text-muted"         // Gris oscuro - Secundario

// ✅ DORADO
className="bg-gold"            // Fondo dorado
className="text-gold"          // Texto dorado
className="border-gold"        // Borde dorado

// ✅ ESTADOS
className="text-success"       // Verde
className="text-error"         // Rojo
className="text-warning"       // Amarillo
className="text-info"          // Azul

// ❌ NO USAR nombres confusos
className="bg-obsidian"        // Demasiado específico
className="text-platinum"      // Innecesario, usar text-white
className="bg-charcoal"        // Innecesario, usar bg-dark
```

### Tipografías

```typescript
// ✅ FUENTES OFICIALES
--font-main: 'Inter'           // Fuente principal para todo
--font-display: 'Playfair Display'  // Solo títulos hero

// Uso:
className="font-main"          // Texto general (Inter)
className="font-display"       // Títulos hero (Playfair)

// ❌ NO USAR
// Cinzel, Montserrat, JetBrains Mono (simplificado a 2 fuentes)
```

### Espaciado

#### Sistema de Espaciado (4px base)
```typescript
// ✅ ESCALA OFICIAL
spacing: {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
  '4xl': '6rem',  // 96px
}

// ❌ NO USAR valores arbitrarios
className="p-[13px]"              // Usar p-3 (12px) o p-4 (16px)
className="gap-[22px]"            // Usar gap-5 (20px) o gap-6 (24px)
```

### Sombras

#### Sombras Premium
```typescript
// ✅ NOMBRES OFICIALES
boxShadow: {
  'premium-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
  'premium': '0 4px 16px rgba(0, 0, 0, 0.5)',
  'premium-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
  'glow-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
  'glow-gold-strong': '0 0 40px rgba(212, 175, 55, 0.5)',
  'inner-dark': 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
}

// Uso en Tailwind
className="shadow-premium"           // Sombra estándar
className="shadow-premium-lg"        // Sombra grande
className="shadow-glow-gold"         // Glow dorado sutil
className="hover:shadow-glow-gold-strong"  // Glow fuerte en hover

// ❌ NO USAR
className="shadow-md"                // Muy genérico
className="shadow-xl"                // No tiene el look premium
```

### Bordes y Radios

#### Radios de Borde
```typescript
// ✅ RADIOS OFICIALES
borderRadius: {
  none: '0',
  xs: '0.25rem',    // 4px - Inputs pequeños
  sm: '0.375rem',   // 6px - Botones pequeños
  md: '0.5rem',     // 8px - Botones estándar
  lg: '0.75rem',    // 12px - Cards
  xl: '1rem',       // 16px - Modales
  '2xl': '1.5rem',  // 24px - Heros
  full: '9999px',   // Circular
}

// ❌ NO USAR
rounded            // Usar rounded-md
rounded-3xl        // Demasiado redondeado para el estilo
```

#### Bordes
```typescript
// ✅ COLORES DE BORDE
className="border-graphite"          // Borde estándar oscuro
className="border-gold-primary"      // Borde dorado
className="border-slate"             // Borde muy sutil

// ✅ ANCHOS DE BORDE
className="border"                   // 1px - Estándar
className="border-2"                 // 2px - Destacado

// ❌ NO USAR
className="border-gray-700"          // No está en el sistema
className="border-4"                 // Demasiado grueso
```

### Efectos y Transiciones

#### Transiciones Estándar
```typescript
// ✅ DURACIONES OFICIALES
transition: {
  fast: '150ms ease-in-out',         // Micro-interacciones
  base: '200ms ease-in-out',         // Transición estándar
  slow: '300ms ease-in-out',         // Transiciones complejas
  slower: '500ms ease-in-out',       // Animaciones grandes
}

// Uso en Tailwind
className="transition-fast"
className="transition-base"
className="transition-slow"

// ❌ NO USAR
className="transition-all duration-1000"  // Demasiado lento
className="ease-linear"                   // Muy robótico
```

#### Opacidades
```typescript
// ✅ OPACIDADES OFICIALES
opacity: {
  disabled: 0.4,     // Elementos deshabilitados
  muted: 0.6,        // Elementos secundarios
  hover: 0.8,        // Hover sobre elementos
  full: 1.0,         // Completamente visible
}

// ❌ NO USAR
className="opacity-45"   // Usar opacity-40 o opacity-50
className="opacity-85"   // Usar opacity-80 o opacity-90
```

---

## 👥 USUARIOS Y ROLES

### Roles del Sistema
```typescript
// ✅ CORRECTO
type Role = 'owner' | 'admin' | 'programador' | 'modelo';

// ❌ INCORRECTO
type Role = 'dueño' | 'administrator' | 'developer' | 'model';
```

### Términos Relacionados
- **Usuario**: `usuario` (en BD) / `user` (en código si es genérico)
- **Owner**: `owner` (siempre en inglés, es un rol específico)
- **Admin**: `admin` (siempre en inglés)
- **Programador**: `programador` (siempre en español)
- **Modelo**: `modelo` (siempre en español, femenino)

---

## 📅 AGENDAMIENTOS Y SERVICIOS

### Agendamiento (Reserva Futura)
```typescript
// ✅ NOMBRES OFICIALES
interface Agendamiento {
  id: string;                    // Identificador único
  modeloEmail: string;           // Email de la modelo
  modeloNombre: string;          // Nombre de la modelo
  clienteId: string;             // ID del cliente
  clienteNombre: string;         // Nombre del cliente
  clienteTelefono: string;       // Teléfono del cliente
  fecha: string;                 // Formato: YYYY-MM-DD
  hora: string;                  // Formato: HH:MM (24h)
  duracionMinutos: number;       // Duración en minutos
  tipoServicio: 'sede' | 'domicilio';  // Tipo de servicio
  estado: 'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'no_show';
  notas: string;                 // Observaciones
  montoPago: number;             // Monto a pagar
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';
  tarifaNombre: string;          // Nombre de la tarifa
  tarifaDescripcion: string;     // Descripción de la tarifa
}

// ❌ NO USAR
// - cita, appointment, booking
// - reserva, reservation
// Usar siempre: "agendamiento"
```

**Prefijo en KV Store**: `agendamiento:`

### Servicio (Registro Histórico Inmutable)
```typescript
// ✅ NOMBRES OFICIALES
interface Servicio {
  id: string;
  agendamientoId: string;        // Referencia al agendamiento original
  
  // Temporal
  fecha: string;
  hora: string;
  duracionEstimadaMinutos: number;
  duracionRealMinutos?: number;  // Duración real del servicio
  
  // Cliente (snapshot)
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  
  // Modelo (snapshot)
  modeloEmail: string;
  modeloNombre: string;
  modeloId?: string;
  
  // Servicio
  tipoServicio: 'sede' | 'domicilio';
  tarifaNombre: string;
  tarifaDescripcion?: string;
  montoPactado: number;
  
  // Pago
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';
  metodoPago?: string;
  transaccionId?: string;
  fechaPago?: string;
  comprobantePago?: string;
  montoPagado?: number;
  propina?: number;
  
  // Estado
  estado: 'completado' | 'cancelado' | 'no_show';
  
  // Notas
  notasPreServicio?: string;     // Del agendamiento
  notasPostServicio?: string;    // Después del servicio
  
  // Calificaciones
  calificacionCliente?: number;  // 1-5 estrellas
  reviewCliente?: string;
  calificacionModelo?: number;   // La modelo califica al cliente
  reviewModelo?: string;
  
  // Cancelación/No-Show
  motivoCancelacion?: string;
  canceladoPor?: string;         // 'cliente' | 'modelo' | 'admin' | 'sistema'
  fechaCancelacion?: string;
  
  // Multas
  multaAplicada?: boolean;
  montoMulta?: number;
  motivoMulta?: string;
  multaPagada?: boolean;
  
  // Metadatos
  fechaCreacion: string;
  creadoPor: string;
}

// ❌ NO USAR
// - service, appointment, booking
// Usar siempre: "servicio"
```

**Prefijo en KV Store**: `servicio:`

### Estados de Agendamiento/Servicio
```typescript
// ✅ ESTADOS OFICIALES
type EstadoAgendamiento = 'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'no_show';
type EstadoServicio = 'completado' | 'cancelado' | 'no_show';

// ❌ NO USAR
// - en_proceso, in_progress, active
// - finalizado, finished, done
```

### Tipo de Servicio
```typescript
// ✅ TIPOS OFICIALES
type TipoServicio = 'sede' | 'domicilio';

// ❌ NO USAR
// - en_sede, in_house, local
// - a_domicilio, outcall, home
```

---

## 👤 CLIENTES

### Cliente
```typescript
// ✅ NOMBRES OFICIALES
interface Cliente {
  id: string;
  telefono: string;              // Identificador principal
  nombre: string;
  nombreUsuario: string;
  email?: string;
  fechaNacimiento?: Date;
  ciudad?: string;
  preferencias?: string;
  notas?: string;                // Notas administrativas
  observaciones?: ObservacionModelo[];
  rating?: number;
  historialServicios: ServicioCliente[];
  userId?: string;
  fechaRegistro: Date;
  ultimaVisita?: Date;
  totalServicios: number;
  totalGastado: number;
  
  // Sistema de bloqueo y multas
  bloqueado?: boolean;
  motivoBloqueo?: string;
  fechaBloqueo?: string;
  bloqueadoPor?: string;
  multasPendientes?: number;
  totalNoShows?: number;
}

// ❌ NO USAR
// - customer, user, client
// Usar siempre: "cliente"
```

**Prefijo en KV Store**: `cliente:`

---

## 💸 MULTAS Y PENALIZACIONES

### Multa
```typescript
// ✅ NOMBRES OFICIALES
interface PoliticaPenalizacion {
  noShowsParaMulta: number;          // Cantidad de no-shows para aplicar multa
  noShowsParaBloqueo: number;        // Cantidad de no-shows para bloquear
  montoMultaBase: number;            // Multa mínima en COP
  porcentajeMultaSobreTarifa: number; // % de la tarifa como multa
  diasParaPagarMulta: number;        // Días para pagar antes de consecuencias
}

// Estados de multa
multaAplicada: boolean;
multaPagada: boolean;
montoMulta: number;
motivoMulta: string;

// ❌ NO USAR
// - penalty, fine, charge, fee
// - sancion, penalidad
// Usar siempre: "multa"
```

### No-Show
```typescript
// ✅ TÉRMINO OFICIAL
estado: 'no_show'  // Guion bajo, no camelCase

// ❌ NO USAR
// - noShow, ausente, no_asistio, missed, absent
// Usar siempre: "no_show"
```

### Bloqueo
```typescript
// ✅ TÉRMINOS OFICIALES
bloqueado: boolean;
motivoBloqueo: string;
fechaBloqueo: string;
bloqueadoPor: string;

// ❌ NO USAR
// - banned, blocked, suspended
// - inhabilitado, desactivado
// Usar siempre: "bloqueado"
```

---

## 💰 PAGOS Y TARIFAS

### Pago
```typescript
// ✅ NOMBRES OFICIALES
interface Pago {
  id: string;
  monto: number;                 // En COP
  metodoPago: string;            // 'efectivo' | 'transferencia' | 'tarjeta'
  estadoPago: 'pendiente' | 'pagado' | 'reembolsado';
  fechaPago?: string;
  transaccionId?: string;
  comprobantePago?: string;      // URL del comprobante
  propina?: number;
}

// ❌ NO USAR
// - payment, transaction
// - transaccion (sin comprobante)
// Usar siempre: "pago"
```

### Tarifa
```typescript
// ✅ NOMBRES OFICIALES
interface Tarifa {
  name: string;                  // Nombre descriptivo
  duration: string;              // En minutos (string para compatibilidad)
  price: string;                 // Precio sede (formato: "$XXXk")
  priceHome?: string;            // Precio domicilio (formato: "$XXXk")
  description: string;
}

// Tarifas domicilio fijas
const TARIFAS_DOMICILIO = {
  '1h': 250000,    // $250k
  '2h': 480000,    // $480k
  '3h': 690000,    // $690k
  '6h': 1200000,   // $1.2M
  '8h': 1500000,   // $1.5M
  '12h': 2000000,  // $2M
  '24h': 2500000,  // $2.5M
};

// ❌ NO USAR
// - rate, pricing, cost
// - precio, costo
// Usar siempre: "tarifa"
```

### Método de Pago
```typescript
// ✅ MÉTODOS OFICIALES
type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'nequi' | 'daviplata';

// ❌ NO USAR
// - cash, transfer, card
// - payment_method
```

---

## 💃 MODELOS

### Modelo
```typescript
// ✅ NOMBRES OFICIALES
interface Modelo {
  id: string;
  email: string;                 // Identificador único
  nombre: string;                // Nombre real
  nombreArtistico: string;       // Nombre de trabajo
  telefono: string;
  activa: boolean;               // Estado general
  disponible: boolean;           // Disponible ahora
  sede: string;
  serviciosDisponibles: Tarifa[];
  fotoPerfil?: string;
  fotos?: string[];
  descripcion?: string;
  especialidades?: string[];
  horarioDisponible?: HorarioModelo;
}

// ❌ NO USAR
// - model, performer, escort
// - trabajadora, chica
// Usar siempre: "modelo" (femenino)
```

**Prefijo en KV Store**: `modelo:`

### Estados de Modelo
```typescript
// ✅ ESTADOS OFICIALES
activa: boolean;        // Está trabajando en la empresa
disponible: boolean;    // Está disponible para atender ahora
archivada: boolean;     // Ya no trabaja pero mantiene registro

// ❌ NO USAR
// - active, available, working
// - en_servicio, ocupada
```

---

## 📊 CONTEXTOS Y PROVIDERS

### Nomenclatura de Contextos
```typescript
// ✅ NOMBRES OFICIALES
AgendamientosContext     → useAgendamientos()
ServiciosContext         → useServicios()
ClientesContext          → useClientes()
ModelosContext           → useModelos()
PagosContext             → usePagos()
MultasContext            → useMultas()
TurnosContext            → useTurnos()
GastosContext            → useGastos()
AsistenciaContext        → useAsistencia()
TestimoniosContext       → useTestimonios()
VideosContext            → useVideos()
InventoryContext         → useInventory()
CarritoContext           → useCarrito()

// ❌ NO USAR
// - AppointmentsContext, BookingsContext
// - ServicesContext
// - CustomersContext
```

---

## 🗄️ BASE DE DATOS (KV Store)

### Prefijos de Claves
```typescript
// ✅ PREFIJOS OFICIALES
'agendamiento:'      // Agendamientos/reservas
'servicio:'          // Servicios completados (historial)
'cliente:'           // Clientes
'modelo:'            // Modelos
'usuario:'           // Usuarios del sistema
'pago:'              // Pagos
'multa:'             // Multas
'turno:'             // Turnos de trabajo
'gasto:'             // Gastos operativos
'asistencia:'        // Asistencia de modelos
'testimonio:'        // Testimonios
'video:'             // Videos
'producto:'          // Productos boutique
'chat:'              // Mensajes de chat

// ❌ NO USAR
// - appointment:, booking:, reservation:
// - service:, completed_service:
// - customer:, user:
```

### Formato de IDs
```typescript
// ✅ FORMATO OFICIAL
`${tipo}_${timestamp}_${random}`

// Ejemplos:
'agendamiento_1707401234567_a3f9d2'
'servicio_1707401234567_b7e2c1'
'cliente_1707401234567_c4d8f3'

// ❌ NO USAR
// - UUIDs completos
// - IDs numéricos secuenciales
```

---

## 📱 COMPONENTES

### Nomenclatura de Componentes
```typescript
// ✅ NOMBRES OFICIALES (PascalCase)
AgendamientosContext
ServiciosContext
ClientesContext
GestionClientesAdmin
ClienteStatusChecker
CrearAgendamientoModal
DetalleAgendamientoModal
CancelarAgendamientoModal

// ❌ NO USAR
// - AppointmentsContext
// - ServicesContext
// - CustomerManagement
```

### Nomenclatura de Archivos
```typescript
// ✅ NOMBRES OFICIALES
AgendamientosContext.tsx
ServiciosContext.tsx
ClientesContext.tsx
GestionClientesAdmin.tsx
ClienteStatusChecker.tsx

// ❌ NO USAR
// - appointmentsContext.tsx
// - services-context.tsx
// - customer_management.tsx
```

---

## 🔗 ENDPOINTS DEL SERVIDOR

### Rutas de API
```typescript
// ✅ RUTAS OFICIALES
GET    /make-server-9dadc017/agendamientos
POST   /make-server-9dadc017/agendamientos
PUT    /make-server-9dadc017/agendamientos/:id
DELETE /make-server-9dadc017/agendamientos/:id

GET    /make-server-9dadc017/servicios
POST   /make-server-9dadc017/servicios
PUT    /make-server-9dadc017/servicios/:id
POST   /make-server-9dadc017/servicios/desde-agendamiento

GET    /make-server-9dadc017/clientes
POST   /make-server-9dadc017/clientes
PUT    /make-server-9dadc017/clientes/:id

// ❌ NO USAR
// - /appointments, /bookings
// - /services, /completed-services
// - /customers, /users
```

---

## 🎨 ESTADOS Y VARIANTES

### Estados de UI
```typescript
// ✅ ESTADOS OFICIALES
'pendiente'     // Esperando confirmación/acción
'confirmado'    // Confirmado por el cliente
'completado'    // Servicio finalizado exitosamente
'cancelado'     // Cancelado por alguna de las partes
'no_show'       // Cliente no se presentó
'pagado'        // Pago completado
'reembolsado'   // Dinero devuelto

// ❌ NO USAR
// - pending, confirmed, completed
// - cancelled, missed, paid, refunded
```

---

## 📝 FUNCIONES Y MÉTODOS

### Nomenclatura de Funciones (camelCase)
```typescript
// ✅ NOMBRES OFICIALES

// Agendamientos
agregarAgendamiento()
actualizarAgendamiento()
eliminarAgendamiento()
obtenerAgendamientosPorModelo()
marcarComoCompletado()
marcarComoNoShow()
cancelarAgendamiento()

// Servicios
crearServicio()
crearServicioDesdeAgendamiento()
obtenerServiciosPorCliente()
obtenerNoShowsPorCliente()
contarNoShowsCliente()
obtenerMultasPendientesCliente()
calcularTotalMultasCliente()
aplicarMultaPorNoShow()
marcarMultaComoPagada()

// Clientes
obtenerOCrearCliente()
buscarPorTelefono()
bloquearCliente()
desbloquearCliente()

// ❌ NO USAR
// - addAppointment(), createBooking()
// - getServicesByCustomer()
// - blockUser(), banClient()
```

---

## 💬 MENSAJES Y LOGS

### Formato de Logs
```typescript
// ✅ FORMATO OFICIAL
console.log('✅ Agendamiento creado exitosamente');
console.log('❌ Error creando servicio:', error);
console.log('⚠️ No-show detectado para cliente');
console.log('💸 Multa automática aplicada');
console.log('🔄 Actualizando agendamiento');
console.log('📝 Creando servicio desde agendamiento');
console.log('🚫 Cliente bloqueado');

// Emojis por categoría:
// ✅ Éxito
// ❌ Error
// ⚠️ Advertencia
// 💸 Dinero/Multas
// 🔄 Actualización/Carga
// 📝 Creación/Escritura
// 🚫 Bloqueo/Prohibición
// 📅 Agendamiento/Fecha
// 👤 Cliente/Usuario
// 💃 Modelo
// 📊 Estadísticas
```

### Mensajes de Toast
```typescript
// ✅ MENSAJES OFICIALES (español)
toast.success('Agendamiento creado exitosamente');
toast.error('Error al crear agendamiento');
toast.warning('Cliente tiene multas pendientes');
toast.info('Servicio marcado como completado');

// ❌ NO USAR mensajes en inglés
// toast.success('Appointment created successfully');
```

---

## 🔐 ROLES Y PERMISOS

### Nombres de Roles
```typescript
// ✅ ROLES OFICIALES
'owner'        // Dueño del sistema (único)
'admin'        // Administrador
'programador'  // Desarrollador/soporte técnico
'modelo'       // Modelo trabajadora

// ❌ NO USAR
// - 'administrator', 'developer', 'model'
// - 'dueño', 'administrador', 'developer'
```

---

## 📐 MEDIDAS Y FORMATOS

### Formatos de Fecha y Hora
```typescript
// ✅ FORMATOS OFICIALES
fecha: 'YYYY-MM-DD'           // '2026-02-08'
hora: 'HH:MM'                 // '14:30' (formato 24h)
fechaCreacion: ISO 8601        // '2026-02-08T14:30:00.000Z'

// ❌ NO USAR
// - 'DD/MM/YYYY', 'MM-DD-YYYY'
// - '2:30 PM' (formato 12h)
```

### Moneda
```typescript
// ✅ FORMATO OFICIAL
monto: number;                 // Siempre en COP (pesos colombianos)
// Ejemplo: 250000 (no usar decimales para COP)

// Display
`$${monto.toLocaleString()}`   // '$250.000'
`$${(monto/1000).toFixed(0)}k` // '$250k'

// ❌ NO USAR
// - Decimales: 250000.00
// - Otros símbolos: COP 250.000, 250k COP
```

### Duración
```typescript
// ✅ FORMATO OFICIAL
duracionMinutos: number;       // Siempre en minutos
// Ejemplos: 60, 120, 180

// ❌ NO USAR
// - duracionHoras, duration_hours
// - Formato string: '1h', '2 horas'
```

---

## 🎯 CAMPOS COMUNES

### Campos de Auditoría
```typescript
// ✅ CAMPOS OFICIALES (siempre incluir)
fechaCreacion: string;         // Cuándo se creó el registro
creadoPor: string;             // Quién lo creó ('sistema' | email_usuario)
fechaActualizacion?: string;   // Última modificación
actualizadoPor?: string;       // Quién lo modificó

// ❌ NO USAR
// - createdAt, updatedAt, createdBy
// - timestamp, modified_date
```

### Campos de Estado
```typescript
// ✅ CAMPOS OFICIALES
estado: string;                // Estado principal del registro
activa: boolean;               // Para modelos
disponible: boolean;           // Para modelos
bloqueado: boolean;            // Para clientes

// ❌ NO USAR
// - status, active, available, blocked
// - is_active, is_available
```

---

## 🔔 NOTIFICACIONES

### Notificación
```typescript
// ✅ NOMBRES OFICIALES
interface Notificacion {
  id: string;
  
  // Destinatario
  usuarioId: string;            // ID del usuario que recibe
  usuarioEmail: string;         // Email del destinatario
  
  // Contenido
  tipo: TipoNotificacion;       // Tipo de notificación
  titulo: string;               // Título corto
  mensaje: string;              // Mensaje descriptivo
  icono?: string;               // Emoji o ícono
  
  // Estado
  leida: boolean;               // Si fue leída
  fechaLectura?: string;        // Cuándo se leyó
  
  // Acción
  accion?: AccionNotificacion;  // Acción al hacer click
  urlDestino?: string;          // URL a la que navega
  
  // Prioridad
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  
  // Metadatos
  fechaCreacion: string;
  creadoPor: string;
  expiraEn?: string;            // Fecha de expiración
}

// ❌ NO USAR
// - notification, alert, message
// - read, unread (usar: leida)
// Usar siempre: "notificacion" (con tilde solo en comentarios)
```

**Prefijo en KV Store**: `notificacion:`

### Tipos de Notificación
```typescript
// ✅ TIPOS OFICIALES
type TipoNotificacion = 
  | 'agendamiento_nuevo'        // Nuevo agendamiento creado
  | 'agendamiento_confirmado'   // Agendamiento confirmado
  | 'agendamiento_cancelado'    // Agendamiento cancelado
  | 'agendamiento_proximo'      // Recordatorio de cita próxima
  | 'servicio_completado'       // Servicio finalizado
  | 'servicio_calificado'       // Cliente calificó servicio
  | 'pago_recibido'             // Pago confirmado
  | 'pago_pendiente'            // Recordatorio de pago
  | 'multa_aplicada'            // Multa automática aplicada
  | 'multa_pagada'              // Multa pagada
  | 'cliente_bloqueado'         // Cliente bloqueado
  | 'modelo_disponible'         // Modelo se marcó como disponible
  | 'adelanto_aprobado'         // Adelanto aprobado
  | 'adelanto_rechazado'        // Adelanto rechazado
  | 'sistema'                   // Notificación del sistema
  | 'marketing';                // Mensaje promocional

// ❌ NO USAR
// - new_appointment, appointment_created
// - payment_received, fine_applied
```

### Acción de Notificación
```typescript
// ✅ ACCIONES OFICIALES
interface AccionNotificacion {
  tipo: 'navegar' | 'modal' | 'ninguna';
  destino?: string;             // URL o ID del modal
  datos?: Record<string, any>;  // Datos adicionales
}

// Ejemplos:
// - { tipo: 'navegar', destino: '/agendamientos' }
// - { tipo: 'modal', destino: 'DetalleAgendamientoModal', datos: { id: '123' } }
// - { tipo: 'ninguna' }
```

### Preferencias de Notificación
```typescript
// ✅ NOMBRES OFICIALES
interface PreferenciasNotificacion {
  usuarioId: string;
  
  // Canales activos
  enApp: boolean;               // Notificaciones in-app
  push: boolean;                // Push notifications (futuro)
  email: boolean;               // Email (futuro)
  sms: boolean;                 // SMS (futuro)
  
  // Por tipo de notificación
  notificarAgendamientos: boolean;
  notificarPagos: boolean;
  notificarMultas: boolean;
  notificarServicios: boolean;
  notificarSistema: boolean;
  notificarMarketing: boolean;
  
  // Configuración
  horaInicioSilencio?: string;  // Ej: '22:00'
  horaFinSilencio?: string;     // Ej: '08:00'
  diasSilencio?: string[];      // ['sabado', 'domingo']
  
  fechaActualizacion: string;
}

// ❌ NO USAR
// - preferences, settings, config
// - notify_appointments, enable_push
// Usar siempre: "preferencias" + nombre descriptivo
```

**Prefijo en KV Store**: `preferencias_notificacion:`

### Estados de Notificación
```typescript
// ✅ ESTADOS OFICIALES
leida: true | false            // Si fue leída

// ❌ NO USAR
// - read, unread, seen
// - is_read, has_been_read
// Usar siempre: "leida" (boolean)
```

### Prioridades
```typescript
// ✅ PRIORIDADES OFICIALES
type PrioridadNotificacion = 'baja' | 'media' | 'alta' | 'urgente';

// Uso recomendado:
// - 'baja': Marketing, tips, sugerencias
// - 'media': Confirmaciones, recordatorios normales
// - 'alta': Pagos, multas, cambios importantes
// - 'urgente': Bloqueos, problemas críticos, alertas

// ❌ NO USAR
// - low, medium, high, urgent
// - 1, 2, 3, 4
```

---

## 📊 ANALYTICS Y REPORTES

### Métricas y KPIs
```typescript
// ✅ NOMBRES OFICIALES
interface MetricasGenerales {
  // Ingresos
  ingresosDelDia: number;
  ingresosSemana: number;
  ingresosMes: number;
  ingresosAnio: number;
  
  // Servicios
  serviciosCompletadosHoy: number;
  serviciosCompletadosSemana: number;
  serviciosCompletadosMes: number;
  serviciosPromedioMes: number;
  
  // Clientes
  clientesActivosmes: number;
  clientesNuevosMes: number;
  clientesFrecuentes: number;      // 3+ servicios
  ticketPromedio: number;          // Gasto promedio por cliente
  
  // Modelos
  modelosActivas: number;
  modelosMasProductivas: ModeloMetrica[];
  promedioServiciosPorModelo: number;
  
  // Multas y No-Shows
  totalMultasMes: number;
  totalNoShowsMes: number;
  tasaNoShow: number;              // Porcentaje %
  multasPendientes: number;
  
  // Gastos
  gastosOperativosMes: number;
  utilidadNeta: number;            // Ingresos - Gastos
  margenUtilidad: number;          // Porcentaje %
}

// ❌ NO USAR
// - metrics, KPIs, statistics
// - revenue, income, earnings
// - average_ticket, avg_revenue
// Usar siempre: términos en español arriba listados
```

### Análisis por Modelo
```typescript
// ✅ NOMBRES OFICIALES
interface ModeloMetrica {
  modeloEmail: string;
  modeloNombre: string;
  
  // Servicios
  totalServicios: number;
  serviciosCompletados: number;
  serviciosCancelados: number;
  
  // Ingresos
  ingresosTotales: number;
  ingresosPromedioPorServicio: number;
  
  // Eficiencia
  tasaCompletacion: number;        // % servicios completados
  tasaCancelacion: number;         // % servicios cancelados
  
  // Calificaciones
  promedioCalificaciones: number;  // 1-5 estrellas
  totalResenas: number;
  
  // Periodo
  periodoInicio: string;
  periodoFin: string;
}

// ❌ NO USAR
// - model_metrics, performer_stats
// - completion_rate, cancellation_rate
```

### Análisis por Cliente
```typescript
// ✅ NOMBRES OFICIALES
interface ClienteMetrica {
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  
  // Servicios
  totalServicios: number;
  primeraVisita: string;
  ultimaVisita: string;
  
  // Gastos
  totalGastado: number;
  gastoPromedioPorServicio: number;
  
  // Fidelidad
  frecuenciaVisitas: number;       // Servicios por mes
  diasDesdeUltimaVisita: number;
  categoriaCliente: 'nuevo' | 'frecuente' | 'vip' | 'inactivo';
  
  // Multas
  totalNoShows: number;
  multasPendientes: number;
  bloqueado: boolean;
}

// ❌ NO USAR
// - customer_metrics, client_analytics
// - loyalty_score, visit_frequency
```

### Reporte Financiero
```typescript
// ✅ NOMBRES OFICIALES
interface ReporteFinanciero {
  periodo: string;               // 'diario' | 'semanal' | 'mensual' | 'anual'
  fechaInicio: string;
  fechaFin: string;
  
  // Ingresos desglosados
  ingresosPorServicios: number;
  ingresosPorPropinas: number;
  ingresosPorMultas: number;
  ingresosOtros: number;
  ingresosTotal: number;
  
  // Gastos desglosados
  gastosOperativos: number;
  gastosNomina: number;
  gastosMarketing: number;
  gastosOtros: number;
  gastosTotal: number;
  
  // Resultados
  utilidadBruta: number;         // Ingresos - Gastos
  margenBruto: number;           // % utilidad sobre ingresos
  
  // Proyecciones
  proyeccionMes?: number;
  tendencia: 'subiendo' | 'bajando' | 'estable';
  
  // Desglose por tipo de servicio
  ingresosSede: number;
  ingresosDomicilio: number;
}

// ❌ NO USAR
// - financial_report, revenue_breakdown
// - profit_margin, gross_profit
```

### Gráfica de Serie Temporal
```typescript
// ✅ NOMBRES OFICIALES
interface DatoSerieTemporal {
  fecha: string;                 // 'YYYY-MM-DD'
  valor: number;
  tipo: 'ingresos' | 'servicios' | 'clientes' | 'multas';
  metadata?: Record<string, any>;
}

// Para gráficas de barras/líneas
interface DatosGrafica {
  etiquetas: string[];           // Labels del eje X
  series: SerieGrafica[];        // Múltiples líneas/barras
}

interface SerieGrafica {
  nombre: string;                // Nombre de la serie
  datos: number[];               // Valores
  color?: string;                // Color de la serie
}

// ❌ NO USAR
// - chart_data, time_series_data
// - labels, dataset, series_name
```

### Comparativa de Períodos
```typescript
// ✅ NOMBRES OFICIALES
interface ComparativaPeriodos {
  periodoActual: {
    inicio: string;
    fin: string;
    valor: number;
  };
  periodoAnterior: {
    inicio: string;
    fin: string;
    valor: number;
  };
  
  // Comparación
  diferencia: number;            // Valor absoluto
  porcentajeCambio: number;      // % de cambio
  tendencia: 'mejor' | 'peor' | 'igual';
  
  metrica: string;               // Nombre de la métrica comparada
}

// ❌ NO USAR
// - period_comparison, comparative_analysis
// - percentage_change, trend_direction
```

### Filtros de Analytics
```typescript
// ✅ NOMBRES OFICIALES
interface FiltrosAnalytics {
  // Período
  fechaInicio: string;
  fechaFin: string;
  periodo: 'dia' | 'semana' | 'mes' | 'trimestre' | 'anio' | 'personalizado';
  
  // Segmentación
  modeloEmail?: string;          // Filtrar por modelo específica
  clienteId?: string;            // Filtrar por cliente específico
  tipoServicio?: 'sede' | 'domicilio' | 'todos';
  
  // Estado
  incluirCancelados?: boolean;
  incluirNoShows?: boolean;
  soloCompletados?: boolean;
}

// ❌ NO USAR
// - analytics_filters, date_range
// - custom_period, service_type_filter
```

### Contexto de Analytics
```typescript
// ✅ NOMBRES OFICIALES
AnalyticsContext         → useAnalytics()

// Funciones principales
obtenerMetricasGenerales()
obtenerMetricasPorModelo()
obtenerMetricasPorCliente()
obtenerReporteFinanciero()
obtenerDatosSerieTemporal()
compararPeriodos()
exportarReportePDF()
exportarReporteExcel()
calcularTendencia()
obtenerTopModelos()
obtenerTopClientes()

// ❌ NO USAR
// - getMetrics(), getAnalytics()
// - exportToPDF(), exportToExcel()
```

**Prefijo en KV Store**: `analytics:`

---

## 🚀 ACCIONES DEL USUARIO

### Verbos de Acción
```typescript
// ✅ VERBOS OFICIALES (español)
crear / agregar      // POST
actualizar           // PUT/PATCH
eliminar             // DELETE
obtener / buscar     // GET
marcar               // Cambiar estado
aplicar              // Ejecutar acción
calcular             // Computar valor
bloquear             // Deshabilitar
desbloquear          // Habilitar

// ❌ NO USAR
// - create, update, delete, get
// - add, modify, remove, fetch
```

---

## ✅ CHECKLIST DE CONSISTENCIA

Antes de crear un nuevo feature, verificar:

- [ ] ¿Usé los nombres de entidades del diccionario?
- [ ] ¿Los campos de la interfaz coinciden con los nombres oficiales?
- [ ] ¿Los prefijos de KV Store son correctos?
- [ ] ¿Los estados usan los valores oficiales?
- [ ] ¿Los logs usan los emojis apropiados?
- [ ] ¿Los mensajes al usuario están en español?
- [ ] ¿Las funciones usan verbos en español?
- [ ] ¿Los formatos de fecha/hora son correctos?
- [ ] ¿Los campos de auditoría están incluidos?
- [ ] ¿Las métricas y KPIs siguen la nomenclatura oficial? ✨ NUEVO

---

## 🔄 ACTUALIZACIONES

Para actualizar este diccionario:

1. Proponer cambio en comentario del PR
2. Discutir con el equipo
3. Actualizar este documento
4. Refactorizar código existente si es necesario
5. Actualizar fecha de "Última actualización"

---

## 📚 REFERENCIAS RÁPIDAS

### Entidades Principales
- **Agendamiento**: Reserva futura
- **Servicio**: Registro histórico inmutable
- **Cliente**: Usuario que consume servicios
- **Modelo**: Trabajadora que presta servicios
- **Multa**: Penalización económica por no_show
- **Pago**: Transacción monetaria
- **Tarifa**: Precio de un servicio
- **Analytics**: Métricas, KPIs y reportes del sistema ✨ NUEVO

### Relaciones
```
Cliente → hace → Agendamiento → con → Modelo
Agendamiento → al completarse crea → Servicio
Servicio (no_show) → puede generar → Multa
Cliente con muchas Multas → puede ser → Bloqueado
Analytics → analiza → Servicios + Pagos + Clientes + Modelos ✨ NUEVO
```

---

**Mantén este documento actualizado y úsalo como referencia única para toda nomenclatura del sistema.**