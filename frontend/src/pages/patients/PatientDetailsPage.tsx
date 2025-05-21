import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import patientService from '../../services/api/patientService';
import appointmentService from '../../services/api/appointmentService';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  EventAvailable as EventAvailableIcon,
  CalendarToday as CalendarTodayIcon,
  Notes as NotesIcon,
  MedicalServices as MedicalServicesIcon,
  Cake as CakeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos simulados de un paciente
const mockPatient = {
  id: 1,
  first_name: 'Juan',
  last_name: 'PÃ©rez',
  email: 'juan.perez@example.com',
  phone_number: '555-123-4567',
  profile_picture: null,
  birth_date: '1980-05-15',
  address: 'Calle Falsa 123, Ciudad Ejemplo',
  medical_history: [
    {
      id: 1,
      date: '2023-10-15',
      description: 'Consulta por dolor de cabeza recurrente',
      diagnosis: 'MigraÃ±a tensional',
      professional: {
        id: 1,
        first_name: 'MarÃ­a',
        last_name: 'GarcÃ­a',
        specialty: 'NeurologÃ­a'
      }
    },
    {
      id: 2,
      date: '2024-01-20',
      description: 'Control de rutina',
      diagnosis: 'Estado general saludable',
      professional: {
        id: 2,
        first_name: 'Carlos',
        last_name: 'LÃ³pez',
        specialty: 'Medicina General'
      }
    }
  ],
  appointments: [
    {
      id: 1,
      start_time: '2025-06-01T10:00:00',
      end_time: '2025-06-01T10:30:00',
      status: 'scheduled',
      professional: {
        id: 2,
        first_name: 'Carlos',
        last_name: 'LÃ³pez',
        specialty: 'Medicina General'
      }
    },
    {
      id: 2,
      start_time: '2024-09-15T15:00:00',
      end_time: '2024-09-15T15:30:00',
      status: 'completed',
      professional: {
        id: 1,
        first_name: 'MarÃ­a',
        last_name: 'GarcÃ­a',
        specialty: 'NeurologÃ­a'
      }
    }
  ]
};

const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        // Obtener datos del paciente desde la API
        const data = await patientService.getById(Number(id));
        setPatient(data);
        
        // Obtener historial de citas del paciente
        const appointmentsData = await appointmentService.getAll({ patient_id: Number(id) });
        // Actualizar el paciente con sus citas
        setPatient((prevState: any) => ({
          ...prevState,
          appointments: appointmentsData
        }));
      } catch (err) {
        console.error('Error al cargar los detalles del paciente:', err);
        setError('Error al cargar los detalles del paciente');
        // Usar datos simulados como fallback en caso de error
        setPatient(mockPatient);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPatientData();
    }
  }, [id]);
  
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeletePatient = async () => {
    try {
      setActionLoading(true);
      // SimulaciÃ³n de llamada a la API
      setTimeout(() => {
        setActionLoading(false);
        setDeleteDialogOpen(false);
        navigate('/patients', { replace: true });
      }, 1000);
    } catch (err) {
      setError('Error al eliminar el paciente');
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // FunciÃ³n para generar las iniciales a partir del nombre y apellido
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Calcular edad a partir de la fecha de nacimiento
  const calculateAge = (birthDateString: string | null | undefined) => {
    if (!birthDateString) return null;
    
    try {
      const birthDate = new Date(birthDateString);
      
      // Verificar si la fecha es válida
      if (isNaN(birthDate.getTime())) return null;
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error al calcular edad:', error);
      return null;
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en formato';
    }
  };
  
  // Formatear fecha y hora
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return format(date, "dd/MM/yyyy - HH:mm", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha y hora:', error);
      return 'Error en formato';
    }
  };
  
  // Obtener estado en espaÃ±ol
  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programada';
      case 'confirmed':
        return 'Confirmada';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'no_show':
        return 'No asistió';
      default:
        return status;
    }
  };
  
  // Obtener color segÃºn el estado de la cita
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no_show':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/patients')}
          >
            Pacientes
          </Link>
          <Typography color="text.primary">Detalles del paciente</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/patients')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            Detalles del Paciente
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/patients/${id}/edit`)}
              sx={{ mr: 1 }}
            >
              Editar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteDialogOpen}
            >
              Eliminar
            </Button>
          </Box>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : patient ? (
        <>
          {/* InformaciÃ³n principal del paciente */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: '#1976d2',
                      fontSize: '3rem',
                      mb: 2
                    }}
                  >
                    {getInitials(patient.first_name, patient.last_name)}
                  </Avatar>
                  
                  <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
                    {patient.first_name} {patient.last_name}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {patient.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Teléfono
                        </Typography>
                        <Typography variant="body1">
                          {patient.phone_number}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CakeIcon sx={{ mr: 1, color: 'action.active' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Fecha de nacimiento
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(patient.birth_date)}
                          {calculateAge(patient.birth_date) !== null && (
                            <span> ({calculateAge(patient.birth_date)} años)</span>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<EventAvailableIcon />}
                      onClick={() => navigate(`/appointments/new?patient=${patient.id}`)}
                    >
                      Agendar nueva cita
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
          
          {/* PestaÃ±as para historial mÃ©dico y citas */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              aria-label="patient tabs"
            >
              <Tab label="Citas" icon={<CalendarTodayIcon />} iconPosition="start" />
              <Tab label="Historial médico" icon={<MedicalServicesIcon />} iconPosition="start" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Citas del paciente
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<EventAvailableIcon />}
                      onClick={() => navigate(`/appointments/new?patient=${patient.id}`)}
                      size="small"
                    >
                      Nueva cita
                    </Button>
                  </Box>
                  
                  {patient.appointments && patient.appointments.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {patient.appointments.map((appointment: any) => (
                        <Paper
                          key={appointment.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            '&:hover': {
                              boxShadow: 1,
                              cursor: 'pointer'
                            }
                          }}
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {formatDateTime(appointment.start_time)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Dr(a). {appointment.professional_name} - {appointment.specialty}
                              </Typography>
                            </Box>
                            
                            <Chip
                              label={getStatusText(appointment.status)}
                              color={getStatusColor(appointment.status)}
                              size="small"
                            />
                          </Box>
                        </Paper>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        Este paciente aún no tiene citas registradas
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<EventAvailableIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/appointments/new?patient=${patient.id}`)}
                      >
                        Agendar primera cita
                      </Button>
                    </Box>
                  )}
                </>
              )}
              
              {tabValue === 1 && (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Historial médico
                  </Typography>
                  
                  {patient.medical_history && patient.medical_history.length > 0 ? (
                    patient.medical_history.map((record: any) => (
                      <Paper
                        key={record.id}
                        variant="outlined"
                        sx={{ p: 2, mb: 2 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formatDate(record.date)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Dr(a). {record.professional.first_name} {record.professional.last_name} - {record.professional.specialty}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Motivo:
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            {record.description}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            Diagnóstico:
                          </Typography>
                          <Typography variant="body1">
                            {record.diagnosis}
                          </Typography>
                        </Box>
                      </Paper>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        Este paciente aún no tiene registros médicos
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </>
      ) : (
        <Alert severity="error">No se encontró el paciente</Alert>
      )}
      
      {/* DiÃ¡logo de confirmaciÃ³n de eliminaciÃ³n */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Eliminar paciente</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar a este paciente? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteDialogClose}
            disabled={actionLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeletePatient} 
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDetailsPage;
