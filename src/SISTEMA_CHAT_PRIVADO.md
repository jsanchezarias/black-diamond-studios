# Sistema de Chat Privado - Black Diamond App

## 🔒 Características de Privacidad Implementadas

### 1. Cierre de Sesión Automático
✅ **Cuando el usuario cierra la pestaña o abandona la página:**
- La sesión se cierra automáticamente usando `beforeunload` y `unload` events
- Se usa `navigator.sendBeacon()` para garantizar que la solicitud se envíe incluso si la página se cierra
- El usuario NO queda conectado indefinidamente

### 2. Chat Privado por Usuario
✅ **Cada usuario solo ve SUS propios mensajes:**
- Usuario normal: Solo ve mensajes del sistema + sus mensajes con el programador
- Programador: Ve TODOS los mensajes (para poder moderar/responder)
- NO hay chat público visible para todos

### 3. Archivo de Conversaciones
✅ **Al cerrar sesión (manual o automática):**
1. Se obtienen todos los mensajes del cliente
2. Se formatean en un texto con fechas y remitentes
3. Se guardan en el campo `ultima_conversacion` de la tabla `clientes`
4. Se guardan con timestamp en `ultima_conversacion_fecha`
5. **Se eliminan los mensajes de la tabla activa `chat_mensajes_publicos`**

### 4. Chat Limpio en Cada Visita
✅ **Cada vez que un usuario inicia sesión:**
- Ve un chat vacío (solo mensaje de bienvenida del sistema)
- No ve conversaciones anteriores
- Sus conversaciones anteriores están archivadas en su historial de cliente

### 5. Indicador Visual de Privacidad
✅ **Los usuarios ven un banner que dice:**
```
🛡️ Chat Privado
Solo tú y nuestro equipo pueden ver esta conversación
```

## 📋 Estructura de Base de Datos Requerida

### Tabla `clientes`
Debe tener estos campos adicionales:
```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultima_conversacion TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultima_conversacion_fecha TIMESTAMPTZ;
```

### Tabla `chat_mensajes_publicos`
Ya existe, pero asegúrate de que tenga:
- `id` (UUID, PK)
- `sender_id` (UUID, FK a clientes)
- `receiver_id` (UUID, FK a clientes, puede ser NULL)
- `message` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `is_read` (BOOLEAN)
- `role` (TEXT: 'user' | 'programador' | 'system')
- `color` (TEXT)

## 🔧 Funciones Principales

### `archivarConversacion(clienteId: string)`
Ubicación: `/src/app/components/PublicUsersContext.tsx`

**Qué hace:**
1. Obtiene todos los mensajes donde `sender_id = clienteId` O `receiver_id = clienteId`
2. Los formatea como texto plano con timestamps
3. Los guarda en `clientes.ultima_conversacion`
4. Elimina los mensajes de `chat_mensajes_publicos`

**Cuándo se ejecuta:**
- Al hacer logout manual (botón de cerrar sesión)
- Al abandonar la página (beforeunload)

### `getVisibleMessages()`
Ubicación: `/src/app/components/PublicUsersContext.tsx`

**Lógica de filtrado:**
```typescript
if (!currentUser) {
  // Usuario no autenticado: solo mensajes del sistema
  return messages.filter(msg => msg.role === 'system');
}

if (currentUser.role === 'programador') {
  // Programadora ve TODOS los mensajes
  return messages;
}

// Usuario normal: solo sistema + su conversación privada
return messages.filter(msg => 
  msg.role === 'system' ||
  msg.userId === currentUser.id ||
  msg.receiverId === currentUser.id
);
```

## 🎯 Flujo de Usuario

### Flujo Normal de Cliente:
1. Cliente hace login → ve chat vacío + banner de privacidad
2. Cliente envía mensaje → se guarda en BD con su `sender_id`
3. Programador ve el mensaje y responde
4. Cliente ve solo sus mensajes y respuestas del programador
5. Cliente cierra la página → conversación se archiva y se limpia automáticamente

### Flujo de Programador:
1. Programador hace login
2. Ve TODAS las conversaciones activas
3. Puede responder a cualquier cliente
4. NO ve el banner de "Chat Privado" (porque tiene acceso completo)

## 📝 Ver Historial de Conversaciones

### Desde el Panel de Admin/Owner:

Para ver las conversaciones archivadas de un cliente, puedes consultarlas desde el panel de gestión de clientes:

```typescript
// Obtener historial de un cliente
const { data: cliente, error } = await supabase
  .from('clientes')
  .select('nombre, telefono, ultima_conversacion, ultima_conversacion_fecha')
  .eq('id', clienteId)
  .single();

if (cliente?.ultima_conversacion) {
  console.log('Última conversación:');
  console.log(cliente.ultima_conversacion);
  console.log('Fecha:', cliente.ultima_conversacion_fecha);
}
```

### Formato del Historial Archivado:
```
[3/2/2026, 10:30:45 a.m.] Cliente Name: Hola, necesito información
[3/2/2026, 10:31:12 a.m.] Programador: ¡Hola! ¿En qué puedo ayudarte?
[3/2/2026, 10:32:05 a.m.] Cliente Name: Quiero agendar una cita
[3/2/2026, 10:32:30 a.m.] Programador: Perfecto, te ayudo con eso
```

## ⚠️ Notas Importantes

### Seguridad:
1. ✅ Los chats NO son públicos
2. ✅ Cada usuario solo ve SU conversación
3. ✅ Las conversaciones se archivan antes de eliminar
4. ✅ El programador tiene acceso completo para soporte

### Privacidad:
1. ✅ Los mensajes NO persisten indefinidamente en el chat
2. ✅ El historial está en el perfil del cliente (NO público)
3. ✅ Las sesiones se cierran automáticamente
4. ✅ Indicador visual claro de privacidad

### Backup:
1. ✅ Todas las conversaciones se archivan antes de eliminar
2. ✅ Se puede acceder al historial desde el perfil del cliente
3. ✅ El timestamp permite saber cuándo fue la última conversación

## 🔍 Debugging

### Ver mensajes en consola:
```javascript
// Al cerrar sesión
🚪 Cerrando sesión...
📦 Archivando conversación del cliente: [UUID]
✅ Conversación archivada exitosamente
✅ Mensajes eliminados de chat activo
✅ Sesión cerrada exitosamente
```

### Ver mensajes al abandonar la página:
```javascript
🚪 Usuario abandonando la página, cerrando sesión...
```

## 📊 Estado Actual vs Anterior

### ❌ ANTES (Problemático):
- Chat público visible para todos
- Sesiones abiertas indefinidamente
- Mensajes persistían para siempre
- No había archivo de conversaciones
- No había indicador de privacidad

### ✅ AHORA (Correcto):
- Chat privado por usuario
- Cierre automático al abandonar
- Mensajes se limpian al cerrar sesión
- Conversaciones archivadas en historial del cliente
- Indicador visual de privacidad
- Banner claro: "Solo tú y nuestro equipo pueden ver esta conversación"

## 🎨 Componentes Modificados

1. **`/src/app/components/PublicUsersContext.tsx`**
   - Agregado: `archivarConversacion()`
   - Modificado: `logout()` para archivar antes de cerrar
   - Agregado: Event listeners para `beforeunload` y `unload`
   - Modificado: `getVisibleMessages()` ya existía con lógica correcta

2. **`/src/app/components/LiveChat.tsx`**
   - Agregado: Importación de iconos `Shield` y `Lock`
   - Agregado: Banner de "Chat Privado" para usuarios normales
   - Mantenido: Botón de logout existente

## 🚀 Próximos Pasos Recomendados

1. **Agregar RLS (Row Level Security) en Supabase:**
   ```sql
   -- Solo permitir que cada cliente vea sus propios mensajes
   CREATE POLICY "Clientes solo ven sus mensajes"
   ON chat_mensajes_publicos
   FOR SELECT
   USING (
     auth.uid() = sender_id 
     OR auth.uid() = receiver_id
   );
   ```

2. **Agregar panel de historial en Admin Dashboard:**
   - Ver conversaciones archivadas por cliente
   - Búsqueda por fecha
   - Exportar conversaciones

3. **Notificaciones en tiempo real:**
   - Notificar al programador cuando hay nuevo mensaje
   - Badge con número de conversaciones sin leer

4. **Límite de tiempo de archivo:**
   - Auto-eliminar conversaciones muy antiguas (ej: después de 1 año)
   - Política de retención configurable
