/**
 * Utilidades para los servicios de API
 */

// Función para obtener el encabezado de autenticación
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Función para manejar errores de API
export const handleApiError = (error: any) => {
  if (error.response) {
    // El servidor respondió con un código de estado fuera del rango 2xx
    console.error('Error de respuesta:', error.response.data);
    return error.response.data;
  } else if (error.request) {
    // La solicitud fue realizada pero no se recibió respuesta
    console.error('Error de solicitud:', error.request);
    return { detail: 'No se recibió respuesta del servidor' };
  } else {
    // Ocurrió un error al configurar la solicitud
    console.error('Error:', error.message);
    return { detail: 'Error al realizar la solicitud' };
  }
};
