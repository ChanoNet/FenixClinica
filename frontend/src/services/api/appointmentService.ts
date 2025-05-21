import axiosInstance from './config';

// Tipos para los parámetros de solicitud
interface AppointmentParams {
  patient: number;
  professional: number;
  start_time: string;
  end_time: string;
  reason: string;
  notes?: string;
}

// Servicio de citas
const appointmentService = {
  // Obtener todas las citas
  getAll: async (params?: { status?: string; patient_id?: number; professional_id?: number }) => {
    try {
      // Asegurar que los IDs sean números válidos
      const sanitizedParams: any = { ...params };
      
      if (sanitizedParams.professional_id !== undefined) {
        sanitizedParams.professional_id = Number(sanitizedParams.professional_id);
        console.log('Filtrando citas por profesional ID:', sanitizedParams.professional_id);
      }
      
      if (sanitizedParams.patient_id !== undefined) {
        sanitizedParams.patient_id = Number(sanitizedParams.patient_id);
        console.log('Filtrando citas por paciente ID:', sanitizedParams.patient_id);
      }
      
      console.log('Obteniendo citas con parámetros:', sanitizedParams);
      
      // Añadir timestamp para evitar caché
      const timestamp = new Date().getTime();
      const response = await axiosInstance.get(`/v1/appointments/?_t=${timestamp}`, { params: sanitizedParams });
      
      console.log('Respuesta de citas recibida:', response.data);
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      console.log('Formato de respuesta no reconocido:', response.data);
      return [];
    } catch (error: any) {
      console.error('Error al obtener citas:', error);
      
      // Siempre devolver un array vacío en caso de error para evitar errores en los componentes
      return [];
    }
  },

  // Obtener una cita por ID
  getById: async (id: number | string) => {
    if (id === undefined || id === null || (isNaN(Number(id)) && typeof id !== 'string')) {
      console.error('ID de cita inválido:', id);
      throw new Error('ID de cita inválido');
    }
    
    try {
      console.log(`Obteniendo cita ID ${id} usando ÚNICAMENTE el método de filtrado`);
      
      // Usar exclusivamente el método de filtrado que parece ser el más confiable
      // Añadir timestamp para evitar cachés problemáticos
      const timestamp = new Date().getTime();
      
      // ESTRATEGIA 1: Usar el endpoint con filtro por ID
      console.log(`ESTRATEGIA 1: Filtrado por ID`);
      try {
        const filterResponse = await axiosInstance.get(`/v1/appointments/?_t=${timestamp}`, {
          params: { id: id }
        });
        
        console.log('Respuesta recibida (filtrado):', filterResponse.data);
        
        // Manejar diferentes formatos de respuesta
        if (filterResponse.data && Array.isArray(filterResponse.data) && filterResponse.data.length > 0) {
          console.log(`Éxito al obtener cita ID ${id} con filtro (formato array)`);
          return filterResponse.data[0];
        } else if (filterResponse.data && filterResponse.data.results && 
                  Array.isArray(filterResponse.data.results) && filterResponse.data.results.length > 0) {
          console.log(`Éxito al obtener cita ID ${id} con filtro (formato paginado)`);
          return filterResponse.data.results[0];
        }
      } catch (filterError) {
        console.error('Error con el filtrado:', filterError);
      }
      
      // ESTRATEGIA 2: Obtener todas las citas y filtrar manualmente en el cliente
      console.log(`ESTRATEGIA 2: Obtener todas las citas y filtrar en el cliente`);
      try {
        const allResponse = await axiosInstance.get(`/v1/appointments/?_t=${timestamp}`);
        
        let allAppointments = [];
        
        if (Array.isArray(allResponse.data)) {
          allAppointments = allResponse.data;
        } else if (allResponse.data && allResponse.data.results && Array.isArray(allResponse.data.results)) {
          allAppointments = allResponse.data.results;
        }
        
        if (allAppointments.length > 0) {
          const matchingAppointment = allAppointments.find((app: any) => 
            app.id == id || app.id === Number(id) || app.id === id.toString());
          
          if (matchingAppointment) {
            console.log('Se encontró la cita usando la lista completa');
            return matchingAppointment;
          }
        }
      } catch (allError) {
        console.error('Error al obtener todas las citas:', allError);
      }
      
      // ESTRATEGIA 3: Buscar en caché local
      console.log(`ESTRATEGIA 3: Buscar en caché local`);
      try {
        const cachedData = localStorage.getItem(`appointment_${id}`);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          console.log('Se encontró la cita en caché local');
          return parsedData;
        }
      } catch (cacheError) {
        console.error('Error al buscar en caché:', cacheError);
      }

      // FALLBACK: Si ninguna estrategia funciona, crear un objeto básico
      console.warn(`Todas las estrategias fallaron. Retornando objeto básico para ID ${id}`);
      return {
        id: Number(id),
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 30*60000).toISOString(),
        reason: 'Cita no encontrada - Error de carga',
        notes: 'Los detalles no pudieron ser cargados debido a un error del servidor.',
        _error: true  // Marcador para indicar que este es un objeto de fallback
      };
    } catch (error: any) {
      console.error(`Error al obtener cita ID ${id}:`, error);
      throw new Error(error.response?.data?.detail || `No se pudo obtener la cita con ID ${id}`);
    }
  },

  // Crear una nueva cita
  create: async (data: AppointmentParams) => {
    try {
      console.log('Intentando crear una cita con datos:', data);
      
      // Primera alternativa: usando el endpoint principal
      try {
        const response = await axiosInstance.post('/v1/appointments/', data);
        console.log('Cita creada con éxito usando /v1/appointments/');
        return response.data;
      } catch (error: any) {
        console.error('Error al crear cita usando /v1/appointments/:', error.response || error);
        
        // Si falla, intentamos con un endpoint alternativo que use el router directamente
        if (error.response?.status === 405) {
          console.log('Intentando endpoint alternativo...');
          const alternativeResponse = await axiosInstance.post('/v1/appointments/appointments/', data);
          console.log('Cita creada con éxito usando endpoint alternativo');
          return alternativeResponse.data;
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error('Error al crear cita:', error.response?.data || error.message || error);
      throw error;
    }
  },

  // Actualizar una cita existente
  update: async (id: number | string, data: Partial<AppointmentParams>) => {
    try {
      console.log(`Intentando actualizar cita ID ${id} con datos:`, data);
      
      // Primera alternativa: usando el endpoint principal
      try {
        const response = await axiosInstance.patch(`/v1/appointments/${id}/`, data);
        console.log('Cita actualizada con éxito usando PATCH');
        return response.data;
      } catch (error: any) {
        console.error('Error usando PATCH para actualizar:', error.response || error);
        
        // Si falla con PATCH, intentar con PUT
        try {
          console.log('Intentando actualizar con PUT en lugar de PATCH...');
          const putResponse = await axiosInstance.put(`/v1/appointments/${id}/`, data);
          console.log('Cita actualizada con éxito usando PUT');
          return putResponse.data;
        } catch (putError: any) {
          console.error('Error usando PUT para actualizar:', putError.response || putError);
          
          // Si también falla con PUT, intentar con la implementación alternativa 1
          try {
            // Obtener los datos completos de la cita primero
            const currentAppointment = await appointmentService.getById(id);
            const fullData = { ...currentAppointment, ...data };
            
            // Asegurarse de que tenemos todos los datos necesarios
            if (!fullData.professional || !fullData.patient) {
              throw new Error('No se pudieron obtener los datos completos de la cita para actualizar');
            }
            
            const altResponse = await axiosInstance.put(`/v1/appointments/${id}`, fullData);
            console.log('Cita actualizada con éxito usando PUT sin barra final');
            return altResponse.data;
          } catch (altError: any) {
            console.error('Error en implementación alternativa 1:', altError.response || altError);
            
            try {
              // Intentar con endpoint alternativo
              const altPutResponse = await axiosInstance.put(`/v1/appointments/appointments/${id}/`, data);
              console.log('Cita actualizada con éxito usando PUT en endpoint alternativo');
              return altPutResponse.data;
            } catch (altError2: any) {
              console.error('Error usando PUT para actualizar:', altError2.response || altError2);
            }
          }
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error('Error al actualizar cita:', error.response?.data || error.message || error);
      throw error;
    }
  },

  // Eliminar una cita
  delete: async (id: number | string) => {
    try {
      console.log(`Intentando eliminar cita ID ${id}`);
      
      // Intentar eliminar usando el endpoint que sabemos que funciona para actualizar
      try {
        // Obtener la cita actual primero
        const currentAppointment = await appointmentService.getById(id);
        
        // Marcar como eliminada o intentar eliminarla completamente
        const updateData = {
          ...currentAppointment,
          status: 'deleted'
        };
        
        console.log(`Actualizando cita ${id} a estado 'deleted' usando el endpoint que funciona`);
        const response = await axiosInstance.put(`/v1/appointments/appointments/${id}/`, updateData);
        console.log(`Éxito al marcar cita ID ${id} como eliminada`);
        return response.data;
      } catch (error: any) {
        console.error(`Error al eliminar cita ID ${id}:`, error.response || error);
        throw error;
      }
    } catch (error: any) {
      console.error(`Error al eliminar cita ID ${id}:`, error.response?.data || error.message || error);
      throw error;
    }
  },

  // Confirmar una cita
  confirm: async (id: number | string) => {
    try {
      console.log(`Intentando confirmar cita ID ${id}`);
      
      // Obtener la cita actual primero
      const currentAppointment = await appointmentService.getById(id);
      
      // Actualizar con el endpoint que sabemos que funciona
      const updateData = {
        ...currentAppointment,
        status: 'confirmed'
      };
      
      console.log(`Actualizando cita ${id} a estado 'confirmed' usando el endpoint que funciona`);
      const response = await axiosInstance.put(`/v1/appointments/appointments/${id}/`, updateData);
      console.log(`Éxito al confirmar cita ID ${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al confirmar cita ID ${id}:`, error.response?.data || error.message || error);
      throw error;
    }
  },
  
  // Cancelar una cita
  cancel: async (id: number | string) => {
    try {
      console.log(`Intentando cancelar cita ID ${id}`);
      
      // Obtener la cita actual primero
      const currentAppointment = await appointmentService.getById(id);
      
      // Actualizar con el endpoint que sabemos que funciona
      const updateData = {
        ...currentAppointment,
        status: 'cancelled'
      };
      
      console.log(`Actualizando cita ${id} a estado 'cancelled' usando el endpoint que funciona`);
      const response = await axiosInstance.put(`/v1/appointments/appointments/${id}/`, updateData);
      console.log(`Éxito al cancelar cita ID ${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al cancelar cita ID ${id}:`, error.response?.data || error.message || error);
      throw error;
    }
  },
  
  // Marcar cita como completada
  complete: async (id: number | string) => {
    try {
      console.log(`Intentando marcar como completada cita ID ${id}`);
      
      // Obtener la cita actual primero
      const currentAppointment = await appointmentService.getById(id);
      
      // Actualizar con el endpoint que sabemos que funciona
      const updateData = {
        ...currentAppointment,
        status: 'completed'
      };
      
      console.log(`Actualizando cita ${id} a estado 'completed' usando el endpoint que funciona`);
      const response = await axiosInstance.put(`/v1/appointments/appointments/${id}/`, updateData);
      console.log(`Éxito al marcar cita ID ${id} como completada`);
      return response.data;
    } catch (error: any) {
      console.error(`Error al marcar cita ID ${id} como completada:`, error.response?.data || error.message || error);
      throw error;
    }
  },
  
  // Verificar disponibilidad para una cita
  checkAvailability: async (professionalId: number, startTime: string, endTime: string) => {
    const response = await axiosInstance.get('/v1/appointments/check-availability/', {
      params: { professional_id: professionalId, start_time: startTime, end_time: endTime }
    });
    return response.data;
  }
};

export default appointmentService;
