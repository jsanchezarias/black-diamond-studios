import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Singleton del cliente de Supabase - solo una instancia en toda la app
let supabaseInstance: ReturnType<typeof createClient> | null = null;

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
  }
  return supabaseInstance;
})();

// También exportamos una función getter para mantener compatibilidad
export function getSupabaseClient() {
  return supabase;
}

export default supabase;
