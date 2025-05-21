import axiosInstance from './config';

// Tipos para los parámetros de solicitud
interface ProfessionalParams {
  email: string;
  first_name: string;
  last_name: string;
  specialty: string;
  phone_number?: string;
  description?: string;
  education?: string;
  office_address?: string;
  consultation_fee?: number;
  profile_image?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  availability?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  work_hours_start?: string;
  work_hours_end?: string;
  rating?: number;
  reviews_count?: number;
  patients_count?: number;
  appointments_completed?: number;
}

// Servicio de profesionales
const professionalService = {
  // Obtener todos los profesionales
  getAll: async (params?: { specialty?: string; search?: string }) => {
    try {
      // Intentar con el endpoint específico de profesionales
      console.log('Obteniendo profesionales desde:', '/v1/professionals/');
      const response = await axiosInstance.get('/v1/professionals/', { params });
      
      // Validar que la respuesta sea un array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      } else {
        console.warn('La respuesta de profesionales no es un array:', response.data);
        return [];
      }
    } catch (error: any) {
      console.log('Error al obtener profesionales:', error.message);
      
      // Si el endpoint no existe, usar el endpoint general de usuarios con filtro
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log('Usando endpoint alternativo para profesionales: /v1/users/');
        
        try {
          // Preparar parámetros para el endpoint de usuarios
          const userParams = { 
            ...params,
            role: 'professional' 
          };
          
          const response = await axiosInstance.get('/v1/users/', { params: userParams });
          
          // Transformar la respuesta para que coincida con el formato esperado
          if (Array.isArray(response.data)) {
            return response.data;
          } else if (response.data && Array.isArray(response.data.results)) {
            return response.data.results;
          } else {
            console.warn('La respuesta alternativa tampoco es un array:', response.data);
            return [];
          }
        } catch (fallbackError: any) {
          console.error('Error en endpoint alternativo:', fallbackError.message);
          return [];
        }
      }
      
      // Para cualquier otro tipo de error, devolver array vacío
      console.error('Error no manejado al obtener profesionales:', error);
      return [];
    }
  },

  // Obtener un profesional por ID
  getById: async (id: number | string) => {
    // Validamos que el ID sea válido para evitar peticiones con NaN
    if (id === undefined || id === null || isNaN(Number(id))) {
      console.error('ID de profesional inválido:', id);
      throw new Error('ID de profesional inválido');
    }
    
    try {
      // Intentar con el endpoint específico de profesionales
      const response = await axiosInstance.get(`/v1/professionals/${id}/`);
      return response.data;
    } catch (error: any) {
      // Si el endpoint no existe, usar el endpoint de usuarios
      if (error.response?.status === 404) {
        console.log(`Endpoint /v1/professionals/${id}/ no encontrado. Usando endpoint alternativo.`);
        
        // Obtener usuario y verificar que sea un profesional
        const response = await axiosInstance.get(`/v1/users/${id}/`);
        
        if (response.data && response.data.role === 'professional') {
          return response.data;
        } else {
          throw new Error('El usuario no es un profesional');
        }
      }
      throw error;
    }
  },

  // Crear un nuevo profesional
  create: async (data: ProfessionalParams) => {
    try {
      // Intentar con el endpoint específico
      const response = await axiosInstance.post('/v1/professionals/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Endpoint /v1/professionals/ no encontrado. Creando usuario con rol profesional.');
        // Alternativa: Crear un usuario con rol profesional
        const userData = {
          ...data,
          role: 'professional'
        };
        const response = await axiosInstance.post('/v1/users/register/', userData);
        return response.data;
      }
      throw error;
    }
  },

  // Actualizar un profesional existente
  update: async (id: number | string, data: Partial<ProfessionalParams>) => {
    try {
      // Intentar con el endpoint específico
      const response = await axiosInstance.patch(`/v1/professionals/${id}/`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`Endpoint /v1/professionals/${id}/ no encontrado. Usando endpoint de usuarios.`);
        // Alternativa: Actualizar usuario
        const userData = {
          ...data,
          // No modificamos el rol por seguridad
        };
        const response = await axiosInstance.patch(`/v1/users/${id}/`, userData);
        return response.data;
      }
      throw error;
    }
  },

  // Eliminar un profesional
  delete: async (id: number | string) => {
    try {
      // Intentar con el endpoint específico
      const response = await axiosInstance.delete(`/v1/professionals/${id}/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`Endpoint /v1/professionals/${id}/ no encontrado. Usando endpoint de usuarios.`);
        // Alternativa: Actualizar usuario para cambiar su rol o desactivarlo
        const response = await axiosInstance.delete(`/v1/users/${id}/`);
        return response.data;
      }
      throw error;
    }
  },

  // Obtener disponibilidad de un profesional
  getAvailability: async (id: number | string) => {
    try {
      // Intentar con el endpoint específico
      const response = await axiosInstance.get(`/v1/professionals/${id}/availability/`);
      return response.data;
    } catch (error: any) {
      console.log(`Endpoint /v1/professionals/${id}/availability/ no encontrado.`);
      // Devolver datos simulados como fallback
      return [
        { day: 'monday', start_time: '09:00', end_time: '17:00' },
        { day: 'tuesday', start_time: '09:00', end_time: '17:00' },
        { day: 'wednesday', start_time: '09:00', end_time: '17:00' },
        { day: 'thursday', start_time: '09:00', end_time: '17:00' },
        { day: 'friday', start_time: '09:00', end_time: '17:00' }
      ];
    }
  },

  // Establecer disponibilidad de un profesional
  setAvailability: async (id: number | string, data: Array<{day: string, start_time: string, end_time: string}>) => {
    try {
      // Asegurar que usamos el prefijo /v1/ correctamente
      const response = await axiosInstance.post(`/v1/professionals/${id}/availability/`, { availability: data });
      return response.data;
    } catch (error: any) {
      console.log(`Error al establecer disponibilidad: ${error.message}`);
      // Devolver una respuesta simulada para no romper la interfaz
      return { success: false, message: 'No se pudo establecer la disponibilidad.' };
    }
  },

  // Obtener citas de un profesional
  getAppointments: async (id: number | string, params?: { status?: string; date_from?: string; date_to?: string }) => {
    try {
      // Asegurar que usamos el prefijo /v1/ correctamente
      const response = await axiosInstance.get(`/v1/professionals/${id}/appointments/`, { params });
      return response.data;
    } catch (error: any) {
      console.log(`Error al obtener citas: ${error.message}`);
      
      // Alternativa: obtener todas las citas y filtrar por el ID del profesional
      try {
        const response = await axiosInstance.get('/v1/appointments/');
        
        // Verificar si la respuesta es un array o tiene una propiedad results
        let appointments = [];
        if (Array.isArray(response.data)) {
          appointments = response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
          appointments = response.data.results;
        }
        
        // Filtrar por profesional ID
        return appointments.filter((appointment: any) => {
          // Manejar tanto el caso donde professional es un objeto como cuando es solo un ID
          return appointment.professional === id || 
                (appointment.professional && appointment.professional.id === id);
        });
      } catch (secondError) {
        console.log('Error al obtener citas mediante método alternativo');
        return [];
      }
    }
  }
};

export default professionalService;
