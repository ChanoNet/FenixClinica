import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../services/api/config';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  EventBusy as EventBusyIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Notes as NotesIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import appointmentService from '../../services/api/appointmentService';
import patientService from '../../services/api/patientService';
import professionalService from '../../services/api/professionalService';

const AppointmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtener usuario actual para determinar su rol
  
  const [appointment, setAppointment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Estados adicionales para las nuevas funcionalidades
  const [cancelReason, setCancelReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  
  // Obtener el rol del usuario actual
  const userRole = user?.role || 'patient'; // Default a patient si no hay rol
  

  
  // Función para cargar datos del paciente
  const fetchPatientDetails = async (patientId: number) => {
    try {
      console.log(`Cargando datos del paciente ID: ${patientId}`);
      // Usamos search como paramétro general para buscar por ID
      const patients = await patientService.getAll({ search: patientId.toString() });
      if (patients && patients.length > 0) {
        console.log(`Datos del paciente ID ${patientId} obtenidos:`, patients[0]);
        return patients[0];
      }
      console.warn(`No se encontraron datos para el paciente ID: ${patientId}`);
      return null;
    } catch (error) {
      console.error(`Error al cargar datos del paciente ID ${patientId}:`, error);
      return null;
    }
  };

  // Función para cargar datos del profesional
  const fetchProfessionalDetails = async (professionalId: number) => {
    try {
      console.log(`Cargando datos del profesional ID: ${professionalId}`);
      // Usamos search como paramétro general para buscar por ID
      const professionals = await professionalService.getAll({ search: professionalId.toString() });
      if (professionals && professionals.length > 0) {
        console.log(`Datos del profesional ID ${professionalId} obtenidos:`, professionals[0]);
        return professionals[0];
      }
      console.warn(`No se encontraron datos para el profesional ID: ${professionalId}`);
      return null;
    } catch (error) {
      console.error(`Error al cargar datos del profesional ID ${professionalId}:`, error);
      return null;
    }
  };

  // Cargar datos de la cita
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) {
        setError('ID de cita no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Cargando detalles de la cita con ID: ${id}`);
        
        // 0. Intentar recuperar la cita desde localStorage primero
        let enrichedAppointment = null;
        try {
          const cachedAppointment = localStorage.getItem(`appointment_${id}`);
          if (cachedAppointment) {
            console.log(`Encontrada cita ${id} en caché local`);
            enrichedAppointment = JSON.parse(cachedAppointment);
          }
        } catch (cacheError) {
          console.warn('Error al recuperar cita desde caché:', cacheError);
        }
        
        // 1. Si no hay en caché, obtener datos básicos de la cita
        if (!enrichedAppointment) {
          try {
            console.log('Cita no encontrada en caché, intentando API...');
            const appointmentData = await appointmentService.getById(id);
            console.log('Datos básicos de la cita recibidos:', appointmentData);
            
            if (!appointmentData) {
              throw new Error('No se encontró la cita solicitada en la API');
            }
            
            enrichedAppointment = { ...appointmentData };
          } catch (apiError: any) {
            console.error('Error al obtener datos de la API:', apiError);
            throw new Error(`No se pudo obtener los detalles de la cita. ${apiError.message || 'Error desconocido'}`);
          }
        }
        
        // 2. Si el paciente es solo un ID, obtener sus datos completos
        if (enrichedAppointment.patient && typeof enrichedAppointment.patient === 'number') {
          try {
            const patientDetails = await fetchPatientDetails(enrichedAppointment.patient);
            if (patientDetails) {
              enrichedAppointment.patient = patientDetails;
            }
          } catch (patientError) {
            console.warn(`Error al obtener datos del paciente ID ${enrichedAppointment.patient}:`, patientError);
            // Continuamos aunque falle, usaremos solo el ID
          }
        }
        
        // 3. Si el profesional es solo un ID, obtener sus datos completos
        if (enrichedAppointment.professional && typeof enrichedAppointment.professional === 'number') {
          try {
            const professionalDetails = await fetchProfessionalDetails(enrichedAppointment.professional);
            if (professionalDetails) {
              enrichedAppointment.professional = professionalDetails;
            }
          } catch (profError) {
            console.warn(`Error al obtener datos del profesional ID ${enrichedAppointment.professional}:`, profError);
            // Continuamos aunque falle, usaremos solo el ID
          }
        }
        
        // 4. Actualizar el estado con los datos enriquecidos
        console.log('Datos completos de la cita:', enrichedAppointment);
        setAppointment(enrichedAppointment);
        setLoading(false);
      } catch (err: any) {
        console.error('Error al cargar la cita:', err);
        setError(`Error al cargar los detalles de la cita: ${err.message || 'Error desconocido'}`);
        setLoading(false);
      }
    };
    
    fetchAppointment();
  }, [id]);
  
  // Redireccionar a la página de edición (solo para administradores)
  const handleEdit = () => {
    if (userRole === 'admin') {
      navigate(`/appointments/${id}/edit`);
    }
  };
  
  // Manejar reprogramación (para pacientes)
  const handleReschedule = () => {
    if (!appointment) return;
    
    // Almacenar los datos de la cita en localStorage
    const appointmentData = {
      professionalId: typeof appointment.professional === 'object' 
        ? appointment.professional.id 
        : appointment.professional,
      patientId: typeof appointment.patient === 'object'
        ? appointment.patient.id
        : appointment.patient,
      reason: appointment.reason || '',
      notes: appointment.notes || ''
    };
    
    localStorage.setItem('rescheduleData', JSON.stringify(appointmentData));
    
    // Cerrar el diálogo si está abierto
    setRescheduleDialogOpen(false);
    
    // Navegar a la página de creación de cita
    navigate('/appointments/new');
  };
  
  // Manejar cambio de estado (para administradores)
  const handleStatusChange = async (event: SelectChangeEvent) => {
    if (!id || !appointment) return;
    
    const newStatus = event.target.value;
    setSelectedStatus(newStatus);
    
    try {
      setActionLoading(true);
      console.log(`Cambiando estado de cita ID ${id} a: ${newStatus}`);
      
      // Preparar solo los datos esenciales 
      const professionalId = typeof appointment.professional === 'object' 
        ? appointment.professional.id : appointment.professional;
      const patientId = typeof appointment.patient === 'object' 
        ? appointment.patient.id : appointment.patient;

      // Crear un objeto simple con solo los campos mínimos necesarios
      const updatedData = {
        professional: professionalId,
        patient: patientId,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: newStatus,
        reason: appointment.reason || '',
        notes: appointment.notes || ''
      };
      
      console.log('Datos de actualización a enviar:', updatedData);
      
      // Actualizar con el endpoint que funciona
      await axiosInstance.put(`/v1/appointments/appointments/${id}/`, updatedData);
      
      // Esperar un momento para dar tiempo al backend de procesar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar la cita local
      const updatedAppointment = await appointmentService.getById(id);
      setAppointment(updatedAppointment);
      
      setActionLoading(false);
      setActionSuccess(`Estado de la cita actualizado a: ${getStatusText(newStatus)}`);
    } catch (err: any) {
      console.error('Error al cambiar el estado de la cita:', err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message || 'Error desconocido';
      setError(`Error al cambiar el estado: ${errorMsg}`);
      setActionLoading(false);
    }
  };
  
  const handleCancelDialogOpen = () => {
    setCancelDialogOpen(true);
  };
  
  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
  };
  
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleCancelAppointment = async () => {
    if (!id || !appointment) return;
    
    try {
      setActionLoading(true);
      console.log(`Cancelando cita con ID: ${id}`);
      
      // Preparar solo los datos esenciales para la cancelación
      const professionalId = typeof appointment.professional === 'object' 
        ? appointment.professional.id : appointment.professional;
      const patientId = typeof appointment.patient === 'object' 
        ? appointment.patient.id : appointment.patient;

      // Crear un objeto simple con solo los campos mínimos necesarios
      const cancelData = {
        professional: professionalId,
        patient: patientId,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: 'cancelled',
        reason: appointment.reason || '',
        notes: cancelReason || 'Cancelada por el usuario'
      };
      
      console.log('Datos de cancelación a enviar:', cancelData);
      
      // Usar el endpoint que funciona para actualizar
      await axiosInstance.put(`/v1/appointments/appointments/${id}/`, cancelData);
      
      // Esperar un momento para dar tiempo al backend de procesar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar el estado local con la cita cancelada
      const updatedAppointment = await appointmentService.getById(id);
      setAppointment(updatedAppointment);
      
      setActionLoading(false);
      setCancelDialogOpen(false);
      setCancelReason(''); // Limpiar la razón
      setActionSuccess('Cita cancelada con éxito');
    } catch (err: any) {
      console.error('Error al cancelar la cita:', err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message || 'Error desconocido';
      setError(`Error al cancelar la cita: ${errorMsg}`);
      setActionLoading(false);
      setCancelDialogOpen(false);
    }
  };
  
  const handleDeleteAppointment = async () => {
    if (!id || !appointment) return;
    
    try {
      setActionLoading(true);
      console.log(`Eliminando cita con ID: ${id}`);
      
      await appointmentService.delete(id);
      
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setActionSuccess('Cita eliminada con éxito');
      
      // Navegar después de unos segundos para mostrar el mensaje de éxito
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (err: any) {
      console.error('Error al eliminar la cita:', err);
      setError(`Error al eliminar la cita: ${err.message || 'Error desconocido'}`);
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleCompleteAppointment = async () => {
    if (!id || !appointment) return;
    
    try {
      setActionLoading(true);
      console.log(`Marcando cita con ID ${id} como completada`);
      
      await appointmentService.complete(id);
      
      // Actualizar el estado local con la cita completada
      const updatedAppointment = await appointmentService.getById(id);
      setAppointment(updatedAppointment);
      
      setActionLoading(false);
      setActionSuccess('Cita marcada como completada');
    } catch (err: any) {
      console.error('Error al marcar la cita como completada:', err);
      setError(`Error al marcar la cita como completada: ${err.message || 'Error desconocido'}`);
      setActionLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#6200ea'; // Púrpura
      case 'confirmed':
        return '#03dac6'; // Turquesa
      case 'completed':
        return '#4caf50'; // Verde
      case 'cancelled':
        return '#f44336'; // Rojo
      case 'no_show':
        return '#ff9800'; // Naranja
      default:
        return '#757575'; // Gris
    }
  };
  
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
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
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
          <Typography color="text.primary">Detalles de la cita</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/appointments')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            Detalles de la cita
          </Typography>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : appointment ? (
        <>
          {actionSuccess && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              onClose={() => setActionSuccess(null)}
            >
              {actionSuccess}
            </Alert>
          )}
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Chip 
                  label={getStatusText(appointment.status || 'scheduled')}
                  sx={{ 
                    bgcolor: getStatusColor(appointment.status || 'scheduled'),
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {/* Mostrar diferente título según el rol del usuario */}
                  {user?.role === 'patient' ? (
                    // Para pacientes: mostrar el nombre del profesional
                    appointment.professional && typeof appointment.professional === 'object' ? (
                      <>Cita con {appointment.professional.first_name || ''} {appointment.professional.last_name || ''}</>
                    ) : appointment.professional ? (
                      <>Cita con profesional ID: {appointment.professional}</>
                    ) : (
                      'Cita médica'
                    )
                  ) : (
                    // Para admin y profesionales: mostrar el nombre del paciente
                    appointment.patient && typeof appointment.patient === 'object' ? (
                      <>Cita con {appointment.patient.first_name || ''} {appointment.patient.last_name || ''}</>
                    ) : appointment.patient ? (
                      <>
                        {/* Si el paciente es solo un ID, intentamos obtener sus datos antes de mostrarlo */}
                        {(() => {
                          const fetchPatient = async () => {
                            try {
                              // Intentar obtener los datos del paciente y actualizar la vista
                              const patientData = await fetchPatientDetails(appointment.patient);
                              if (patientData) {
                                // Intentar actualizar la cita con los datos completos del paciente
                                const updatedAppointment = {...appointment, patient: patientData};
                                setAppointment(updatedAppointment);
                                return <>Cita con {patientData.first_name || ''} {patientData.last_name || ''}</>;
                              }
                            } catch (err) {
                              console.error('Error al obtener datos del paciente:', err);
                            }
                            return <>Cita con paciente</>;
                          };
                          // Llamamos a fetchPatient inmediatamente y mostramos un placeholder mientras se carga
                          fetchPatient();
                          return <>Cargando datos del paciente...</>;
                        })()}
                      </>
                    ) : (
                      'Cita médica'
                    )
                  )}
                </Typography>
              </Box>
              
              {appointment.status && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelDialogOpen}
                  >
                    Cancelar
                  </Button>
                </Box>
              )}
            </Box>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Fecha y hora
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1, textTransform: 'capitalize' }}>
                    {appointment.start_time ? formatDateTime(appointment.start_time) : 'Fecha no especificada'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {appointment.end_time && appointment.start_time ? 
                      `Duración: ${Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000)} minutos` : 
                      'Duración: 30 minutos (estimado)'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Profesional
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {appointment.professional ? (
                      typeof appointment.professional === 'object' ? 
                        appointment.professional.first_name ? 
                          `${appointment.professional.first_name || ''} ${appointment.professional.last_name || ''}` :
                          'Datos del profesional incompletos' :
                        `Profesional ID: ${appointment.professional}`
                    ) : 'No se especificó profesional'}
                  </Typography>
                  {appointment.professional && typeof appointment.professional === 'object' && appointment.professional.specialty && (
                    <Typography variant="body2" color="text.secondary">
                      {appointment.professional.specialty}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    <NotesIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Motivo de la consulta
                  </Typography>
                  <Typography variant="body1">
                    {appointment.reason || 'No se especificó motivo'}
                  </Typography>
                </Paper>
              </Grid>
              
              {appointment.notes && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      <NotesIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Notas adicionales
                    </Typography>
                    <Typography variant="body1">
                      {appointment.notes}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Creada: {new Date(appointment.created_at).toLocaleString()}
                {appointment.updated_at !== appointment.created_at && 
                  ` (Actualizada: ${new Date(appointment.updated_at).toLocaleString()})`
                }
              </Typography>
              
              {/* BOTONES SEGÚN ROL DE USUARIO */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* ADMIN: Dropdown para cambiar estado + botón editar */}
                {userRole === 'admin' && (
                  <>
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Estado de la cita</InputLabel>
                      <Select
                        value={selectedStatus || appointment.status || 'scheduled'}
                        onChange={handleStatusChange}
                        label="Estado de la cita"
                        disabled={actionLoading}
                      >
                        <MenuItem value="scheduled">Programada</MenuItem>
                        <MenuItem value="confirmed">Confirmada</MenuItem>
                        <MenuItem value="completed">Completada</MenuItem>
                        <MenuItem value="cancelled">Cancelada</MenuItem>
                        <MenuItem value="no_show">No asistió</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      disabled={actionLoading}
                    >
                      Editar
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteDialogOpen}
                      disabled={actionLoading}
                    >
                      Eliminar
                    </Button>
                  </>
                )}
                
                {/* PROFESIONAL: Marcar como completada + Cancelar */}
                {userRole === 'professional' && (
                  <>
                    {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleCompleteAppointment}
                        disabled={actionLoading}
                      >
                        Marcar como completada
                      </Button>
                    )}
                    
                    {appointment.status !== 'cancelled' && (
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelDialogOpen}
                        disabled={actionLoading}
                      >
                        Cancelar cita
                      </Button>
                    )}
                  </>
                )}
                
                {/* PACIENTE: Reprogramar + Cancelar (si no está cancelada o completada) */}
                {userRole === 'patient' && (
                  <>
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<EventBusyIcon />}
                          onClick={() => setRescheduleDialogOpen(true)}
                          disabled={actionLoading}
                        >
                          Reprogramar
                        </Button>
                        
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelDialogOpen}
                          disabled={actionLoading}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Paper>
          
          {/* Diálogo de cancelación */}
          <Dialog
            open={cancelDialogOpen}
            onClose={handleCancelDialogClose}
          >
            <DialogTitle>Cancelar cita</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
              </DialogContentText>
              
              {/* Campo para la razón de cancelación */}
              <TextField
                autoFocus
                margin="dense"
                id="cancel-reason"
                label="Motivo de cancelación"
                type="text"
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelDialogClose} color="primary">
                Volver
              </Button>
              <Button onClick={handleCancelAppointment} color="error" variant="contained" autoFocus>
                Sí, cancelar cita
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Diálogo de reprogramación */}
          <Dialog
            open={rescheduleDialogOpen}
            onClose={() => setRescheduleDialogOpen(false)}
          >
            <DialogTitle>Reprogramar cita</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Para reprogramar esta cita, te llevaremos a la página de creación de citas con los datos pre-cargados.
                La cita actual será cancelada y deberás completar la información para la nueva fecha.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRescheduleDialogOpen(false)} color="primary">
                Cancelar
              </Button>
              <Button onClick={handleReschedule} color="primary" variant="contained" autoFocus>
                Continuar
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Diálogo de eliminación */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteDialogClose}
          >
            <DialogTitle>Eliminar cita</DialogTitle>
            <DialogContent>
              <DialogContentText>
                ¿Estás seguro de que deseas eliminar permanentemente esta cita? Esta acción no se puede deshacer.
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
                onClick={handleDeleteAppointment} 
                color="error"
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Eliminar'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Alert severity="error">No se encontró la cita</Alert>
      )}
    </Box>
  );
};

export default AppointmentDetailsPage;
