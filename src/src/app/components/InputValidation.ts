// 🛡️ SISTEMA DE VALIDACIÓN Y SANITIZACIÓN DE INPUTS
// Prevención de inyecciones y validaciones de seguridad

/**
 * 🧹 Sanitiza texto general eliminando caracteres peligrosos
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    // Eliminar caracteres de control peligrosos
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Escapar HTML básico
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 📧 Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * 📱 Valida y formatea número de teléfono colombiano
 */
export function validatePhoneColombia(phone: string): { isValid: boolean; formatted: string; error?: string } {
  if (!phone) {
    return { isValid: false, formatted: '', error: 'Número de teléfono requerido' };
  }
  
  // Remover espacios, guiones y paréntesis
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Validar que solo contenga números y el símbolo +
  if (!/^[\+]?[0-9]+$/.test(cleaned)) {
    return { isValid: false, formatted: '', error: 'El número solo debe contener dígitos' };
  }
  
  // Formato de celular colombiano: 10 dígitos (300-350)
  if (/^3[0-5][0-9]{8}$/.test(cleaned)) {
    return { isValid: true, formatted: cleaned };
  }
  
  // Formato con código de país (+57)
  if (/^\+57[0-9]{10}$/.test(cleaned)) {
    return { isValid: true, formatted: cleaned.substring(3) }; // Remover +57
  }
  
  // Formato corto sin el 3
  if (/^[0-5][0-9]{8}$/.test(cleaned)) {
    return { isValid: true, formatted: '3' + cleaned };
  }
  
  return { 
    isValid: false, 
    formatted: '', 
    error: 'Formato inválido. Debe ser un celular colombiano válido (Ej: 3001234567)' 
  };
}

/**
 * 💰 Valida y sanitiza valores monetarios
 */
export function validateMoneyAmount(amount: string | number): { isValid: boolean; value: number; error?: string } {
  const numValue = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  
  if (isNaN(numValue)) {
    return { isValid: false, value: 0, error: 'Monto inválido' };
  }
  
  if (numValue < 0) {
    return { isValid: false, value: 0, error: 'El monto no puede ser negativo' };
  }
  
  if (numValue > 999999999) {
    return { isValid: false, value: 0, error: 'El monto es demasiado grande' };
  }
  
  // Redondear a 2 decimales
  const rounded = Math.round(numValue * 100) / 100;
  
  return { isValid: true, value: rounded };
}

/**
 * 🔢 Valida números enteros positivos
 */
export function validatePositiveInteger(value: string | number): { isValid: boolean; value: number; error?: string } {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, value: 0, error: 'Debe ser un número válido' };
  }
  
  if (numValue < 0) {
    return { isValid: false, value: 0, error: 'Debe ser un número positivo' };
  }
  
  if (!Number.isInteger(numValue)) {
    return { isValid: false, value: 0, error: 'Debe ser un número entero' };
  }
  
  return { isValid: true, value: numValue };
}

/**
 * 📝 Valida longitud de texto
 */
export function validateTextLength(
  text: string, 
  minLength: number, 
  maxLength: number
): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: `El texto no puede estar vacío` };
  }
  
  if (text.length < minLength) {
    return { isValid: false, error: `Mínimo ${minLength} caracteres` };
  }
  
  if (text.length > maxLength) {
    return { isValid: false, error: `Máximo ${maxLength} caracteres` };
  }
  
  return { isValid: true };
}

/**
 * 🔐 Valida fortaleza de contraseña
 */
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  score: number; 
  error?: string;
  suggestions?: string[];
} {
  if (!password) {
    return { isValid: false, score: 0, error: 'Contraseña requerida' };
  }
  
  let score = 0;
  const suggestions: string[] = [];
  
  // Longitud mínima
  if (password.length < 8) {
    suggestions.push('Debe tener al menos 8 caracteres');
  } else {
    score += 20;
  }
  
  // Mayúsculas
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Incluir al menos una mayúscula');
  } else {
    score += 20;
  }
  
  // Minúsculas
  if (!/[a-z]/.test(password)) {
    suggestions.push('Incluir al menos una minúscula');
  } else {
    score += 20;
  }
  
  // Números
  if (!/[0-9]/.test(password)) {
    suggestions.push('Incluir al menos un número');
  } else {
    score += 20;
  }
  
  // Caracteres especiales
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push('Incluir al menos un carácter especial');
  } else {
    score += 20;
  }
  
  const isValid = score >= 60;
  
  return {
    isValid,
    score,
    error: isValid ? undefined : 'Contraseña débil',
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * 📅 Valida formato de fecha
 */
export function validateDate(dateString: string): { isValid: boolean; date?: Date; error?: string } {
  if (!dateString) {
    return { isValid: false, error: 'Fecha requerida' };
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Formato de fecha inválido' };
  }
  
  // Validar que la fecha no sea anterior a 1900 ni posterior a 2100
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    return { isValid: false, error: 'Fecha fuera de rango permitido' };
  }
  
  return { isValid: true, date };
}

/**
 * 🌐 Valida URL
 */
export function validateURL(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'URL requerida' };
  }
  
  try {
    const urlObj = new URL(url);
    
    // Solo permitir HTTP y HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Solo se permiten URLs HTTP o HTTPS' };
    }
    
    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: 'Formato de URL inválido' };
  }
}

/**
 * 🚫 Prevenir SQL Injection (para inputs que van a queries)
 */
export function sanitizeForDatabase(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    });
}

/**
 * 🎯 Valida que un valor esté en una lista permitida
 */
export function validateEnum<T extends string>(
  value: string, 
  allowedValues: readonly T[]
): { isValid: boolean; value?: T; error?: string } {
  if (!value) {
    return { isValid: false, error: 'Valor requerido' };
  }
  
  if (allowedValues.includes(value as T)) {
    return { isValid: true, value: value as T };
  }
  
  return { 
    isValid: false, 
    error: `Valor no permitido. Valores válidos: ${allowedValues.join(', ')}` 
  };
}

/**
 * 📋 Valida objeto completo basado en schema
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'email' | 'phone' | 'money' | 'date' | 'url';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => { isValid: boolean; error?: string };
  };
}

export function validateObject(
  data: Record<string, any>,
  schema: ValidationSchema
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Validar campo requerido
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = 'Este campo es requerido';
      continue;
    }
    
    // Si no es requerido y está vacío, saltar validaciones
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Validaciones por tipo
    if (rules.type === 'email') {
      if (!isValidEmail(value)) {
        errors[field] = 'Email inválido';
      }
    }
    
    if (rules.type === 'phone') {
      const result = validatePhoneColombia(value);
      if (!result.isValid) {
        errors[field] = result.error || 'Teléfono inválido';
      }
    }
    
    if (rules.type === 'money') {
      const result = validateMoneyAmount(value);
      if (!result.isValid) {
        errors[field] = result.error || 'Monto inválido';
      }
    }
    
    if (rules.type === 'date') {
      const result = validateDate(value);
      if (!result.isValid) {
        errors[field] = result.error || 'Fecha inválida';
      }
    }
    
    if (rules.type === 'url') {
      const result = validateURL(value);
      if (!result.isValid) {
        errors[field] = result.error || 'URL inválida';
      }
    }
    
    // Validar longitud para strings
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `Mínimo ${rules.minLength} caracteres`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `Máximo ${rules.maxLength} caracteres`;
      }
    }
    
    // Validar rango para números
    if (rules.type === 'number') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        errors[field] = 'Debe ser un número válido';
      } else {
        if (rules.min !== undefined && numValue < rules.min) {
          errors[field] = `El valor mínimo es ${rules.min}`;
        }
        if (rules.max !== undefined && numValue > rules.max) {
          errors[field] = `El valor máximo es ${rules.max}`;
        }
      }
    }
    
    // Validación personalizada
    if (rules.custom) {
      const result = rules.custom(value);
      if (!result.isValid) {
        errors[field] = result.error || 'Validación fallida';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 📚 EJEMPLOS DE USO:
 * 
 * 1. Validar email:
 * ```ts
 * if (!isValidEmail(email)) {
 *   toast.error('Email inválido');
 * }
 * ```
 * 
 * 2. Validar teléfono:
 * ```ts
 * const { isValid, formatted, error } = validatePhoneColombia(phone);
 * if (!isValid) {
 *   toast.error(error);
 * } else {
 *   // usar `formatted`
 * }
 * ```
 * 
 * 3. Validar objeto completo:
 * ```ts
 * const schema: ValidationSchema = {
 *   nombre: { required: true, type: 'string', minLength: 2, maxLength: 50 },
 *   email: { required: true, type: 'email' },
 *   telefono: { required: true, type: 'phone' },
 *   tarifa: { required: true, type: 'money', min: 0 },
 * };
 * 
 * const { isValid, errors } = validateObject(formData, schema);
 * if (!isValid) {
 *   // Mostrar errores
 * }
 * ```
 */
