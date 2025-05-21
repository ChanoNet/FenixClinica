import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  SelectChangeEvent
} from '@mui/material';
import { 
  Person as PersonIcon,
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';
import patientService from '../../services/api/patientService';
import authService from '../../services/api/authService';
import axiosInstance from '../../services/api/config';
import { useAuth } from '../../context/AuthContext';

const PatientFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNewPatient = id === 'new';
  const pageTitle = isNewPatient ? 'Crear Nuevo Paciente' : 'Editar Paciente';
  const isSelfEdit = user && id && user.id.toString() === id;
  
  // Simplificamos la lógica de manejo de ID
  // 1. Si estamos editando, confiamos principalmente en el parámetro id de la URL
  // 2. Almacenamos el ID como string para evitar problemas de conversión
  const [patientId, setPatientId] = useState<string | null>(
    isNewPatient ? null : (id || null)
  );
  
  console.log('ID del paciente desde parámetros URL:', id);
  console.log('Estado inicial de patientId:', patientId);
  
  // Actualizado para incluir id como una propiedad opcional
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,  // Añadimos el ID para poder usarlo como respaldo
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    birth_date: null as Date | null,
    gender: '',
    address: '',
    city: '',
    occupation: '',
    emergency_contact: '',
    medical_history: '',
    role: 'patient' // Será patient por defecto
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Log inicial para depurar problemas de URL
  console.log('PatientFormPage - URL actual:', window.location.pathname);
  console.log('PatientFormPage - Parámetro id:', id);
  console.log('PatientFormPage - isNewPatient:', isNewPatient);

  useEffect(() => {
    // Si estamos editando un paciente existente, cargamos sus datos
    if (!isNewPatient && id) {
      const fetchPatientData = async () => {
        setLoading(true);
        try {
          console.log('Cargando paciente con ID:', id);
          console.log('URL completa durante carga:', window.location.href);
          
          // Intentar cargar el paciente
          try {
            const data = await patientService.getById(id);
            console.log('Datos del paciente cargados:', data);
            
            // Validación explícita del objeto data
            if (!data) {
              throw new Error('La respuesta no contiene datos del paciente');
            }
            
            // Guardar el ID del paciente en AMBOS estados
            if (data.id) {
              // 1. Guardar en el estado patientId
              setPatientId(data.id);
              console.log('ID del paciente guardado en patientId:', data.id);
              
              // Transformar la fecha de string a objeto Date y asegurarse de que el ID esté incluido
              const formattedData = {
                ...data,
                id: data.id, // Aseguramos explícitamente que el ID se incluya
                birth_date: data.birth_date ? new Date(data.birth_date) : null
              };
              setFormData(formattedData);
              console.log('formData actualizado con ID:', formattedData);
            } else {
              console.error('El paciente cargado no tiene ID, esto causará problemas al actualizar');
              setError('El paciente cargado no tiene ID. Contacta al administrador del sistema.');
            }
          } catch (apiError: any) {
            console.error('Error en la llamada a la API:', apiError.message);
            setError(`Error al cargar el paciente: ${apiError.message}`);
            setLoading(false);
            return; // Salir temprano para no continuar con el proceso
          }
        } catch (error: any) {
          console.error('Error general al cargar datos del paciente:', error.message);
          setError('No se pudieron cargar los datos del paciente. Por favor, intenta de nuevo.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchPatientData();
    }
  }, [id, isNewPatient]);
  
  // Manejador para campos de texto comunes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Manejador específico para el componente Select de Material UI
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      birth_date: date
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Preparar los datos para enviar
      const dataToSubmit = {
        ...formData,
        // Convertir fecha a formato ISO (YYYY-MM-DD) o undefined (no null)
        birth_date: formData.birth_date 
          ? formData.birth_date.toISOString().split('T')[0] 
          : undefined
      };
      
      console.log('Datos a enviar:', dataToSubmit);
      console.log('¿Es nuevo paciente?:', isNewPatient);
      console.log('¿Es edición propia?:', isSelfEdit);
      console.log('ID del paciente:', patientId);

      // Caso 1: Crear nuevo paciente
      if (isNewPatient) {
        console.log('Creando nuevo paciente');
        await patientService.create(dataToSubmit);
        setSuccessMessage('Paciente creado con éxito');
        setTimeout(() => {
          navigate('/patients');
        }, 1500);
      }
      // Caso 2: Editar un paciente existente
      else {
        // Lógica simplificada: Usamos directamente el ID del parámetro URL
        console.log('Editando paciente existente');
        
        // Validación simple y directa del ID
        if (!id || id === 'new') {
          console.error('ID de paciente no válido en la URL');
          setError('ID de paciente no válido. Por favor, vuelve a la lista de pacientes.');
          throw new Error('ID de paciente no válido en la URL');
        }
        
        // Usar el ID directamente del parámetro de la ruta
        const updateId = id;
        console.log('Usando ID del paciente desde la URL:', updateId);
        
        console.log('ID para actualizar:', updateId);
        
        try {
          // Usamos directamente el método update de patientService que fue mejorado
          // Este método ahora intenta primero con el nuevo endpoint específico para pacientes
          console.log('Actualizando paciente con el método mejorado');
          const result = await patientService.update(updateId, dataToSubmit);
          console.log('Resultado de la actualización:', result);
          
          setSuccessMessage('Paciente actualizado con éxito');
          
          // Opcional: Redireccionar después de la actualización exitosa
          setTimeout(() => {
            navigate('/patients');
          }, 1500);
        } catch (error: any) {
          console.error('Error al actualizar paciente:', error);
          
          // Mostrar el error real al usuario
          setError(`Error al actualizar paciente: ${error.message || 'Error desconocido'} - Revisa los permisos en el backend`);
          
          // El error será manejado por el catch externo
          throw error;
        }
      }
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      setError('Ocurrió un error al guardar los datos. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Breadcrumbs de navegación */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate('/patients')}
          sx={{ cursor: 'pointer' }}
        >
          Pacientes
        </Link>
        <Typography color="text.primary">{pageTitle}</Typography>
      </Breadcrumbs>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1 }} />
          {pageTitle}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/patients')}
        >
          Volver
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Información personal básica */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Nombre"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Apellido"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de nacimiento"
                  value={formData.birth_date}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  label="Género"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="male">Masculino</MenuItem>
                  <MenuItem value="female">Femenino</MenuItem>
                  <MenuItem value="other">Otro</MenuItem>
                  <MenuItem value="prefer_not_to_say">Prefiero no decir</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Dirección y datos de contacto */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ocupación"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contacto de emergencia"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="Nombre y teléfono"
              />
            </Grid>
            
            {/* Historia médica */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Historia médica"
                name="medical_history"
                value={formData.medical_history}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Antecedentes médicos, alergias, medicamentos, etc."
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/patients')}
                sx={{ mr: 2 }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Guardando...' : isNewPatient ? 'Crear Paciente' : 'Actualizar Paciente'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default PatientFormPage;
