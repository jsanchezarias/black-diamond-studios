/**
 * 🌍 UTILIDAD DE TRADUCCIÓN DE ERRORES DE SUPABASE
 * Mapea mensajes de error técnicos a mensajes amigables en español para el usuario.
 */

export function translateSupabaseError(error: any): string {
  if (!error) return 'Ocurrió un error inesperado';
  
  // Extraer el mensaje original
  const rawMessage = (typeof error === 'string' ? error : error.message || error.error_description || '').toLowerCase();
  const code = error.code || '';

  // --- Errores de Autenticación (Auth) ---
  if (rawMessage.includes('invalid login credentials') || rawMessage.includes('invalid credentials')) {
    return 'El email o la contraseña son incorrectos.';
  }
  if (rawMessage.includes('email not confirmed')) {
    return 'Tu correo electrónico aún no ha sido verificado. Por favor revisa tu bandeja de entrada.';
  }
  if (rawMessage.includes('user already registered') || rawMessage.includes('already been registered')) {
    return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
  }
  if (rawMessage.includes('invalid email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (rawMessage.includes('password is too short') || rawMessage.includes('password should be at least')) {
    return 'La contraseña es demasiado corta. Debe tener al menos 6 caracteres.';
  }
  if (rawMessage.includes('too many requests') || code === 'over_request_rate_limit') {
    return 'Demasiados intentos. Por favor, espera un momento antes de intentar de nuevo.';
  }
  if (rawMessage.includes('network request failed')) {
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
  }

  // --- Errores de Base de Datos (Postgres/RLS) ---
  if (code === '23505') { // unique_violation
    if (rawMessage.includes('telefono')) return 'Este número de teléfono ya está en uso.';
    if (rawMessage.includes('email')) return 'Este correo ya está registrado.';
    return 'Ya existe un registro con estos datos.';
  }
  if (code === '42501') { // insufficient_privilege (RLS)
    return 'No tienes permisos para realizar esta acción.';
  }
  if (code === '23503') { // foreign_key_violation
    return 'Error de referencia: algunos datos relacionados no existen.';
  }

  // --- Errores Generales ---
  if (rawMessage.includes('database error')) {
    return 'Error interno del servidor. Por favor intenta de nuevo en unos minutos.';
  }
  if (rawMessage.includes('unexpected error')) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }

  // Si no hay match, retornar un mensaje genérico pero profesional
  return 'No pudimos procesar tu solicitud. Por favor verifica los datos e intenta de nuevo.';
}
