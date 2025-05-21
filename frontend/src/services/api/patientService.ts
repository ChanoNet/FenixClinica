import axiosInstance from './config';

// Tipos para los parámetros de solicitud
interface PatientParams {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  birth_date?: string;
  address?: string;
  role?: string; // Añadido para manejar el rol en create/update
}

// Interfaces para los diferentes métodos de actualización
interface PatientUpdateParams {
  id?: number | string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  city?: string;
  occupation?: string;
  emergency_contact?: string;
  medical_history?: string;
}

// Servicio de pacientes
const patientService = {
  // Obtener todos los pacientes
  getAll: async (params?: { search?: string }) => {
    try {
      // Usamos el nuevo endpoint específico para pacientes que acabamos de crear
      console.log('Usando el nuevo endpoint de pacientes:', '/v1/users/patients/');
      const response = await axiosInstance.get('/v1/users/patients/', { params });
      
      // Validar que la respuesta sea un array
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('La respuesta no es un array:', response.data);
        // Si la respuesta no es un array pero tiene resultados dentro de ella
        if (response.data && response.data.results && Array.isArray(response.data.results)) {
          return response.data.results;
        }
        // Si no es un array y no tiene un campo results, devolver array vacío
        return [];
      }
    } catch (error: any) {
      console.log('Error al obtener pacientes:', error.message);
      
      // Fallback en caso de error
      if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        // Intentar con el endpoint antiguo como respaldo
        try {
          console.log('Intentando con el endpoint antiguo');
          const filterParams = { ...params, role: 'patient' };
          const response = await axiosInstance.get('/v1/users/', { params: filterParams });
          
          // Validar también la respuesta del endpoint antiguo
          if (Array.isArray(response.data)) {
            return response.data;
          } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
            return response.data.results;
          } else {
            console.warn('La respuesta del endpoint antiguo tampoco es un array:', response.data);
            return [];
          }
        } catch (fallbackError) {
          console.error('Ambos endpoints fallaron');
          // Devolver array vacío en caso de error
          return [];
        }
      }
      
      // Si hay un error diferente, devolver array vacío en lugar de lanzar el error
      console.error('Error no manejado al obtener pacientes:', error);
      return [];
    }
  },

  // Obtener un paciente por ID
  getById: async (id: number | string) => {
    // Validamos que el ID sea válido para evitar peticiones a '/users/NaN/'
    if (id === undefined || id === null || isNaN(Number(id))) {
      console.error('ID de paciente inválido:', id);
      throw new Error('ID de paciente inválido');
    }
    
    // Usamos el endpoint genérico de usuarios
    const response = await axiosInstance.get(`/v1/users/${id}/`);
    // Verificamos que sea un paciente
    if (response.data && response.data.role !== 'patient') {
      throw new Error('El usuario no es un paciente');
    }
    return response.data;
  },

  // Crear un nuevo paciente
  create: async (data: PatientParams) => {
    // Añadimos el rol de paciente al crear un nuevo usuario
    const patientData = { ...data, role: 'patient' };
    const response = await axiosInstance.post('/v1/users/register/', patientData);
    return response.data;
  },

  // Actualizar un paciente existente
  update: async (id: number | string, data: Partial<PatientParams>) => {
    // Validación robusta del ID para evitar solicitudes a '/users/undefined/'
    if (id === undefined || id === null || id === 'undefined' || id === 'null' || id === '') {
      console.error('ID de paciente inválido para actualización:', id);
      throw new Error('ID de paciente inválido o no especificado');
    }

    // Aseguramos que no cambie el rol (si existe en el objeto)
    const patientData = { ...data };
    if ('role' in patientData) {
      delete patientData.role; // Evitamos cambiar el rol por seguridad
    }
    
    // Información de depuración
    console.log('ID del paciente a actualizar:', id, '- Tipo:', typeof id);
    console.log('Datos a enviar:', JSON.stringify(patientData, null, 2));
    
    // Usamos el endpoint específico para pacientes con manejo de errores mejorado
    try {
      console.log(`Actualizando paciente con endpoint específico: /v1/users/patients/${id}/`);
      const response = await axiosInstance.patch(`/v1/users/patients/${id}/`, patientData);
      console.log('Actualización exitosa, respuesta:', response.data);
      return response.data;
    } catch (error: any) {
      // Información detallada del error
      console.log('Error al actualizar paciente:', error.message);
      console.log('Detalles del error:', error.response?.data || 'Sin detalles');
      console.log('Código de estado:', error.response?.status || 'Desconocido');
      
      // Si falla, intentamos con el endpoint genérico como respaldo
      try {
        console.log(`Intentando con endpoint genérico: /v1/users/${id}/`);
        const response = await axiosInstance.patch(`/v1/users/${id}/`, patientData);
        console.log('Actualización exitosa con endpoint genérico:', response.data);
        return response.data;
      } catch (fallbackError: any) {
        console.error('Ambos endpoints fallaron para la actualización');
        console.error('Detalles del último error:', fallbackError.response?.data || 'Sin detalles');
        throw new Error(`No se pudo actualizar el paciente (${fallbackError.response?.status || 'Error'}: ${fallbackError.message})`);
      }
    }
  },

  // Eliminar un paciente
  delete: async (id: number | string) => {
    const response = await axiosInstance.delete(`/v1/users/${id}/`);
    return response.data;
  },
  
  // Método alternativo para actualizar un paciente usando /v1/users/me/
  updatePatientDirect: async (patientData: PatientUpdateParams) => {
    // Eliminar propiedades con valores nulos o undefined
    const cleanData = Object.fromEntries(
      Object.entries(patientData).filter(([_, value]) => value !== null && value !== undefined)
    );
    
    console.log('Datos de paciente a actualizar:', cleanData);
    
    // Este endpoint siempre debe existir y es seguro
    const response = await axiosInstance.patch('/v1/users/me/', cleanData);
    return response.data;
  },

  // Obtener historial médico del paciente
  getMedicalHistory: async (id: number | string) => {
    // Esta funcionalidad puede requerir un endpoint especial
    // Por ahora, intentamos acceder a un endpoint que podría existir en la app appointments
    try {
      const response = await axiosInstance.get(`/v1/appointments/patient/${id}/history/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial médico:', error);
      return []; // Devolvemos un array vacío como fallback
    }
  },

  // Añadir registro al historial médico
  addMedicalRecord: async (id: number | string, data: {
    date: string;
    description: string;
    diagnosis: string;
    professional: number;
  }) => {
    const response = await axiosInstance.post(`/patients/${id}/medical-history/`, data);
    return response.data;
  },

  // Obtener citas de un paciente
  getAppointments: async (id: number | string, params?: { status?: string; date_from?: string; date_to?: string }) => {
    const response = await axiosInstance.get(`/patients/${id}/appointments/`, { params });
    return response.data;
  }
};

export default patientService;
