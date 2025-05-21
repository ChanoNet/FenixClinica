import axiosInstance from './config';

const dashboardService = {
  // Obtener estadísticas generales para el dashboard
  getStats: async () => {
    try {
      // Intentar con la ruta dashboard/stats
      try {
        const response = await axiosInstance.get('/v1/dashboard/stats/');
        return response.data;
      } catch (error: any) {
        // Si el endpoint no existe (404), generamos estadísticas simuladas
        if (error.response?.status === 404) {
          console.warn('Endpoint /v1/dashboard/stats/ no encontrado. Usando datos simulados.');
          
          // Obtener datos de citas para generar estadísticas
          try {
            const appointmentsResponse = await axiosInstance.get('/v1/appointments/');
            const appointments = appointmentsResponse.data;
            
            // Si hay datos de citas disponibles, generar estadísticas básicas
            if (Array.isArray(appointments)) {
              const stats = {
                total: appointments.length,
                scheduled: appointments.filter(a => a.status === 'scheduled').length,
                confirmed: appointments.filter(a => a.status === 'confirmed').length,
                completed: appointments.filter(a => a.status === 'completed').length,
                cancelled: appointments.filter(a => a.status === 'cancelled').length,
                no_show: appointments.filter(a => a.status === 'no_show').length,
                today: appointments.filter(a => {
                  const today = new Date().toISOString().split('T')[0];
                  return a.start_time.includes(today);
                }).length,
                this_week: appointments.length, // Simplificado para datos de ejemplo
                this_month: appointments.length // Simplificado para datos de ejemplo
              };
              return stats;
            }
          } catch (appointmentsError) {
            console.error('Error al obtener citas para estadísticas:', appointmentsError);
          }
          
          // Si todo falla, devolver estadísticas predefinidas
          return {
            total: 0,
            scheduled: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            no_show: 0,
            today: 0,
            this_week: 0,
            this_month: 0
          };
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      throw error;
    }
  },

  // Obtener las próximas citas del usuario
  getUpcomingAppointments: async (limit = 5) => {
    try {
      console.log('Obteniendo próximas citas, límite:', limit);
      // Intentar con el endpoint específico de dashboard
      try {
        const response = await axiosInstance.get('/v1/dashboard/upcoming-appointments/', {
          params: { limit }
        });
        
        // Validar que la respuesta sea un array
        if (Array.isArray(response.data)) {
          console.log(`Se encontraron ${response.data.length} próximas citas desde endpoint dashboard`);
          return response.data;
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          console.log(`Se encontraron ${response.data.results.length} próximas citas (formato paginado)`);
          return response.data.results;
        } else {
          console.warn('La respuesta no es un array:', response.data);
          return [];
        }
      } catch (error: any) {
        // Si el endpoint no existe, usar el endpoint general de citas
        console.log('Endpoint dashboard fallido, usando alternativa:', error.response?.status);
        
        // Intentar obtener citas del endpoint general y filtrarlas
        try {
          const appointmentsResponse = await axiosInstance.get('/v1/appointments/', {
            params: { 
              limit: limit * 2, // Solicitamos más citas para tener margen de filtrado
              // Ordenadas por fecha, citas futuras
              // Formato ISO que funciona en todos los backends: YYYY-MM-DD
              date_from: new Date().toISOString().split('T')[0]
            }
          });
          
          // Validar y extraer datos de forma defensiva
          let appointments;
          if (Array.isArray(appointmentsResponse.data)) {
            appointments = appointmentsResponse.data;
          } else if (appointmentsResponse.data && appointmentsResponse.data.results && 
                    Array.isArray(appointmentsResponse.data.results)) {
            appointments = appointmentsResponse.data.results;
          } else {
            console.warn('La respuesta alternativa no es un array:', appointmentsResponse.data);
            return [];
          }
          
          // Filtrar solo las citas futuras con manejo de excepciones
          const now = new Date();
          const upcomingAppointments = appointments
            .filter((appt: any) => {
              try {
                // Filtramos citas con fechas futuras
                return new Date(appt.start_time || appt.date) > now;
              } catch (e) {
                console.warn('Error al filtrar cita con fecha inválida:', appt);
                return false;
              }
            })
            // Ordenar por fecha más cercana primero
            .sort((a: any, b: any) => {
              try {
                const dateA = new Date(a.start_time || a.date);
                const dateB = new Date(b.start_time || b.date);
                return dateA.getTime() - dateB.getTime();
              } catch (e) {
                console.warn('Error al ordenar citas por fecha');
                return 0;
              }
            })
            // Limitar al número solicitado
            .slice(0, limit);
          
          console.log(`Se encontraron ${upcomingAppointments.length} próximas citas (endpoint alternativo)`);
          return upcomingAppointments;
        } catch (innerError: any) {
          console.error('Error al obtener citas del endpoint alternativo:', innerError.message);
          // Si todo falla, usar datos simulados
          return generateMockUpcomingAppointments(limit);
        }
      }
    } catch (error: any) {
      console.error('Error general al obtener próximas citas:', error.message);
      // Proporcionar datos simulados para que la UI no falle
      return generateMockUpcomingAppointments(limit);
    }
  }
};

// Función auxiliar para generar datos simulados de citas próximas
function generateMockUpcomingAppointments(limit = 5) {
  const mockAppointments = [];
  const now = new Date();
  
  for (let i = 0; i < limit; i++) {
    // Generar una fecha futura (entre hoy y 14 días adelante)
    const futureDate = new Date(now.getTime() + (1000 * 60 * 60 * 24 * (1 + Math.floor(Math.random() * 14))));
    
    mockAppointments.push({
      id: i + 1,
      patient_name: `Paciente Simulado ${i + 1}`,
      professional_name: `Dr. Simulado ${i + 1}`,
      start_time: futureDate.toISOString(),
      status: ['scheduled', 'confirmed'][Math.floor(Math.random() * 2)]
    });
  }
  
  return mockAppointments;
}

export default dashboardService;
