import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Chip,
  Button,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Refresh as RefreshIcon,
  Add as AddIcon,
  FilterList as FilterListIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import appointmentService from '../../services/api/appointmentService';
import dashboardService from '../../services/api/dashboardService';
import patientService from '../../services/api/patientService';
import professionalService from '../../services/api/professionalService';
import axiosInstance from '../../services/api/config';
import AppointmentsList from '../../components/appointments/AppointmentsList';
import AppointmentsCalendar from '../../components/appointments/AppointmentsCalendar';

// Simulación de datos de citas
const mockAppointments = [
  {
    id: 1,
    patient: {
      id: 101,
      first_name: 'Juan',
      last_name: 'Pérez',
      email: 'juan@example.com'
    },
    professional: {
      id: 201,
      first_name: 'María',
      last_name: 'García',
      specialty: 'Cardiología'
    },
    start_time: '2025-05-20T14:30:00',
    end_time: '2025-05-20T15:00:00',
    status: 'scheduled'
  },
  {
    id: 2,
    patient: {
      id: 102,
      first_name: 'Laura',
      last_name: 'Rodríguez',
      email: 'laura@example.com'
    },
    professional: {
      id: 202,
      first_name: 'Carlos',
      last_name: 'López',
      specialty: 'Pediatría'
    },
    start_time: '2025-05-21T10:00:00',
    end_time: '2025-05-21T10:30:00',
    status: 'confirmed'
  },
  {
    id: 3,
    patient: {
      id: 103,
      first_name: 'Roberto',
      last_name: 'Fernández',
      email: 'roberto@example.com'
    },
    professional: {
      id: 203,
      first_name: 'Ana',
      last_name: 'Martínez',
      specialty: 'Dermatología'
    },
    start_time: '2025-05-22T16:15:00',
    end_time: '2025-05-22T16:45:00',
    status: 'scheduled'
  }
];

// Tipos para mejorar la tipificación
interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
}

interface Professional {
  id: number;
  first_name: string;
  last_name: string;
  specialty?: string;
  email?: string;
}

interface Appointment {
  id: number;
  patient: number | Patient;
  professional: number | Professional;
  start_time: string;
  end_time?: string;
  status: string;
  reason?: string;
  notes?: string;
}

// Componente principal
const AppointmentsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>([]);
  const [patientsData, setPatientsData] = useState<Patient[]>([]);
  const [professionalsData, setProfessionalsData] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrichedAppointments, setEnrichedAppointments] = useState<any[]>([]);

  // Función para cargar los datos completos de pacientes
  const fetchPatients = async () => {
    try {
      console.log('Cargando datos de pacientes...');
      const allPatients = await patientService.getAll();
      console.log(`Se cargaron ${allPatients.length} pacientes`);
      setPatientsData(allPatients);
      return allPatients;
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      return [];
    }
  };

  // Función para cargar los datos completos de profesionales
  const fetchProfessionals = async () => {
    try {
      console.log('Cargando datos de profesionales...');
      const allProfessionals = await professionalService.getAll();
      console.log(`Se cargaron ${allProfessionals.length} profesionales`);
      setProfessionalsData(allProfessionals);
      return allProfessionals;
    } catch (error) {
      console.error('Error al cargar profesionales:', error);
      return [];
    }
  };

  // Función para enriquecer las citas con datos completos de pacientes y profesionales
  const enrichAppointments = (appointments: Appointment[], patients: Patient[], professionals: Professional[]) => {
    console.log('=== ENRIQUECIENDO CITAS ===');
    console.log(`Total de citas a enriquecer: ${appointments.length}`);
    console.log(`Datos disponibles: ${patients.length} pacientes, ${professionals.length} profesionales`);
    
    // Asegurar que los datos sean arrays
    if (!Array.isArray(appointments)) {
      console.error('enrichAppointments recibió datos de citas que no son un array:', appointments);
      return [];
    }
    
    if (!Array.isArray(patients)) {
      console.error('enrichAppointments recibió datos de pacientes que no son un array:', patients);
      patients = [];
    }
    
    if (!Array.isArray(professionals)) {
      console.error('enrichAppointments recibió datos de profesionales que no son un array:', professionals);
      professionals = [];
    }
    
    return appointments.map((appointment, index) => {
      // Verificar que appointment sea un objeto válido
      if (!appointment || typeof appointment !== 'object') {
        console.error(`Cita inválida en posición ${index}:`, appointment);
        return appointment; // Devolver como está si no es válida
      }
      
      // Crear una copia para no modificar el objeto original
      const enrichedAppointment = { ...appointment };
      
      // Logs de depuración detallados para citas
      console.log(`Procesando cita #${index} (ID: ${appointment.id || 'sin ID'}):`); 
      console.log(`- Paciente (tipo ${typeof appointment.patient}):`, appointment.patient);
      console.log(`- Profesional (tipo ${typeof appointment.professional}):`, appointment.professional);
      
      // =====================================================================
      // ENRIQUECIMIENTO DE DATOS DEL PACIENTE
      // =====================================================================
      
      // CASO 1: El paciente es un número (ID)
      if (typeof appointment.patient === 'number') {
        const patientId = appointment.patient;
        const patientData = patients.find(p => p.id === patientId);
        
        if (patientData) {
          console.log(`✓ Encontrado paciente ID ${patientId}: ${patientData.first_name || ''} ${patientData.last_name || ''}`);
          enrichedAppointment.patient = patientData;
        } else {
          console.warn(`⚠ No se encontró información para el paciente ID ${patientId}, creando datos básicos`);
          enrichedAppointment.patient = {
            id: patientId,
            first_name: `Paciente`,
            last_name: `#${patientId}`
          };
        }
      }
      // CASO 2: El paciente ya es un objeto pero le faltan campos
      else if (typeof appointment.patient === 'object' && appointment.patient !== null) {
        // El paciente ya es un objeto, verificar que tenga todos los campos necesarios
        const patientObj = appointment.patient as any;
        
        if (!patientObj.first_name || !patientObj.last_name) {
          console.log('⚠ Datos incompletos del paciente, buscando datos adicionales');
          // Intentar buscar más datos del paciente por su ID
          if (patientObj.id) {
            const fullPatientData = patients.find(p => p.id === patientObj.id);
            
            if (fullPatientData) {
              console.log(`✓ Completando datos del paciente ID ${patientObj.id}`);
              enrichedAppointment.patient = {
                ...patientObj,
                ...fullPatientData // Combinar preservando los datos originales
              };
            }
          }
          
          // Asegurar que tenga al menos nombre y apellido
          // Comprobando que el paciente sea un objeto antes de asignar propiedades
          if (typeof enrichedAppointment.patient === 'object' && !enrichedAppointment.patient.first_name) {
            (enrichedAppointment.patient as Patient).first_name = 'Paciente';
          }
          
          if (typeof enrichedAppointment.patient === 'object' && !enrichedAppointment.patient.last_name) {
            (enrichedAppointment.patient as Patient).last_name = `#${patientObj.id || 'sin ID'}`;
          }
        }
      }
      // CASO 3: No hay datos del paciente
      else if (!appointment.patient) {
        console.warn('⚠ Cita sin datos de paciente, asignando valores predeterminados');
        enrichedAppointment.patient = {
          id: 0,
          first_name: 'Paciente',
          last_name: 'Sin Asignar'
        };
      }
      
      // =====================================================================
      // ENRIQUECIMIENTO DE DATOS DEL PROFESIONAL
      // =====================================================================
      
      // CASO 1: El profesional es un número (ID)
      if (typeof appointment.professional === 'number') {
        const professionalId = appointment.professional;
        let professionalData = professionals.find(p => p.id === professionalId);
        
        if (professionalData) {
          console.log(`✓ Encontrado profesional ID ${professionalId}: ${professionalData.first_name || ''} ${professionalData.last_name || ''}`);
          
          // Asegurar que tenga especialidad
          if (!professionalData.specialty) {
            const specialtyFromOtherData = professionals.find(p => 
              p.id === professionalId && (p.specialty || (p as any).specialty_name)
            );
            
            if (specialtyFromOtherData) {
              const specialty = specialtyFromOtherData.specialty || (specialtyFromOtherData as any).specialty_name;
              
              if (specialty) {
                console.log(`✓ Añadiendo especialidad para profesional ID ${professionalId}`);
                professionalData = {
                  ...professionalData,
                  specialty: specialty
                };
              }
            } else {
              professionalData.specialty = 'Especialidad Médica';
            }
          }
          
          enrichedAppointment.professional = professionalData;
        } else {
          console.warn(`⚠ No se encontró información para el profesional ID ${professionalId}, creando datos básicos`);
          enrichedAppointment.professional = {
            id: professionalId,
            first_name: `Dr./Dra.`,
            last_name: `#${professionalId}`,
            specialty: 'Especialidad no disponible'
          };
        }
      }
      // CASO 2: El profesional ya es un objeto pero le faltan campos
      else if (typeof appointment.professional === 'object' && appointment.professional !== null) {
        // El profesional ya es un objeto, verificar que tenga todos los campos necesarios
        const professionalObj = appointment.professional as any;
        
        if (!professionalObj.first_name || !professionalObj.last_name || !professionalObj.specialty) {
          console.log('⚠ Datos incompletos del profesional, buscando datos adicionales');
          // Intentar buscar más datos del profesional por su ID
          if (professionalObj.id) {
            const fullProfessionalData = professionals.find(p => p.id === professionalObj.id);
            
            if (fullProfessionalData) {
              console.log(`✓ Completando datos del profesional ID ${professionalObj.id}`);
              enrichedAppointment.professional = {
                ...professionalObj,
                ...fullProfessionalData // Combinar preservando los datos originales
              };
            }
          }
          
          // Asegurar que tenga al menos nombre, apellido y especialidad
          // Comprobando que el profesional sea un objeto antes de asignar propiedades
          if (typeof enrichedAppointment.professional === 'object' && !enrichedAppointment.professional.first_name) {
            (enrichedAppointment.professional as Professional).first_name = 'Dr./Dra.';
          }
          
          if (typeof enrichedAppointment.professional === 'object' && !enrichedAppointment.professional.last_name) {
            (enrichedAppointment.professional as Professional).last_name = `#${professionalObj.id || 'sin ID'}`;
          }
          
          if (typeof enrichedAppointment.professional === 'object' && !enrichedAppointment.professional.specialty) {
            (enrichedAppointment.professional as Professional).specialty = 'Especialidad no disponible';
          }
        }
      }
      // CASO 3: No hay datos del profesional
      else if (!appointment.professional) {
        console.warn('⚠ Cita sin datos de profesional, asignando valores predeterminados');
        enrichedAppointment.professional = {
          id: 0,
          first_name: 'Dr./Dra.',
          last_name: 'Sin Asignar',
          specialty: 'Especialidad no disponible'
        };
      }
      
      return enrichedAppointment;
    });
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        console.log('Usuario no autenticado o sin datos completos');
        return;
      }

      setLoading(true);
      try {
        console.log('=== CARGA INICIAL DE CITAS ===');
        console.log('Usuario actual:', { id: user.id, role: user.role, name: user.first_name + ' ' + user.last_name });
        
        // Configurar filtros según el rol del usuario
        const params: any = {};
        if (user.role === 'patient') {
          console.log('Cargando citas como paciente:', user.id);
          params.patient_id = user.id;
        } else if (user.role === 'professional') {
          console.log('Cargando citas como profesional:', user.id);
          params.professional_id = user.id;
        } else if (user.role === 'admin') {
          // El administrador ve todas las citas
          console.log('Cargando TODAS las citas (rol administrador)');
          // No se aplica ningún filtro de usuario
        } else {
          console.log('Rol de usuario desconocido o no especificado:', user.role);
        }
        
        // Para tener mayor probabilidad de éxito, intentaremos varios métodos
        let appointmentsData = [];
        let success = false;

        // Método 1: Usar el servicio de citas directo
        try {
          console.log('Método 1: Cargando citas desde appointmentService con parámetros:', params);
          const response = await appointmentService.getAll(params);
          
          if (Array.isArray(response) && response.length > 0) {
            console.log(`Éxito! Se obtuvieron ${response.length} citas con Método 1`);
            appointmentsData = response;
            success = true;
          } else {
            console.warn('Método 1: La respuesta está vacía o no es un array');
          }
        } catch (error) {
          console.error('Error con Método 1:', error);
        }

        // Método 2: Si no hay datos, probar con el dashboard
        if (!success) {
          try {
            console.log('Método 2: Intentando cargar desde dashboardService...');
            const dashboardResponse = await dashboardService.getUpcomingAppointments();
            
            if (Array.isArray(dashboardResponse) && dashboardResponse.length > 0) {
              console.log(`Éxito! Se obtuvieron ${dashboardResponse.length} citas con Método 2`);
              appointmentsData = dashboardResponse;
              success = true;
            } else {
              console.warn('Método 2: La respuesta está vacía o no es un array');
            }
          } catch (dashboardError) {
            console.error('Error con Método 2:', dashboardError);
          }
        }
        
        // Método 3: Si todo falla, probar con un endpoint sin filtros (solo para admins)
        if (!success && user.role === 'admin') {
          try {
            console.log('Método 3: Último intento - Cargando todas las citas sin filtros');
            const allResponse = await axiosInstance.get('/v1/appointments/');
            
            if (allResponse.data && Array.isArray(allResponse.data) && allResponse.data.length > 0) {
              console.log(`Éxito! Se obtuvieron ${allResponse.data.length} citas con Método 3`);
              appointmentsData = allResponse.data;
              success = true;
            } else if (allResponse.data?.results && Array.isArray(allResponse.data.results)) {
              console.log(`Éxito! Se obtuvieron ${allResponse.data.results.length} citas paginadas con Método 3`);
              appointmentsData = allResponse.data.results;
              success = true;
            } else {
              console.warn('Método 3: La respuesta está vacía o no tiene el formato esperado');
            }
          } catch (directError) {
            console.error('Error con Método 3:', directError);
          }
        }
        
        console.log(`Se obtuvieron ${appointmentsData.length} citas`);
        
        // PASO 1: Asegúrarnos que todos los datos tienen formato consistente
        const sanitizedAppointments = appointmentsData.map((appointment: any, index: number) => {
          // Si no hay ID, intentar usar PK (algunos backends usan 'pk' en lugar de 'id')
          if (!appointment.id && appointment.pk) {
            appointment.id = appointment.pk;
          }
          
          // Asegurarse que exista start_time (algunas APIs usan 'date' en su lugar)
          if (!appointment.start_time && appointment.date) {
            appointment.start_time = appointment.date;
          }
          
          // Asegurarse que existe un status
          if (!appointment.status) {
            appointment.status = 'scheduled'; // valor por defecto
          }
          
          // Validar que tanto patient como professional existan
          if (!appointment.patient) {
            console.warn(`Cita #${index+1} sin paciente asignado, asignando valor por defecto`);
            appointment.patient = { id: 0, first_name: 'Paciente', last_name: 'No Asignado' };
          }
          
          if (!appointment.professional) {
            console.warn(`Cita #${index+1} sin profesional asignado, asignando valor por defecto`);
            appointment.professional = { id: 0, first_name: 'Profesional', last_name: 'No Asignado', specialty: 'No Especificada' };
          }
          
          // Información de diagnóstico detallada
          console.log(`Cita #${index + 1} (ID: ${appointment.id || 'sin ID'}):`, {
            id: appointment.id,
            pk: appointment.pk,
            patient: typeof appointment.patient === 'object' ? appointment.patient.id : appointment.patient,
            patientType: typeof appointment.patient,
            professional: typeof appointment.professional === 'object' ? appointment.professional.id : appointment.professional,
            professionalType: typeof appointment.professional,
            specialtyDirecta: appointment.specialty,
            specialtyEnProf: typeof appointment.professional === 'object' ? appointment.professional.specialty : null,
            status: appointment.status,
            date: appointment.start_time || appointment.date
          });
          
          // Guardar en localStorage cada cita para acceso rápido en la página de detalles
          try {
            if (appointment.id) {
              localStorage.setItem(
                `appointment_${appointment.id}`, 
                JSON.stringify(appointment)
              );
              console.log(`Cita #${appointment.id} guardada en localStorage para acceso rápido`);
            }
          } catch (storageError) {
            console.warn('Error al guardar cita en localStorage:', storageError);
          }
          
          return appointment;
        });
        
        // PASO 2: Cargar datos de pacientes y profesionales en paralelo
        console.log('Cargando datos de pacientes y profesionales...');
        const [patients, professionals] = await Promise.all([
          fetchPatients(),
          fetchProfessionals()
        ]);
        
        // PASO 3: Enriquecer citas con datos completos
        console.log('Enriqueciendo citas con datos de pacientes y profesionales...');
        const enrichedData = enrichAppointments(sanitizedAppointments, patients, professionals);
        
        // PASO 4: Verificar que los datos enriquecidos sean válidos
        const validAppointments = enrichedData.filter(appointment => {
          // Verificar que tenga ID y fechas válidas
          const isValid = !!appointment.id && !!appointment.start_time;
          if (!isValid) {
            console.warn('Cita con datos inválidos eliminada:', appointment);
          }
          return isValid;
        });
        
        console.log(`Finalizado: ${validAppointments.length} citas válidas listas para mostrar`);
        
        // Actualizar estado con los datos validados y enriquecidos
        setAppointmentsData(validAppointments);
      } catch (error) {
        console.error('Error al cargar citas:', error);
        if (process.env.NODE_ENV === 'development') {
          console.log('Usando datos simulados como fallback (solo en desarrollo)');
          setAppointmentsData(mockAppointments);
        } else {
          setAppointmentsData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status === statusFilter ? null : status);
  };

  // Asegurarnos de que appointmentsData es un array antes de aplicar filter
  const safeAppointmentsData = Array.isArray(appointmentsData) ? appointmentsData : [];
  
  // Filtrar citas según la búsqueda y estado
  const filteredAppointments = safeAppointmentsData.filter(appointment => {
    let matchesSearch = searchQuery === '';
    
    if (!matchesSearch) {
      // Obtener nombre del paciente de forma segura
      let patientName = '';
      if (appointment.patient) {
        if (typeof appointment.patient === 'object' && appointment.patient.first_name) {
          patientName = `${appointment.patient.first_name || ''} ${appointment.patient.last_name || ''}`;
        } else if (typeof appointment.patient === 'number') {
          patientName = `Paciente ID: ${appointment.patient}`;
        }
      }
      
      // Obtener nombre del profesional de forma segura
      let professionalName = '';
      if (appointment.professional) {
        if (typeof appointment.professional === 'object' && appointment.professional.first_name) {
          professionalName = `${appointment.professional.first_name || ''} ${appointment.professional.last_name || ''}`;
        } else if (typeof appointment.professional === 'number') {
          professionalName = `Profesional ID: ${appointment.professional}`;
        }
      }
      
      // Verificar si alguno coincide con la búsqueda
      matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     professionalName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    const matchesStatus = statusFilter === null || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Función para refrescar los datos de las citas
  const refreshAppointments = async () => {
    if (!user) {
      console.log('Usuario no autenticado o sin datos completos');
      return;
    }

    setLoading(true);
    try {
      console.log('Actualizando datos de citas...');
      console.log('Usuario actual:', { id: user.id, role: user.role, name: user.first_name + ' ' + user.last_name });
      
      // Filtrar citas según el rol del usuario
      const params: any = {};
      
      if (user.role === 'patient') {
        console.log('Refrescando citas como paciente:', user.id);
        params.patient_id = user.id;
      } else if (user.role === 'professional') {
        console.log('Refrescando citas como profesional:', user.id);
        params.professional_id = user.id;
      } else if (user.role === 'admin') {
        console.log('Refrescando TODAS las citas (admin)');
        // El administrador ve todas las citas, no aplicamos filtro de usuario
      }
      
      // Aplicar filtro de estado si está establecido
      if (statusFilter) {
        params.status = statusFilter;
        console.log('Aplicando filtro de estado:', statusFilter);
      }
      
      // Obtener citas del servicio de API con un timestamp para evitar caché
      const timestamp = new Date().getTime();
      console.log('Solicitando citas con parámetros:', params);
      const data = await appointmentService.getAll(params);
      console.log('Datos de citas actualizados recibidos:', data);
      
      // Asegurarse de que los datos son un array
      if (Array.isArray(data)) {
        console.log(`Se recibieron ${data.length} citas actualizadas`);
        setAppointmentsData(data);
      } else {
        console.warn('La respuesta de citas no es un array o está vacía');
        setAppointmentsData([]);
      }
    } catch (error) {
      console.error('Error al actualizar las citas:', error);
      // Solo usar datos simulados en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Usando datos simulados como fallback (solo en desarrollo)');
        setAppointmentsData(mockAppointments);
      } else {
        // No cambiamos los datos existentes si hay un error
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Citas
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={refreshAppointments}
              sx={{ mr: 1 }}
            >
              Actualizar citas
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/appointments/new')}
            >
              Nueva cita
            </Button>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar por paciente o profesional"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FilterListIcon color="action" />
            <Typography variant="body2" sx={{ mr: 2 }}>Filtros:</Typography>
            
            <Chip 
              label="Programadas" 
              color={statusFilter === 'scheduled' ? 'primary' : 'default'} 
              onClick={() => handleStatusFilter('scheduled')}
              variant={statusFilter === 'scheduled' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Confirmadas" 
              color={statusFilter === 'confirmed' ? 'primary' : 'default'} 
              onClick={() => handleStatusFilter('confirmed')}
              variant={statusFilter === 'confirmed' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Completadas" 
              color={statusFilter === 'completed' ? 'primary' : 'default'} 
              onClick={() => handleStatusFilter('completed')}
              variant={statusFilter === 'completed' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="Canceladas" 
              color={statusFilter === 'cancelled' ? 'primary' : 'default'} 
              onClick={() => handleStatusFilter('cancelled')}
              variant={statusFilter === 'cancelled' ? 'filled' : 'outlined'}
            />
          </Box>
        </Box>

        <Divider />

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Lista" />
          <Tab label="Calendario" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 ? (
            filteredAppointments.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <AppointmentsList 
                  appointments={filteredAppointments} 
                  onRefresh={refreshAppointments}
                />
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="text.secondary">
                  No se encontraron citas con los criterios de búsqueda actuales.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/appointments/new')}
                >
                  Crear nueva cita
                </Button>
              </Box>
            )
          ) : (
            <Box sx={{ mt: 3 }}>
              <AppointmentsCalendar appointments={filteredAppointments} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AppointmentsPage;
