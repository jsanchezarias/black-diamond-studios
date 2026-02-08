# 🚀 Referencia Rápida - Nomenclatura Black Diamond

**Consulta rápida para desarrollo diario**

---

## 📦 ENTIDADES PRINCIPALES

```typescript
// ✅ SIEMPRE USA ESTOS NOMBRES

Agendamiento  // Reserva futura
Servicio      // Registro histórico inmutable  
Cliente       // Usuario que consume
Modelo        // Trabajadora que presta servicios
Multa         // Penalización económica
Pago          // Transacción monetaria
Tarifa        // Precio de servicio
```

---

## 📊 ESTADOS COMUNES

```typescript
// Agendamientos
'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'no_show'

// Servicios
'completado' | 'cancelado' | 'no_show'

// Pagos
'pendiente' | 'pagado' | 'reembolsado'

// Tipo Servicio
'sede' | 'domicilio'
```

---

## 🗄️ PREFIJOS KV STORE

```typescript
'agendamiento:'   // Reservas futuras
'servicio:'       // Historial de servicios
'cliente:'        // Clientes
'modelo:'         // Modelos
'pago:'           // Pagos
'multa:'          // Multas
```

---

## 🎯 CONTEXTOS Y HOOKS

```typescript
AgendamientosContext → useAgendamientos()
ServiciosContext     → useServicios()
ClientesContext      → useClientes()
ModelosContext       → useModelos()
PagosContext         → usePagos()
MultasContext        → useMultas()
```

---

## 🔗 ENDPOINTS PRINCIPALES

```typescript
// Agendamientos
GET    /make-server-9dadc017/agendamientos
POST   /make-server-9dadc017/agendamientos
PUT    /make-server-9dadc017/agendamientos/:id
DELETE /make-server-9dadc017/agendamientos/:id

// Servicios
GET    /make-server-9dadc017/servicios
POST   /make-server-9dadc017/servicios
PUT    /make-server-9dadc017/servicios/:id
POST   /make-server-9dadc017/servicios/desde-agendamiento
```

---

## 💬 EMOJIS DE LOGS

```typescript
✅  Éxito
❌  Error
⚠️  Advertencia
💸  Dinero/Multas
🔄  Actualización/Carga
📝  Creación/Escritura
🚫  Bloqueo/Prohibición
📅  Agendamiento/Fecha
👤  Cliente/Usuario
💃  Modelo
📊  Estadísticas
```

---

## 🎨 FUNCIONES COMUNES

```typescript
// Agendamientos
agregarAgendamiento()
actualizarAgendamiento()
eliminarAgendamiento()
marcarComoCompletado()
marcarComoNoShow()
cancelarAgendamiento()

// Servicios
crearServicio()
crearServicioDesdeAgendamiento()
obtenerServiciosPorCliente()
obtenerNoShowsPorCliente()
aplicarMultaPorNoShow()
marcarMultaComoPagada()

// Clientes
obtenerOCrearCliente()
buscarPorTelefono()
bloquearCliente()
desbloquearCliente()
```

---

## 📅 FORMATOS

```typescript
// Fechas
fecha: 'YYYY-MM-DD'          // '2026-02-08'
hora: 'HH:MM'                // '14:30'
fechaCreacion: ISO 8601      // '2026-02-08T14:30:00.000Z'

// Moneda (COP)
monto: 250000                // Sin decimales
display: '$250.000'          // Con puntos de mil
display: '$250k'             // Formato corto

// Duración
duracionMinutos: 60          // Siempre en minutos
```

---

## 🏷️ CAMPOS DE AUDITORÍA

```typescript
// SIEMPRE INCLUIR en nuevas entidades
{
  fechaCreacion: string;      // ISO 8601
  creadoPor: string;          // 'sistema' | email_usuario
  fechaActualizacion?: string;
  actualizadoPor?: string;
}
```

---

## ✅ CHECKLIST EXPRESS

Antes de commitear:
- [ ] Nombres de entidades del diccionario
- [ ] Estados en minúsculas español
- [ ] Prefijos KV Store correctos
- [ ] Funciones en camelCase español
- [ ] Logs con emojis apropiados
- [ ] Mensajes en español
- [ ] Campos de auditoría incluidos

---

## 🆘 AYUDA RÁPIDA

**¿Cómo se llama?**
- ❌ appointment → ✅ agendamiento
- ❌ service → ✅ servicio
- ❌ customer → ✅ cliente
- ❌ model → ✅ modelo
- ❌ penalty → ✅ multa
- ❌ noShow → ✅ no_show
- ❌ blocked → ✅ bloqueado

**¿Qué estado uso?**
- ❌ pending → ✅ pendiente
- ❌ completed → ✅ completado
- ❌ cancelled → ✅ cancelado
- ❌ paid → ✅ pagado

**¿Qué prefijo KV?**
- Reserva futura → `agendamiento:`
- Historial → `servicio:`
- Usuario consumidor → `cliente:`
- Trabajadora → `modelo:`

---

**📖 Documentación completa**: `/DICCIONARIO_NOMENCLATURA.md`  
**✅ Validación**: `/VALIDACION_NOMENCLATURA.md`
