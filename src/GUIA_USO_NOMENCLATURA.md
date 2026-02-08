# 📘 Guía de Uso - Sistema de Nomenclatura

Esta guía explica cómo usar el sistema de nomenclatura en tu desarrollo diario.

---

## 📚 DOCUMENTOS DISPONIBLES

1. **`DICCIONARIO_NOMENCLATURA.md`** (Referencia Completa)
   - Definiciones exhaustivas
   - Ejemplos de código
   - Reglas y convenciones
   - **Usar cuando**: Implementas algo nuevo o tienes dudas

2. **`REFERENCIA_RAPIDA_NOMENCLATURA.md`** (Cheat Sheet)
   - Nombres más usados
   - Formatos comunes
   - Checklist express
   - **Usar cuando**: Desarrollo diario, necesitas consultar rápido

3. **`VALIDACION_NOMENCLATURA.md`** (Control de Calidad)
   - Archivos validados
   - Inconsistencias encontradas
   - Métricas de consistencia
   - **Usar cuando**: Code review, refactoring

4. **Este archivo** (Cómo Usar el Sistema)
   - Workflow de desarrollo
   - Buenas prácticas
   - Resolución de dudas

---

## 🔄 WORKFLOW DE DESARROLLO

### 1. Antes de Empezar un Feature

```bash
# 1. Consulta la referencia rápida
✅ Abre: REFERENCIA_RAPIDA_NOMENCLATURA.md
✅ Busca: Entidades que vas a usar
✅ Verifica: Estados, prefijos, funciones relacionadas

# 2. Si necesitas más detalle
✅ Abre: DICCIONARIO_NOMENCLATURA.md
✅ Lee: Sección completa de la entidad
✅ Revisa: Ejemplos de código
```

### 2. Durante el Desarrollo

```typescript
// ✅ CORRECTO - Usar nombres del diccionario
interface Servicio {
  id: string;
  clienteId: string;
  modeloEmail: string;
  estado: 'completado' | 'cancelado' | 'no_show';
  fechaCreacion: string;
  creadoPor: string;
}

// ❌ INCORRECTO - Inventar nombres
interface Service {
  id: string;
  customerId: string;
  modelEmail: string;
  status: 'done' | 'cancelled' | 'missed';
  createdAt: string;
  createdBy: string;
}
```

### 3. Al Escribir Funciones

```typescript
// ✅ CORRECTO - Verbo español + Entidad
function obtenerServiciosPorCliente(clienteId: string) { }
function marcarComoNoShow(agendamientoId: string) { }
function aplicarMultaPorNoShow(servicioId: string) { }

// ❌ INCORRECTO - Inglés o mezcla
function getServicesByCustomer(customerId: string) { }
function markAsNoShow(appointmentId: string) { }
function applyPenaltyForNoShow(serviceId: string) { }
```

### 4. Al Guardar en Base de Datos

```typescript
// ✅ CORRECTO - Usar prefijos oficiales
const key = `servicio:${servicioId}`;
const key = `agendamiento:${agendamientoId}`;
const key = `cliente:${clienteId}`;

// ❌ INCORRECTO - Prefijos incorrectos
const key = `service:${serviceId}`;
const key = `appointment:${appointmentId}`;
const key = `customer:${customerId}`;
```

### 5. Al Escribir Logs

```typescript
// ✅ CORRECTO - Emoji + Mensaje en español
console.log('✅ Servicio creado exitosamente');
console.log('❌ Error al obtener agendamientos:', error);
console.log('💸 Multa automática aplicada: $250.000');
console.log('🚫 Cliente bloqueado por múltiples no-shows');

// ❌ INCORRECTO - Sin emoji o en inglés
console.log('Service created successfully');
console.log('ERROR getting appointments:', error);
console.log('Automatic penalty applied: $250.000');
```

### 6. Al Crear Endpoints

```typescript
// ✅ CORRECTO - Rutas en español
app.get('/make-server-9dadc017/servicios', handler);
app.post('/make-server-9dadc017/agendamientos', handler);
app.put('/make-server-9dadc017/clientes/:id', handler);

// ❌ INCORRECTO - Rutas en inglés
app.get('/make-server-9dadc017/services', handler);
app.post('/make-server-9dadc017/appointments', handler);
app.put('/make-server-9dadc017/customers/:id', handler);
```

---

## 🤔 RESOLUCIÓN DE DUDAS

### "¿Cómo sé si un nombre es correcto?"

1. **Busca en REFERENCIA_RAPIDA_NOMENCLATURA.md**
   - Si está ahí → Úsalo tal cual
   - Si no está → Consulta el diccionario completo

2. **Busca en DICCIONARIO_NOMENCLATURA.md**
   - Si está definido → Úsalo
   - Si no está definido → Propón uno siguiendo las convenciones

### "¿Qué hago si necesito un nombre que no existe?"

```markdown
1. Verifica que realmente no existe en el diccionario
2. Sigue las convenciones del diccionario:
   - Español para dominio del negocio
   - camelCase para variables/funciones
   - PascalCase para componentes/tipos
   - snake_case para estados (ej: no_show)
3. Documenta el nuevo término en un comentario
4. Propón agregarlo al diccionario en tu PR
```

### "¿Español o inglés?"

```typescript
// Regla general:
// - Dominio del negocio (entidades, estados): ESPAÑOL
// - Código genérico (componentes React): ESPAÑOL si es del dominio
// - Librerías/externos: Seguir convención de la librería

✅ Español (dominio del negocio):
- agendamiento, servicio, cliente, modelo
- pendiente, completado, cancelado
- sede, domicilio

✅ Inglés (cuando es genérico o estándar):
- id, email, password
- timestamp (pero preferir "fecha")
- status → CAMBIAR A "estado"

❌ Mezcla inconsistente:
- appointmentCompletado
- serviceCancelado
- clienteEmail → ✅ OK porque email es estándar
```

---

## 🔍 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Crear Nueva Entidad

```typescript
// ❓ Necesito crear una entidad "Reseña"

// 1. Consultar diccionario - No existe
// 2. Seguir convenciones:

✅ CORRECTO:
interface Resena {  // Español sin tilde por TypeScript
  id: string;
  clienteId: string;
  modeloEmail: string;
  calificacion: number;  // 1-5
  comentario: string;
  fecha: string;
  // Campos de auditoría obligatorios
  fechaCreacion: string;
  creadoPor: string;
}

const key = `resena:${resenaId}`;

// 3. Documentar en PR para agregar al diccionario
```

### Ejemplo 2: Crear Nueva Función

```typescript
// ❓ Necesito una función para obtener reseñas de una modelo

// 1. Seguir patrón: verbo + recurso + filtro
✅ CORRECTO:
function obtenerResenasPorModelo(modeloEmail: string): Resena[] {
  console.log('📊 Obteniendo reseñas de modelo:', modeloEmail);
  // ...
}

❌ INCORRECTO:
function getModelReviews(modelEmail: string): Review[] {
  console.log('Getting reviews for model:', modelEmail);
  // ...
}
```

### Ejemplo 3: Manejar Estados

```typescript
// ❓ Mi servicio puede estar en varios estados

✅ CORRECTO:
type EstadoServicio = 'completado' | 'cancelado' | 'no_show';

const servicio: Servicio = {
  id: 'servicio_123',
  estado: 'completado',  // Todo en minúsculas
  // ...
};

if (servicio.estado === 'no_show') {  // Guion bajo
  console.log('⚠️ Cliente no se presentó');
}

❌ INCORRECTO:
type ServiceStatus = 'completed' | 'cancelled' | 'noShow';

const service = {
  status: 'completed',  // En inglés
};

if (service.status === 'noShow') {  // camelCase incorrecto
  console.log('Customer missed appointment');
}
```

---

## ✅ CHECKLIST DE CODE REVIEW

Cuando revises código (tuyo o de otros), verifica:

### Nombres de Variables y Funciones
- [ ] ¿Usan nombres del diccionario?
- [ ] ¿Siguen camelCase en español?
- [ ] ¿Los verbos están en español?

### Tipos e Interfaces
- [ ] ¿Usan PascalCase?
- [ ] ¿Los campos usan nombres oficiales?
- [ ] ¿Incluyen campos de auditoría?

### Estados y Enums
- [ ] ¿Usan valores en minúsculas?
- [ ] ¿Están en español?
- [ ] ¿Son valores oficiales del diccionario?

### Base de Datos
- [ ] ¿Usan prefijos oficiales?
- [ ] ¿Los IDs siguen el formato estándar?

### Logs y Mensajes
- [ ] ¿Tienen emojis apropiados?
- [ ] ¿Están en español?
- [ ] ¿Son descriptivos?

### Endpoints
- [ ] ¿Siguen el formato oficial?
- [ ] ¿Usan nombres de recursos en español?

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error 1: Mezclar Inglés y Español
```typescript
❌ INCORRECTO:
const servicio = {
  id: 'serv_123',
  customerName: 'Juan',      // Inglés
  modeloEmail: 'maria@x.com', // Español
  status: 'completed'         // Inglés
};

✅ CORRECTO:
const servicio = {
  id: 'servicio_123',
  clienteNombre: 'Juan',
  modeloEmail: 'maria@x.com',
  estado: 'completado'
};
```

### Error 2: Estados Inconsistentes
```typescript
❌ INCORRECTO:
estado: 'Completado'  // Mayúscula
estado: 'COMPLETADO'  // Todo mayúscula
estado: 'done'        // Inglés

✅ CORRECTO:
estado: 'completado'  // Minúscula, español
```

### Error 3: Prefijos Incorrectos
```typescript
❌ INCORRECTO:
'service:123'
'srv:123'
'serv:123'

✅ CORRECTO:
'servicio:servicio_1707401234567_a3f9d2'
```

### Error 4: Funciones Sin Verbo
```typescript
❌ INCORRECTO:
serviciosPorCliente(id)
clienteMultas(id)

✅ CORRECTO:
obtenerServiciosPorCliente(id)
obtenerMultasCliente(id)
```

---

## 📈 MANTENER LA CONSISTENCIA

### Al Agregar Código Nuevo
1. Consultar referencias antes de empezar
2. Usar nombres existentes cuando sea posible
3. Seguir convenciones si creas nombres nuevos
4. Documentar nombres nuevos en PR

### Al Refactorizar
1. Identificar inconsistencias
2. Buscar nombre correcto en diccionario
3. Reemplazar en todos los lugares
4. Actualizar VALIDACION_NOMENCLATURA.md

### Al Revisar PRs
1. Verificar nomenclatura con checklist
2. Señalar desviaciones del diccionario
3. Proponer correcciones
4. Aprobar solo si es consistente

---

## 🎯 BENEFICIOS DE SEGUIR EL SISTEMA

1. **Código más legible**: Todos entienden los mismos términos
2. **Menos bugs**: No confundir entidades similares
3. **Onboarding más rápido**: Nuevos devs aprenden rápido
4. **Búsqueda eficiente**: Encontrar código por nombre
5. **Refactoring seguro**: Cambios globales sin ambigüedad
6. **Mantenimiento fácil**: Código predecible y estándar

---

## 📞 ¿DUDAS O SUGERENCIAS?

1. **Duda sobre un nombre**: Consulta DICCIONARIO_NOMENCLATURA.md
2. **Nombre no existe**: Propón uno en tu PR
3. **Inconsistencia encontrada**: Documenta en VALIDACION_NOMENCLATURA.md
4. **Mejora al sistema**: Actualiza este archivo

---

## 🎓 RESUMEN PARA NUEVOS DESARROLLADORES

1. **Lee primero**: REFERENCIA_RAPIDA_NOMENCLATURA.md (5 min)
2. **Usa siempre**: Nombres del diccionario
3. **Cuando dudes**: Consulta DICCIONARIO_NOMENCLATURA.md
4. **Antes de PR**: Verifica con checklist de este documento
5. **Mantén actualizado**: Propón mejoras cuando encuentres casos no cubiertos

---

**El sistema solo funciona si todos lo seguimos. ¡Hagámoslo juntos! 🚀**
