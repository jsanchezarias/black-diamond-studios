import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../src/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Singleton del cliente de Supabase - solo una instancia en toda la app
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// 🆕 Exportar URL y Key para usar en sendBeacon
export const supabaseConfig = {
  supabaseUrl,
  supabaseKey: publicAnonKey
};

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: `sb-${projectId}-auth-token`
      }
    });
    
    // 🆕 Agregar propiedades a la instancia para acceso fácil
    (supabaseInstance as any).supabaseUrl = supabaseUrl;
    (supabaseInstance as any).supabaseKey = publicAnonKey;
  }
  return supabaseInstance;
})();

// También exportamos una función getter para mantener compatibilidad
export function getSupabaseClient() {
  return supabase;
}

export default supabase;