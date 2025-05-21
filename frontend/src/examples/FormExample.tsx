import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

import FormField from '../components/common/FormField';
import useForm from '../hooks/useForm';
import { validationRules, ValidationSchema } from '../utils/validation';
import { useNotification } from '../context/NotificationContext';
import appointmentService from '../services/api/appointmentService';
import professionalService from '../services/api/professionalService';
import patientService from '../services/api/patientService';

// Definir el esquema de validación para el formulario de citas
const appointmentSchema: ValidationSchema = {
  patient_id: [validationRules.required('El paciente es obligatorio')],
  professional_id: [validationRules.required('El profesional es obligatorio')],
  date: [
    validationRules.required('La fecha es obligatoria'),
    validationRules.isDate('Debe ser una fecha válida')
  ],
  time: [validationRules.required('La hora es obligatoria')],
  reason: [
    validationRules.required('El motivo de la consulta es obligatorio'),
    validationRules.minLength(5, 'El motivo debe tener al menos 5 caracteres'),
    validationRules.maxLength(200, 'El motivo no debe exceder los 200 caracteres')
  ]
};

/**
 * Ejemplo de formulario utilizando nuestras utilidades
 */
const FormExample: React.FC = () => {
  // Estado para datos dinámicos que cargaremos de la API
  const [patients, setPatients] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Obtener función para mostrar notificaciones
  const { showNotification } = useNotification();
  
  // Valores iniciales para el formulario
  const initialValues = {
    patient_id: '',
    professional_id: '',
    date: null,
    time: null,
    reason: '',
    notes: '',
    status: 'scheduled'
  };
  
  // Usar nuestro hook de formulario personalizado
  const {
    values,
    handleChange,
    handleBlur,
    handleSubmit,
    errors,
    hasError,
    getErrorMessage,
    resetForm,
    isValid
  } = useForm(initialValues, appointmentSchema, onSubmit);
  
  // Cargar datos de pacientes y profesionales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar pacientes y profesionales en paralelo
        const [patientsData, professionalsData] = await Promise.all([
          patientService.getAll(),
          professionalService.getAll()
        ]);
        
        setPatients(patientsData);
        setProfessionals(professionalsData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showNotification({
          message: 'Error al cargar datos necesarios para el formulario',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [showNotification]);
  
  // Función para manejar el envío del formulario
  async function onSubmit(values: any, errors: any) {
    // Verificar si hay errores de validación
    if (Object.values(errors).some(error => error !== null)) {
      showNotification({
        message: 'Por favor corrija los errores del formulario',
        severity: 'warning'
      });
      return;
    }
    
    setSubmitting(true);
    setApiError(null);
    
    try {
      // Preparar los datos para enviar a la API
      const appointmentData = {
        ...values,
        // Combinar fecha y hora en un solo valor ISO para la API
        start_time: values.date && values.time ? 
          new Date(
            values.date.getFullYear(), 
            values.date.getMonth(), 
            values.date.getDate(),
            values.time.getHours(),
            values.time.getMinutes()
          ).toISOString() : null,
        // Calcular end_time (por ejemplo, 30 minutos después)
        end_time: values.date && values.time ? 
          new Date(
            values.date.getFullYear(), 
            values.date.getMonth(), 
            values.date.getDate(),
            values.time.getHours(),
            values.time.getMinutes() + 30
          ).toISOString() : null
      };
      
      // Eliminar propiedades temporales que no necesita la API
      delete appointmentData.date;
      delete appointmentData.time;
      
      // Enviar datos a la API
      const response = await appointmentService.create(appointmentData);
      
      // Mostrar mensaje de éxito
      showNotification({
        message: 'Cita creada exitosamente',
        severity: 'success'
      });
      
      // Restablecer el formulario
      resetForm();
      
      // Mostrar mensaje de éxito en el formulario
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (error: any) {
      console.error('Error al crear la cita:', error);
      
      // Manejar errores de la API
      setApiError(
        error.response?.data?.detail || 
        'Ha ocurrido un error al crear la cita. Por favor intente nuevamente.'
      );
      
      showNotification({
        message: 'Error al crear la cita',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  }
  
  // Opciones para los selectores
  const patientOptions = patients.map(patient => ({
    value: patient.id,
    label: `${patient.first_name} ${patient.last_name}`
  }));
  
  const professionalOptions = professionals.map(professional => ({
    value: professional.id,
    label: `${professional.first_name} ${professional.last_name} - ${professional.specialty}`
  }));
  
  // Opciones para el estado de la cita
  const statusOptions = [
    { value: 'scheduled', label: 'Programada' },
    { value: 'confirmed', label: 'Confirmada' },
    { value: 'cancelled', label: 'Cancelada' }
  ];
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Ejemplo de Formulario de Citas
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {apiError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {apiError}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            La cita se ha creado exitosamente.
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormField
                type="select"
                name="patient_id"
                label="Paciente"
                value={values.patient_id}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getErrorMessage('patient_id')}
                options={patientOptions}
                required
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormField
                type="select"
                name="professional_id"
                label="Profesional"
                value={values.professional_id}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getErrorMessage('professional_id')}
                options={professionalOptions}
                required
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormField
                type="date"
                name="date"
                label="Fecha"
                value={values.date}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getErrorMessage('date')}
                required
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormField
                type="time"
                name="time"
                label="Hora"
                value={values.time}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getErrorMessage('time')}
                required
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormField
                type="textarea"
                name="reason"
                label="Motivo de la consulta"
                value={values.reason}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getErrorMessage('reason')}
                rows={3}
                required
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormField
                type="textarea"
                name="notes"
                label="Notas adicionales"
                value={values.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                disabled={submitting}
                helperText="Información adicional relevante para la cita (opcional)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormField
                type="select"
                name="status"
                label="Estado"
                value={values.status}
                onChange={handleChange}
                onBlur={handleBlur}
                options={statusOptions}
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={resetForm}
                disabled={submitting}
              >
                Limpiar
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={submitting || !isValid}
              >
                {submitting ? 'Enviando...' : 'Crear Cita'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default FormExample;
