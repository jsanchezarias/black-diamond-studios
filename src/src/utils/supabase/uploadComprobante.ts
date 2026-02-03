import { projectId, publicAnonKey } from './info';

/**
 * Sube una imagen de comprobante (versión sin Supabase - convierte a base64)
 * @param file - Archivo de imagen a subir
 * @param folder - Carpeta donde guardar (ej: 'comprobantes-tiempo', 'comprobantes-adicionales', 'comprobantes-boutique')
 * @returns URL en base64 del archivo
 */
export async function uploadComprobante(
  file: File,
  folder: 'comprobantes-tiempo' | 'comprobantes-adicionales' | 'comprobantes-boutique'
): Promise<string> {
  try {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen');
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('La imagen no puede superar los 5MB');
    }

    // Convertir a base64 para almacenamiento local
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error en uploadComprobante:', error);
    throw error;
  }
}

/**
 * Componente de input para subir comprobantes
 */
export function getComprobanteInputProps() {
  return {
    type: 'file',
    accept: 'image/*',
    capture: 'environment' as const, // Permite usar la cámara en móviles
  };
}