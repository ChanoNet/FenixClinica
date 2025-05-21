import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/api/config';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, addMinutes } from 'date-fns';
import appointmentService from '../../services/api/appointmentService';
import professionalService from '../../services/api/professionalService';
import patientService from '../../services/api/patientService';
import { useAuth } from '../../context/AuthContext';

// Datos simulados como fallback en caso de error de API
const mockProfessionals = [
  { id: 1, first_name: 'María', last_name: 'García', specialty: 'Cardiología' },
  { id: 2, first_name: 'Carlos', last_name: 'López', specialty: 'Pediatría' },
  { id: 3, first_name: 'Ana', last_name: 'Martínez', specialty: 'Dermatología' },
];

const mockPatients = [
  { id: 101, first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com' },
  { id: 102, first_name: 'Laura', last_name: 'Rodríguez', email: 'laura@example.com' },
  { id: 103, first_name: 'Roberto', last_name: 'Fernández', email: 'roberto@example.com' },
];

const AppointmentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    professionalId: '',
    patientId: '',
    startDate: new Date(),
    endDate: addMinutes(new Date(), 30),
    reason: '',
    notes: ''
  });
  
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  
  // Cargar datos cuando se está editando
  useEffect(() => {
    const loadAppointmentData = async () => {
      // Verificar si hay datos precargados para edición alternativa (desde localStorage)
      const storedEditData = localStorage.getItem('editAppointmentData');
      if (storedEditData) {
        try {
          console.log('Encontrados datos precargados en localStorage');
          const editData = JSON.parse(storedEditData);
          
          // Establecer los datos del formulario con la información almacenada
          setFormData({
            professionalId: editData.professionalId.toString(),
            patientId: editData.patientId.toString(),
            startDate: new Date(editData.startTime),
            endDate: new Date(editData.endTime),
            reason: editData.reason || '',
            notes: editData.notes || ''
          });
          
          // Eliminar los datos precargados para evitar confusiones en futuras creaciones
          localStorage.removeItem('editAppointmentData');
          
          console.log('Datos precargados aplicados correctamente');
          return;
        } catch (parseError) {
          console.error('Error al procesar datos precargados:', parseError);
          localStorage.removeItem('editAppointmentData');
        }
      }
      
      // Continuar con la carga normal para modo edición si no había datos precargados
      if (!isEditing || !id) {
        console.log('No estamos en modo edición, omitiendo carga de datos');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Intentando cargar datos de la cita ID: ${id}`);
        
        // Obtener los datos de la cita existente desde la API
        let appointmentData;
        try {
          appointmentData = await appointmentService.getById(id);
          console.log('Datos de cita recibidos correctamente:', appointmentData);
        } catch (apiError) {
          console.error('Error en la API al obtener datos de la cita:', apiError);
          throw new Error('No se pudo obtener la información de la cita desde el servidor');
        }
        
        // Verificar que tenemos datos válidos
        if (!appointmentData) {
          console.error('No se recibieron datos de la cita');
          throw new Error('No se recibieron datos de la cita');
        }
        
        // Manejar profesional
        let professionalId = '';
        if (appointmentData.professional) {
          if (typeof appointmentData.professional === 'object' && appointmentData.professional.id) {
            professionalId = appointmentData.professional.id.toString();
          } else if (typeof appointmentData.professional === 'number') {
            professionalId = appointmentData.professional.toString();
          } else if (typeof appointmentData.professional === 'string') {
            professionalId = appointmentData.professional;
          }
        }
        
        // Manejar paciente
        let patientId = '';
        if (appointmentData.patient) {
          if (typeof appointmentData.patient === 'object' && appointmentData.patient.id) {
            patientId = appointmentData.patient.id.toString();
          } else if (typeof appointmentData.patient === 'number') {
            patientId = appointmentData.patient.toString();
          } else if (typeof appointmentData.patient === 'string') {
            patientId = appointmentData.patient;
          }
        }
        
        // Verificar que tenemos los IDs necesarios
        if (!professionalId) {
          console.error('No se pudo determinar el ID del profesional', appointmentData.professional);
        } else {
          console.log('ID del profesional obtenido:', professionalId);
        }
        
        if (!patientId) {
          console.error('No se pudo determinar el ID del paciente', appointmentData.patient);
        } else {
          console.log('ID del paciente obtenido:', patientId);
        }
        
        // Manejar fechas
        let startDate: Date;
        let endDate: Date;
        
        try {
          startDate = appointmentData.start_time ? new Date(appointmentData.start_time) : new Date();
          if (isNaN(startDate.getTime())) {
            console.warn('Fecha de inicio inválida, usando fecha actual');
            startDate = new Date();
          }
        } catch (dateError) {
          console.error('Error al procesar fecha de inicio:', dateError);
          startDate = new Date();
        }
        
        try {
          endDate = appointmentData.end_time ? new Date(appointmentData.end_time) : addMinutes(startDate, 30);
          if (isNaN(endDate.getTime())) {
            console.warn('Fecha de fin inválida, usando fecha de inicio + 30 min');
            endDate = addMinutes(startDate, 30);
          }
        } catch (dateError) {
          console.error('Error al procesar fecha de fin:', dateError);
          endDate = addMinutes(startDate, 30);
        }
        
        // Establecer los datos del formulario
        console.log('Configurando formulario con datos:', {
          professionalId,
          patientId,
          startDate,
          endDate,
          reason: appointmentData.reason || '',
          notes: appointmentData.notes || ''
        });
        
        setFormData({
          professionalId,
          patientId,
          startDate,
          endDate,
          reason: appointmentData.reason || '',
          notes: appointmentData.notes || ''
        });
        
        console.log('Datos cargados exitosamente');
      } catch (error: any) {
        console.error('Error al procesar los datos de la cita:', error);
        setError(error.message || 'Error al cargar los datos de la cita');
        
        // Establecer valores por defecto para evitar quedarse sin formulario
        setFormData({
          professionalId: '',
          patientId: '',
          startDate: new Date(),
          endDate: addMinutes(new Date(), 30),
          reason: '',
          notes: ''
        });
      } finally {
        setLoading(false);
      }
    };
    
    const loadReferenceData = async () => {
      try {
        // Cargar profesionales desde la API
        const professionalsData = await professionalService.getAll();
        setProfessionals(professionalsData);
        
        // Cargar pacientes desde la API o preseleccionar si el usuario es paciente
        if (user?.role === 'patient') {
          const patientData = [{ 
            id: user.id, 
            first_name: user.first_name, 
            last_name: user.last_name,
            email: user.email
          }];
          setPatients(patientData);
          setFormData(prevData => ({ ...prevData, patientId: user.id.toString() }));
        } else {
          const patientsData = await patientService.getAll();
          setPatients(patientsData);
        }
      } catch (error) {
        console.error('Error al cargar datos de referencia:', error);
        // Usar datos simulados como fallback
        setProfessionals(mockProfessionals);
        setPatients(mockPatients);
      }
    };
    
    loadAppointmentData();
    loadReferenceData();
  }, [isEditing, id, user]);
  
  // Manejar cambios en campos de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Manejar cambios en selects
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleStartDateChange = (newDate: Date | null) => {
    if (newDate) {
      const newEndDate = addMinutes(newDate, 30);
      setFormData({
        ...formData,
        startDate: newDate,
        endDate: newEndDate
      });
    }
  };
  
  const handleEndDateChange = (newDate: Date | null) => {
    if (newDate) {
      setFormData({
        ...formData,
        endDate: newDate
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.professionalId || !formData.patientId) {
      setError('Por favor selecciona un profesional y un paciente');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Preparar los datos para enviar a la API
      const appointmentData = {
        professional: parseInt(formData.professionalId),
        patient: parseInt(formData.patientId),
        start_time: formData.startDate.toISOString(),
        end_time: formData.endDate.toISOString(),
        reason: formData.reason,
        notes: formData.notes
      };
      
      console.log('Datos de la cita a guardar:', appointmentData);
      
      if (!isEditing) {
        // CASO 1: Crear una nueva cita
        console.log('Creando nueva cita...');
        await appointmentService.create(appointmentData);
        console.log('Cita creada exitosamente');
      } else if (id) {
        // CASO 2: Actualizar una cita existente
        console.log(`Actualizando cita existente ID: ${id}`);
        
        // Usar directamente el endpoint que sabemos que funciona
        const endpoint = `/v1/appointments/appointments/${id}/`;
        console.log(`Usando endpoint: ${endpoint}`);
        
        await axiosInstance.put(endpoint, appointmentData);
        console.log('Cita actualizada exitosamente');
      }
      
      setSuccess(true);
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (error: any) {
      console.error('Error al guardar la cita:', error);
      setError(error.response?.data?.detail || 'Error al guardar la cita');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/appointments')}
          >
            Citas
          </Link>
          <Typography color="text.primary">{isEditing ? 'Editar cita' : 'Nueva cita'}</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" sx={{ mt: 2, fontWeight: 'bold' }}>
          {isEditing ? 'Editar cita' : 'Nueva cita'}
        </Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {isEditing ? 'Cita actualizada correctamente' : 'Cita creada correctamente'}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="professional-label">Profesional</InputLabel>
                  <Select
                    labelId="professional-label"
                    id="professionalId"
                    name="professionalId"
                    value={formData.professionalId}
                    label="Profesional"
                    onChange={handleSelectChange}
                    disabled={submitting}
                  >
                    {professionals.map(professional => (
                      <MenuItem key={professional.id} value={professional.id.toString()}>
                        {`${professional.first_name} ${professional.last_name} (${professional.specialty})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="patient-label">Paciente</InputLabel>
                  <Select
                    labelId="patient-label"
                    id="patientId"
                    name="patientId"
                    value={formData.patientId}
                    label="Paciente"
                    onChange={handleSelectChange}
                    disabled={submitting}
                  >
                    {patients.map(patient => (
                      <MenuItem key={patient.id} value={patient.id.toString()}>
                        {`${patient.first_name} ${patient.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DateTimePicker
                    label="Fecha y hora de inicio"
                    value={formData.startDate}
                    onChange={handleStartDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        disabled: submitting
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DateTimePicker
                    label="Fecha y hora de fin"
                    value={formData.endDate}
                    onChange={handleEndDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        disabled: submitting
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motivo de la consulta"
                  name="reason"
                  value={formData.reason}
                  onChange={handleTextChange}
                  required
                  multiline
                  rows={2}
                  disabled={submitting}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas adicionales"
                  name="notes"
                  value={formData.notes}
                  onChange={handleTextChange}
                  multiline
                  rows={3}
                  disabled={submitting}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/appointments')}
                disabled={submitting}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : isEditing ? 'Guardar cambios' : 'Crear cita'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AppointmentFormPage;
