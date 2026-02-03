# Convenciones de Nombres - Black Diamond App

Este documento define las convenciones de nombres para campos y propiedades en la aplicación para mantener consistencia en todo el código.

## 📋 Tabla `usuarios` en Supabase

Los campos de la tabla `usuarios` usan **inglés** para mantener consistencia con Supabase Auth:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID del usuario (debe coincidir con Auth) |
| `email` | string | Email del usuario |
| `nombre` | string | Nombre completo |
| `role` | string | Rol del usuario (owner, admin, modelo, programador) |
| `activo` | boolean | Si el usuario está activo |
| `created_at` | timestamp | Fecha de creación |

### ⚠️ IMPORTANTE: Es `role` NO `rol`

Aunque el resto de la aplicación está en español, el campo del rol en la base de datos es **`role`** (en inglés).

## 🔑 Interface CurrentUser

```typescript
interface CurrentUser {
  accessToken: string;  // Token de sesión de Supabase Auth
  userId: string;       // UUID del usuario
  email: string;        // Email del usuario
  role: string;         // Rol: 'owner' | 'admin' | 'modelo' | 'programador'
}
```

## 📦 Props de Dashboards

### OwnerDashboard, AdminDashboard, ModeloDashboard

```typescript
interface DashboardProps {
  accessToken: string;
  userId: string;
  onLogout?: () => void;
}
```

### ProgramadorDashboard

```typescript
interface ProgramadorDashboardProps {
  user: CurrentUser;  // Objeto completo del usuario
  onLogout?: () => void;
}
```

## 🔐 LoginForm

```typescript
interface LoginFormProps {
  onLogin: (accessToken: string, userId: string, email: string, role: string) => void;
  onBackToLanding?: () => void;
}
```

## 🎯 Valores válidos de `role`

Los roles deben ser exactamente (en minúsculas):

- `'owner'` - Propietario del sistema, acceso total
- `'admin'` - Administrador de sede
- `'modelo'` - Panel de modelo
- `'programador'` - Panel de desarrollador/soporte técnico

## ✅ Ejemplos de uso correcto

### Consultar usuario por ID
```typescript
const { data, error } = await supabase
  .from('usuarios')
  .select('role')
  .eq('id', userId)
  .single();

const userRole = data?.role; // ✅ Correcto: 'role' no 'rol'
```

### Crear nuevo usuario
```typescript
const { data, error } = await supabase
  .from('usuarios')
  .insert({
    id: authUser.id,
    email: 'user@example.com',
    nombre: 'Nombre Usuario',
    role: 'admin',  // ✅ Correcto: 'role' no 'rol'
    activo: true
  });
```

### Filtrar por rol
```typescript
const { data, error } = await supabase
  .from('usuarios')
  .select('*')
  .eq('role', 'owner');  // ✅ Correcto: 'role' no 'rol'
```

## ❌ Errores comunes

```typescript
// ❌ INCORRECTO - No uses 'rol' en español
const { data } = await supabase
  .from('usuarios')
  .select('rol')  // ❌ Error: el campo se llama 'role'
  .eq('id', userId);

// ❌ INCORRECTO - No uses 'rol' al insertar
await supabase
  .from('usuarios')
  .insert({
    rol: 'admin'  // ❌ Error: debe ser 'role'
  });
```

## 📝 Notas adicionales

1. **Supabase Auth** usa campos en inglés por defecto, por eso mantenemos `role` en inglés
2. Otros campos como `nombre`, `activo` están en español porque son propios de nuestra aplicación
3. Al hacer queries, siempre usa `role` no `rol`
4. Los valores del rol (owner, admin, etc.) van en minúsculas
5. Mantén esta convención en todo el código para evitar errores

## 🔍 Verificación

Si tienes dudas sobre qué nombre usar, consulta estos archivos de referencia:
- `/components/GestionUsuariosPanel.tsx` - Ejemplo de creación de usuarios
- `/components/CrearModeloModal.tsx` - Ejemplo de creación de modelos
- `/src/app/components/LoginForm.tsx` - Ejemplo de login y consulta de rol
- `/src/App.tsx` - Ejemplo de manejo de usuario actual
