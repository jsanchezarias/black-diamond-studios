# Crear Usuario Owner en Supabase

Si al iniciar sesión ves una pantalla negra, probablemente tu usuario no está correctamente configurado en Supabase. Sigue estos pasos para solucionarlo:

## Opción 1: Desde la consola del navegador (Recomendado)

1. Abre la consola del navegador (F12)
2. Pega el siguiente código:

```javascript
// Importar cliente de Supabase
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

const supabase = createClient(
  'https://kzdjravwcjummegxxrkd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZGpyYXZ3Y2p1bW1lZ3h4cmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzY4ODIsImV4cCI6MjA4MzM1Mjg4Mn0.xC2QDsAzhYRRg8yakyRTChzHL_bleIT-u9mtKlNeBpc'
);

// 1. Crear usuario en Auth
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'owner@blackdiamond.com',
  password: 'owner123456',
  options: {
    emailRedirectTo: undefined,
    data: {}
  }
});

if (authError) {
  console.error('Error creando usuario en Auth:', authError);
} else {
  console.log('✅ Usuario creado en Auth:', authData);
  
  // 2. Agregar usuario a tabla usuarios con rol owner
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .insert({
      id: authData.user.id,
      email: 'owner@blackdiamond.com',
      role: 'owner',
      nombre: 'Owner',
      activo: true
    })
    .select()
    .single();
  
  if (userError) {
    console.error('❌ Error agregando usuario a tabla usuarios:', userError);
  } else {
    console.log('✅ Usuario agregado a tabla usuarios:', userData);
    console.log('');
    console.log('============================================');
    console.log('✅ ¡USUARIO CREADO EXITOSAMENTE!');
    console.log('Email: owner@blackdiamond.com');
    console.log('Contraseña: owner123456');
    console.log('Rol: owner');
    console.log('============================================');
  }
}
```

## Opción 2: Desde Supabase Dashboard

### Paso 1: Crear usuario en Authentication
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/kzdjravwcjummegxxrkd
2. Ve a **Authentication** → **Users**
3. Click en **Add User** → **Create new user**
4. Ingresa:
   - Email: `owner@blackdiamond.com`
   - Password: `owner123456`
   - Auto Confirm User: **✓** (activado)
5. Click en **Create user**

### Paso 2: Agregar usuario a tabla usuarios
1. Ve a **Table Editor** → selecciona la tabla **usuarios**
2. Click en **Insert** → **Insert row**
3. Ingresa los siguientes valores:
   - **id**: (copia el UUID del usuario que creaste en el paso 1)
   - **email**: `owner@blackdiamond.com`
   - **role**: `owner`
   - **nombre**: `Owner`
   - **activo**: `true`
4. Click en **Save**

## Verificar que funcionó

1. Abre la aplicación y haz click en "Acceder al Sistema"
2. Ingresa las credenciales:
   - Email: `owner@blackdiamond.com`
   - Contraseña: `owner123456`
3. Deberías ver el Owner Dashboard

## Solución de problemas

### Error: "Usuario sin rol asignado"
- Verifica que el usuario esté en la tabla `usuarios` con el campo `role` = `owner`
- El campo `id` en la tabla `usuarios` debe coincidir con el `id` del usuario en Auth

### Error: "No se pudo obtener el rol del usuario"
- Verifica que la tabla `usuarios` exista
- Verifica que tenga el campo `role` (en inglés)
- Verifica los permisos RLS (Row Level Security) de la tabla

### Pantalla negra después del login
- Abre la consola del navegador (F12) y busca errores
- Verifica que el rol sea exactamente `owner` (en minúsculas)
- Verifica que los logs en consola muestren: `🔍 Role detectado: owner`

## Crear usuarios para otros roles

Para crear usuarios con otros roles, cambia el campo `role` a uno de estos valores:
- `owner` - Acceso total al sistema
- `admin` - Administrador de la sede
- `modelo` - Panel de modelo
- `programador` - Panel técnico/desarrollador