import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../context/NotificationContext';
import CacheService from '../services/cacheService';

// Interface para el objeto en caché
interface CachedData<T> {
  data: T;
  timestamp: number;
}

// Interface para los estados del recurso
interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  timestamp: number | null;
}

// Opciones para el hook
interface UseApiResourceOptions {
  cacheDuration?: number; // Duración de la caché en milisegundos
  revalidateOnFocus?: boolean; // Revalidar al volver a enfocar la ventana
  revalidateOnMount?: boolean; // Revalidar al montar el componente
  loadOnMount?: boolean; // Cargar al montar el componente
  errorHandler?: (error: any) => string; // Manejador personalizado de errores
  shouldCache?: boolean; // Si se debe cachear la respuesta
  dependencies?: any[]; // Dependencias para recargar
}

// Opciones por defecto
const defaultOptions: UseApiResourceOptions = {
  cacheDuration: 5 * 60 * 1000, // 5 minutos por defecto
  revalidateOnFocus: false,
  revalidateOnMount: true,
  loadOnMount: true,
  shouldCache: true,
  dependencies: []
};

/**
 * Hook para obtener y gestionar recursos de API con caché
 * @param apiCall Función que realiza la llamada a la API
 * @param cacheKey Clave para almacenar en caché (debe ser única)
 * @param options Opciones adicionales
 */
function useApiResource<T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  options: UseApiResourceOptions = {}
) {
  // Combinar opciones con valores por defecto
  const opts = { ...defaultOptions, ...options };
  
  // Inicializar estado
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    loading: opts.loadOnMount || false,
    error: null,
    timestamp: null
  });
  
  // Acceder al contexto de notificaciones
  const { showNotification } = useNotification();
  
  // Verificar y obtener datos de la caché al inicializar
  useEffect(() => {
    if (opts.shouldCache) {
      const cachedData = CacheService.get<CachedData<T>>(cacheKey);
      
      if (cachedData) {
        setState({
          data: cachedData.data,
          loading: false,
          error: null,
          timestamp: cachedData.timestamp
        });
        
        // Si no necesitamos revalidar al montar o ya está cargando, salir
        if (!opts.revalidateOnMount) {
          return;
        }
      }
    }
    
    // Cargar datos al montar si es necesario
    if (opts.loadOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...(opts.dependencies || [])]);
  
  // Añadir listener para revalidar al enfocar la ventana
  useEffect(() => {
    if (!opts.revalidateOnFocus) return;
    
    const handleFocus = () => {
      // Verificar si los datos son lo suficientemente antiguos para revalidar
      if (state.timestamp) {
        const now = Date.now();
        const age = now - state.timestamp;
        
        if (age > (opts.cacheDuration || 0)) {
          fetchData();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.revalidateOnFocus, state.timestamp]);
  
  // Función para obtener datos desde la API
  const fetchData = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    try {
      const data = await apiCall();
      const timestamp = Date.now();
      
      // Actualizar el estado
      setState({
        data,
        loading: false,
        error: null,
        timestamp
      });
      
      // Almacenar en caché si es necesario
      if (opts.shouldCache) {
        CacheService.set<CachedData<T>>(cacheKey, { data, timestamp }, opts.cacheDuration);
      }
      
      return data;
    } catch (error: any) {
      console.error(`Error fetching resource (${cacheKey}):`, error);
      
      // Determinar mensaje de error
      let errorMessage = 'Error al cargar los datos';
      
      if (opts.errorHandler) {
        errorMessage = opts.errorHandler(error);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Actualizar el estado
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        timestamp: Date.now()
      }));
      
      // Mostrar notificación de error
      showNotification({
        message: errorMessage,
        severity: 'error'
      });
      
      throw error;
    }
  }, [apiCall, cacheKey, opts.cacheDuration, opts.errorHandler, opts.shouldCache, showNotification]);
  
  // Función para refrescar manualmente los datos
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  
  // Función para refrescar silenciosamente los datos (sin actualizar estado de carga)
  const silentRefresh = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);
  
  // Función para actualizar localmente los datos
  const updateLocalData = useCallback((updater: (prevData: T | null) => T) => {
    setState(prev => {
      const newData = updater(prev.data);
      
      // Actualizar la caché si es necesario
      if (opts.shouldCache) {
        CacheService.set<CachedData<T>>(cacheKey, { 
          data: newData, 
          timestamp: Date.now() 
        }, opts.cacheDuration);
      }
      
      return {
        ...prev,
        data: newData,
        timestamp: Date.now()
      };
    });
  }, [cacheKey, opts.cacheDuration, opts.shouldCache]);
  
  // Limpiar la caché para esta clave
  const clearCache = useCallback(() => {
    CacheService.remove(cacheKey);
  }, [cacheKey]);
  
  return {
    ...state,
    refresh,
    silentRefresh,
    updateLocalData,
    clearCache
  };
}

export default useApiResource;
