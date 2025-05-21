import axios, { AxiosRequestConfig } from 'axios';
import cacheService from '../cacheService';
import { getAuthHeader } from './utils';

const API_URL = 'http://localhost:8000/api';

/**
 * Servicio de API optimizado con caché
 */
const optimizedApiService = {
  /**
   * Realiza una petición GET con soporte de caché
   * @param endpoint Endpoint de la API
   * @param params Parámetros de la solicitud
   * @param config Configuración adicional
   * @param useCache Si debe usar caché
   * @param cacheExpiry Tiempo de expiración de caché en ms
   */
  get: async <T>(
    endpoint: string,
    params?: any,
    config?: AxiosRequestConfig,
    useCache: boolean = true,
    cacheExpiry?: number
  ): Promise<T> => {
    const url = `${API_URL}/${endpoint}`;
    const headers = getAuthHeader();
    const fullConfig = { 
      ...config, 
      headers: { ...headers, ...(config?.headers || {}) },
      params 
    };

    // Si usamos caché, intentar obtener del caché primero
    if (useCache) {
      const cacheKey = cacheService.generateKey(url, params);
      const cachedData = cacheService.get<T>(cacheKey);
      
      if (cachedData) {
        console.log(`[Cache] Usando datos en caché para: ${cacheKey}`);
        return cachedData;
      }
    }

    try {
      const response = await axios.get<T>(url, fullConfig);
      
      // Guardar en caché si está habilitado
      if (useCache) {
        const cacheKey = cacheService.generateKey(url, params);
        cacheService.set(cacheKey, response.data, cacheExpiry);
        console.log(`[Cache] Guardando en caché: ${cacheKey}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error en solicitud GET a ${url}:`, error);
      throw error;
    }
  },

  /**
   * Realiza una petición POST
   * @param endpoint Endpoint de la API
   * @param data Datos a enviar
   * @param config Configuración adicional
   * @param invalidateCache Si debe invalidar el caché relacionado
   */
  post: async <T>(
    endpoint: string,
    data: any,
    config?: AxiosRequestConfig,
    invalidateCache: boolean = true
  ): Promise<T> => {
    const url = `${API_URL}/${endpoint}`;
    const headers = getAuthHeader();
    const fullConfig = { 
      ...config, 
      headers: { ...headers, ...(config?.headers || {}) } 
    };

    try {
      const response = await axios.post<T>(url, data, fullConfig);
      
      // Invalidar caché si está habilitado
      if (invalidateCache) {
        // Limpiar caché relacionada con este endpoint
        const baseKey = url.split('?')[0]; // Eliminar parámetros de consulta
        Object.keys(cacheService).forEach(key => {
          if (key.startsWith(baseKey)) {
            cacheService.remove(key);
          }
        });
        console.log(`[Cache] Invalidando caché para: ${baseKey}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error en solicitud POST a ${url}:`, error);
      throw error;
    }
  },

  /**
   * Realiza una petición PUT
   * @param endpoint Endpoint de la API
   * @param data Datos a enviar
   * @param config Configuración adicional
   * @param invalidateCache Si debe invalidar el caché relacionado
   */
  put: async <T>(
    endpoint: string,
    data: any,
    config?: AxiosRequestConfig,
    invalidateCache: boolean = true
  ): Promise<T> => {
    const url = `${API_URL}/${endpoint}`;
    const headers = getAuthHeader();
    const fullConfig = { 
      ...config, 
      headers: { ...headers, ...(config?.headers || {}) } 
    };

    try {
      const response = await axios.put<T>(url, data, fullConfig);
      
      // Invalidar caché si está habilitado
      if (invalidateCache) {
        const baseKey = url.split('?')[0];
        Object.keys(cacheService).forEach(key => {
          if (key.startsWith(baseKey)) {
            cacheService.remove(key);
          }
        });
        console.log(`[Cache] Invalidando caché para: ${baseKey}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error en solicitud PUT a ${url}:`, error);
      throw error;
    }
  },

  /**
   * Realiza una petición DELETE
   * @param endpoint Endpoint de la API
   * @param config Configuración adicional
   * @param invalidateCache Si debe invalidar el caché relacionado
   */
  delete: async <T>(
    endpoint: string,
    config?: AxiosRequestConfig,
    invalidateCache: boolean = true
  ): Promise<T> => {
    const url = `${API_URL}/${endpoint}`;
    const headers = getAuthHeader();
    const fullConfig = { 
      ...config, 
      headers: { ...headers, ...(config?.headers || {}) } 
    };

    try {
      const response = await axios.delete<T>(url, fullConfig);
      
      // Invalidar caché si está habilitado
      if (invalidateCache) {
        const baseKey = url.split('?')[0];
        Object.keys(cacheService).forEach(key => {
          if (key.startsWith(baseKey)) {
            cacheService.remove(key);
          }
        });
        console.log(`[Cache] Invalidando caché para: ${baseKey}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error en solicitud DELETE a ${url}:`, error);
      throw error;
    }
  },

  /**
   * Limpia todo el caché
   */
  clearCache: () => {
    cacheService.clear();
    console.log('[Cache] Caché limpiado completamente');
  }
};

export default optimizedApiService;
