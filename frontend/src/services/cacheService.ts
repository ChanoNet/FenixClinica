/**
 * Servicio para gestionar el caché de las respuestas de API
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // en milisegundos
}

class CacheService {
  private cache: Record<string, CacheItem<any>> = {};
  private defaultExpiry = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Guarda datos en el caché
   * @param key Clave única para identificar los datos
   * @param data Datos a almacenar
   * @param expiry Tiempo de expiración en ms (opcional)
   */
  set<T>(key: string, data: T, expiry?: number): void {
    const timestamp = Date.now();
    this.cache[key] = {
      data,
      timestamp,
      expiry: expiry || this.defaultExpiry
    };
  }

  /**
   * Obtiene datos del caché si existen y no han expirado
   * @param key Clave única para los datos
   * @returns Los datos almacenados o null si no existen o han expirado
   */
  get<T>(key: string): T | null {
    const item = this.cache[key];
    
    // Si no existe el item o ha expirado
    if (!item || Date.now() > item.timestamp + item.expiry) {
      if (item) {
        this.remove(key); // Limpiar si ha expirado
      }
      return null;
    }
    
    return item.data;
  }

  /**
   * Elimina un item del caché
   * @param key Clave del item a eliminar
   */
  remove(key: string): void {
    delete this.cache[key];
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Limpia los items expirados del caché
   */
  cleanExpired(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      const item = this.cache[key];
      if (now > item.timestamp + item.expiry) {
        this.remove(key);
      }
    });
  }

  /**
   * Genera una clave basada en la URL y parámetros
   * @param url URL de la API
   * @param params Parámetros de la solicitud (opcional)
   * @returns Clave única para el caché
   */
  generateKey(url: string, params?: any): string {
    if (!params) {
      return url;
    }
    
    // Ordenar parámetros para consistencia en las claves
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: Record<string, any>, key: string) => {
        result[key] = params[key];
        return result;
      }, {});
      
    return `${url}:${JSON.stringify(sortedParams)}`;
  }
}

// Singleton para compartir estado de caché en toda la aplicación
export default new CacheService();
