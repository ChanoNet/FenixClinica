import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardActions,
  Collapse,
  Button,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/api/patientService';
import professionalService from '../../services/api/professionalService';

interface AppointmentListProps {
  appointments: any[];
  onRefresh?: () => void;
}

const AppointmentsList: React.FC<AppointmentListProps> = ({ appointments }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth(); // Obtener el usuario desde el contexto de autenticación

  // Estado para expandir/colapsar tarjetas en vista móvil
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  // Estado para almacenar datos enriquecidos de citas
  const [enrichedAppointments, setEnrichedAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  


  // Función para obtener detalles del paciente
  const fetchPatientDetails = async (patientId: number) => {
    try {
      console.log(`Cargando datos del paciente ID: ${patientId}`);
      const patients = await patientService.getAll({ search: patientId.toString() });
      if (patients && patients.length > 0) {
        return patients[0];
      }
      return null;
    } catch (error) {
      console.error(`Error al cargar datos del paciente ID ${patientId}:`, error);
      return null;
    }
  };

  // Función para obtener detalles del profesional
  const fetchProfessionalDetails = async (professionalId: number) => {
    try {
      console.log(`Cargando datos del profesional ID: ${professionalId}`);
      const professionals = await professionalService.getAll({ search: professionalId.toString() });
      if (professionals && professionals.length > 0) {
        return professionals[0];
      }
      return null;
    } catch (error) {
      console.error(`Error al cargar datos del profesional ID ${professionalId}:`, error);
      return null;
    }
  };

  // Enriquecer datos de citas con información completa de pacientes y profesionales
  useEffect(() => {
    const enrichAppointments = async () => {
      setLoading(true);
      
      const enrichedData = await Promise.all(
        appointments.map(async (appointment) => {
          let enriched = { ...appointment };
          
          // Enriquecer datos del paciente si solo tenemos el ID
          if (enriched.patient && typeof enriched.patient === 'number') {
            const patientDetails = await fetchPatientDetails(enriched.patient);
            if (patientDetails) {
              enriched.patient = patientDetails;
            }
          }
          
          // Enriquecer datos del profesional si solo tenemos el ID
          if (enriched.professional && typeof enriched.professional === 'number') {
            const professionalDetails = await fetchProfessionalDetails(enriched.professional);
            if (professionalDetails) {
              enriched.professional = professionalDetails;
            }
          }
          
          return enriched;
        })
      );
      
      setEnrichedAppointments(enrichedData);
      setLoading(false);
    };
    
    if (appointments.length > 0) {
      enrichAppointments();
    } else {
      setEnrichedAppointments([]);
      setLoading(false);
    }
  }, [appointments]);
  
  // Función para formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy - HH:mm", { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha no válida';
    }
  };
  
  // Función para obtener color según el estado de la cita
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return theme.palette.mode === 'dark' ? '#bb86fc' : '#2196f3'; // Azul/Violeta claro
      case 'confirmed':
        return theme.palette.mode === 'dark' ? '#03dac5' : '#00bfa5'; // Verde-azulado
      case 'completed':
        return theme.palette.mode === 'dark' ? '#81c784' : '#4caf50'; // Verde
      case 'cancelled':
        return theme.palette.mode === 'dark' ? '#cf6679' : '#f44336'; // Rojo
      case 'no_show':
        return theme.palette.mode === 'dark' ? '#ffb74d' : '#ff9800'; // Naranja
      default:
        return theme.palette.mode === 'dark' ? '#9e9e9e' : '#757575'; // Gris
    }
  };
  
  // Función para obtener texto según el estado de la cita
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

  // Manejar expansión de tarjeta
  const handleExpandCard = (appointmentId: number) => {
    setExpandedCard(expandedCard === appointmentId ? null : appointmentId);
  };
  


  // Vista para dispositivos móviles (tarjetas)
  const renderMobileView = () => {
    return (
      <Box>
        {enrichedAppointments.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              No hay citas para mostrar
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {enrichedAppointments.map((appointment) => {
              const isExpanded = expandedCard === appointment.id;
              
              // Determinar qué nombre mostrar según el rol del usuario
              let primaryName = '';
              let secondaryName = '';
              let primaryIcon = <PersonIcon />;
              let secondaryIcon = <MedicalServicesIcon />;
              
              if (user?.role === 'patient') {
                // Pacientes ven el nombre del profesional primero
                primaryName = typeof appointment.professional === 'object' 
                  ? `Dr. ${appointment.professional.first_name || ''} ${appointment.professional.last_name || ''}` 
                  : `Profesional #${appointment.professional || 'N/A'}`;
                secondaryName = typeof appointment.professional === 'object' 
                  ? (appointment.professional.specialty || 'Especialidad no especificada')
                  : 'Especialidad no disponible';
                primaryIcon = <MedicalServicesIcon />;
              } else {
                // Profesionales y admins ven el nombre del paciente primero
                primaryName = typeof appointment.patient === 'object' 
                  ? `${appointment.patient.first_name || ''} ${appointment.patient.last_name || ''}` 
                  : `Paciente #${appointment.patient || 'N/A'}`;
                secondaryName = typeof appointment.professional === 'object' 
                  ? `Dr. ${appointment.professional.first_name || ''} ${appointment.professional.last_name || ''}` 
                  : `Profesional #${appointment.professional || 'N/A'}`;
              }
              
              return (
                <Grid item xs={12} key={appointment.id}>
                  <Card 
                    sx={{
                      position: 'relative',
                      borderLeft: `4px solid ${getStatusColor(appointment.status)}`,
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                          <AccessTimeIcon color="action" />
                        </Grid>
                        <Grid item xs>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formatDateTime(appointment.start_time)}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Chip 
                            label={getStatusText(appointment.status)}
                            size="small"
                            sx={{ 
                              backgroundColor: `${getStatusColor(appointment.status)}20`,
                              color: getStatusColor(appointment.status),
                              fontWeight: 'medium'
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        {primaryIcon}
                        <Typography variant="body1" sx={{ ml: 1, fontWeight: 'bold' }}>
                          {primaryName}
                        </Typography>
                      </Box>
                      
                      {secondaryName && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, ml: 4 }}>
                          {secondaryName}
                        </Typography>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1, pt: 0 }}>
                      <Button 
                        startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => handleExpandCard(appointment.id)}
                        size="small"
                      >
                        {isExpanded ? 'Menos' : 'Más'}
                      </Button>
                      
                      <Box>
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="secondary" 
                          size="small"
                          onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                    
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Divider />
                      <CardContent>
                        <Typography variant="body2" paragraph sx={{ mb: 1 }}>
                          <strong>Especialidad:</strong> {typeof appointment.professional === 'object' 
                            ? appointment.professional.specialty || 'No especificada'
                            : 'No disponible'}
                        </Typography>
                        {appointment.reason && (
                          <Typography variant="body2" paragraph sx={{ mb: 1 }}>
                            <strong>Motivo:</strong> {appointment.reason}
                          </Typography>
                        )}
                        {appointment.notes && (
                          <Typography variant="body2" paragraph sx={{ mb: 1 }}>
                            <strong>Notas:</strong> {appointment.notes}
                          </Typography>
                        )}
                      </CardContent>
                    </Collapse>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );
  };

  // Vista para escritorio (tabla)
  const renderDesktopView = () => {
    return (
      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabla de citas">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }}>
              <TableCell>Fecha y hora</TableCell>
              <TableCell>Paciente</TableCell>
              <TableCell>Profesional</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrichedAppointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No hay citas para mostrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {enrichedAppointments.map((appointment) => (
              <TableRow key={appointment.id} 
                sx={{ 
                  '&:hover': { 
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.08)' 
                      : 'rgba(0,0,0,0.04)' 
                  } 
                }}
              >
                <TableCell>
                  {formatDateTime(appointment.start_time)}
                </TableCell>
                <TableCell>
                  {typeof appointment.patient === 'object' ? 
                    `${appointment.patient.first_name || ''} ${appointment.patient.last_name || ''}` : 
                    `Paciente #${appointment.patient || 'N/A'}`}
                </TableCell>
                <TableCell>
                  {typeof appointment.professional === 'object' ? 
                    `${appointment.professional.first_name || ''} ${appointment.professional.last_name || ''}` : 
                    `Profesional #${appointment.professional || 'N/A'}`}
                </TableCell>
                <TableCell>
                  {typeof appointment.professional === 'object' ? 
                    appointment.professional.specialty : 
                    (appointment.specialty || 'No especificada')}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(appointment.status)}
                    sx={{ 
                      backgroundColor: `${getStatusColor(appointment.status)}20`,
                      color: getStatusColor(appointment.status),
                      fontWeight: 'medium'
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Ver detalles">
                    <IconButton 
                      color="primary"
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <Tooltip title="Editar">
                      <IconButton 
                        color="secondary"
                        onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Retornar vista según el tamaño de pantalla
  return (
    <Box>
      {loading ? (
        <Typography variant="body1" align="center" sx={{ p: 3 }}>
          Cargando citas...
        </Typography>
      ) : (
        isMobile ? renderMobileView() : renderDesktopView()
      )}

    </Box>
  );
};

export default AppointmentsList;
