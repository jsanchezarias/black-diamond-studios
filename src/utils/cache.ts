/**
 * ✅ UTILIDAD DE CACHÉ LOCAL
 * Permite guardar y recuperar datos de la base de datos en localStorage
 * para que la carga sea instantánea al abrir la app.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export const CacheSystem = {
    /**
     * Guarda datos en el caché con un tiempo de vida (TTL)
     * @param key Clave única (ej. 'modelos_cache')
     * @param data Datos a guardar
     * @param ttlInMinutes Tiempo de vida en minutos (default 60)
     */
    set: <T>(key: string, data: T, ttlInMinutes: number = 60): void => {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + ttlInMinutes * 60 * 1000
            };
            localStorage.setItem(`bd_cache_${key}`, JSON.stringify(entry));
        } catch (error) {
            if (process.env.NODE_ENV === 'development') console.warn(`⚠️ Error al guardar en caché (${key}):`, error);
        }
    },

    /**
     * Recupera datos del caché si existen y no han expirado
     */
    get: <T>(key: string): T | null => {
        try {
            const raw = localStorage.getItem(`bd_cache_${key}`);
            if (!raw) return null;

            const entry: CacheEntry<T> = JSON.parse(raw);
            const isExpired = Date.now() > entry.expiresAt;

            if (isExpired) {
                return null; // Podríamos retornar la data igual (Stale-While-Revalidate)
            }

            return entry.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') console.warn(`⚠️ Error al leer caché (${key}):`, error);
            return null;
        }
    },

    /**
     * Limpia un caché específico o todo el sistema
     */
    clear: (key?: string): void => {
        if (key) {
            localStorage.removeItem(`bd_cache_${key}`);
        } else {
            // Limpiar todos los que empiecen por bd_cache_
            Object.keys(localStorage)
                .filter(k => k.startsWith('bd_cache_'))
                .forEach(k => localStorage.removeItem(k));
        }
    }
};
