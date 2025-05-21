import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// URL base de la API
const API_URL = 'http://localhost:8000/api';

// Crear instancia de Axios con la URL base
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para agregar el token de autenticación a las solicitudes
// y redirigir peticiones a endpoints problemáticos
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // INTERCEPTOR ESPECIAL: Redirigir peticiones a citas individuales que sabemos que fallan
    const appointmentRegex = /\/v1\/appointments\/([0-9]+)\/?$/;
    if (config.url && appointmentRegex.test(config.url)) {
      const match = config.url.match(appointmentRegex);
      if (match && match[1]) {
        const appointmentId = match[1];
        console.warn(`⚠️ INTERCEPTOR: Detectada petición a endpoint problemático: ${config.url}`);
        console.warn(`⚠️ INTERCEPTOR: Redirigiendo a método de filtrado para la cita ${appointmentId}`);
        
        // Cambiar la URL a la versión con filtrado, que sabemos que funciona
        config.url = '/v1/appointments/';
        config.params = { ...config.params, id: appointmentId };
        // Usar almacenamiento temporal para rastrear redirecciones (evitamos problemas de TypeScript)
        (config as any)._redirected = true; // Marcar como redirigida para depuración
        
        console.log(`⚠️ INTERCEPTOR: Petición redirigida a ${config.url} con parámetros:`, config.params);
      }
    }
    
    // Agregar información de depuración
    console.log(`Petición ${config.method?.toUpperCase()} a ${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data,
      redirected: (config as any)._redirected || false
    });
    return config;
  },
  (error) => {
    console.error('Error en la configuración de la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores comunes
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Loguear la respuesta exitosa para depuración
    console.log(`Respuesta exitosa de ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      // Solo mostrar un resumen de los datos para no saturar la consola
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  },
  (error: AxiosError) => {
    // Mejorar el log de errores
    console.error('Error en la petición:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      response: error.response?.data
    });
    
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un código de error (4xx, 5xx)
      if (error.response.status === 401) {
        console.warn('Sesión expirada o no autorizada. Redirigiendo a login...');
        // Aquí podríamos implementar un redireccionamiento al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
    }
    
    return Promise.reject(error);
  }
);

// Registro de endpoints no disponibles para evitar intentos repetidos
const unavailableEndpoints: Record<string, boolean> = {};

// Función para manejar fallbacks para ciertos endpoints
const handleEndpointFallback = async (url: string, config: any) => {
  console.log(`Usando fallback para endpoint no disponible: ${url}`);
  
  // Manejo especializado por tipo de endpoint
  if (url.includes('/professionals/')) {
    // Si es una solicitud a profesionales, redireccionar a usuarios con filtro
    const newUrl = url.replace('/professionals/', '/users/');
    const newConfig = { ...config, params: { ...config.params, role: 'professional' } };
    try {
      const response = await axiosInstance.get(newUrl, newConfig);
      console.log('Respuesta del fallback:', response.data);
      
      // Asegurarnos de que los datos tengan el formato adecuado
      let processedData = [];
      
      if (Array.isArray(response.data)) {
        processedData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        processedData = response.data.results;
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Si es un objeto individual, convertirlo en array
        processedData = [response.data];
      }
      
      // Si aún no tenemos datos, devolver array vacío
      if (!processedData || processedData.length === 0) {
        console.warn('No se encontraron datos de profesionales');
        processedData = [];
      }
      
      // Asegurarnos de que cada profesional tenga todas las propiedades necesarias
      const formattedData = processedData.map((professional: any) => ({
        id: professional.id || 0,
        first_name: professional.first_name || '',
        last_name: professional.last_name || '',
        email: professional.email || '',
        phone_number: professional.phone_number || '',
        specialty: professional.specialty || 'General',
        profile_picture: professional.profile_picture || null,
        appointments_count: professional.appointments_count || 0,
        rating: professional.rating || 4.0
      }));
      
      console.log('Datos procesados:', formattedData);
      return { data: formattedData };
    } catch (fallbackError) {
      console.error('Error incluso con fallback:', fallbackError);
      // Si el fallback también falla, devolver array vacío
      console.log('No se pudieron obtener datos. Devolviendo array vacío');
      return { data: [] };
    }
  }
  
  // Manejo para el endpoint de pacientes (users con role=patient)
  else if (url.includes('/users/') && config.params && config.params.role === 'patient') {
    console.log('Aplicando fallback para pacientes');
    try {
      // Intentamos sin el parámetro role primero, a veces esto funciona
      const newConfig = { ...config };
      if (newConfig.params) {
        delete newConfig.params.role;
      }
      
      try {
        const response = await axiosInstance.get(url, newConfig);
        // Filtrar manualmente los pacientes si hay datos
        if (response.data) {
          let allUsers = [];
          
          if (Array.isArray(response.data)) {
            allUsers = response.data;
          } else if (response.data && Array.isArray(response.data.results)) {
            allUsers = response.data.results;
          }
          
          // Filtrar solo los que tienen rol de paciente
          const patients = allUsers.filter((user: any) => user.role === 'patient');
          
          if (patients && patients.length > 0) {
            console.log('Pacientes encontrados con fallback alternativo:', patients.length);
            return { data: patients };
          }
        }
      } catch (error) {
        console.warn('Falló el intento alternativo para obtener pacientes');
      }
      
      // Si todo falla, devolver array vacío
      console.warn('No hay datos de pacientes disponibles');
      return { data: [] };
    } catch (error) {
      console.warn('Error en el fallback de pacientes, devolviendo array vacío');
      return { data: [] };
    }
  }
  // Fallback genérico para otros endpoints
  return { data: [] };
};

// Interceptor para manejar las respuestas y errores
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    const requestUrl = originalRequest?.url || '';
    
    // Si el error es 401 (No autorizado) y tenemos un token de refresco
    if (
      error.response && 
      error.response.status === 401 && 
      localStorage.getItem('refresh_token') &&
      !originalRequest?.headers?.['retryAttempt']
    ) {
      try {
        // Intentar renovar el token usando el token de refresco
        const refresh_token = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/v1/users/token/refresh/`, {
          refresh: refresh_token
        });
        
        // Si se renueva con éxito, actualizar los tokens y reintentar la solicitud original
        if (response.data) {
          localStorage.setItem('access_token', response.data.access);
          // También podemos actualizar el token de refresco si el backend lo devuelve
          if (response.data.refresh) {
            localStorage.setItem('refresh_token', response.data.refresh);
          }
          
          // Reintentar la solicitud original
          if (originalRequest && originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
            originalRequest.headers['retryAttempt'] = true;
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        // Si falla la renovación del token, cerrar sesión
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    // Para errores 404 (Not Found) o 403 (Forbidden), intentar usar fallbacks
    if (error.response && (error.response.status === 404 || error.response.status === 403)) {
      // Registrar el endpoint como no disponible para futuras referencias
      unavailableEndpoints[requestUrl] = true;
      console.warn(`Endpoint no disponible o sin acceso: ${requestUrl} (${error.response.status})`);
      
      // Si es una solicitud GET, intentar usar un fallback
      if (originalRequest.method?.toLowerCase() === 'get') {
        try {
          return await handleEndpointFallback(requestUrl, originalRequest);
        } catch (fallbackError) {
          console.error('Error en fallback:', fallbackError);
        }
      }
    }
    
    // Para otros errores, simplemente rechazar la promesa
    return Promise.reject(error);
  }
);

export default axiosInstance;
