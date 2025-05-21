import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  // Card,          // No utilizado
  // CardContent,   // No utilizado
  // IconButton,    // No utilizado
  Breadcrumbs,
  Link,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarTodayIcon,
  MedicalServices as MedicalServicesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  EventAvailable as EventAvailableIcon,
  Star as StarIcon
} from '@mui/icons-material';

// Datos simulados de un profesional
const mockProfessional = {
  id: 1,
  first_name: 'María',
  last_name: 'García',
  email: 'maria.garcia@example.com',
  phone_number: '555-123-4567',
  specialty: 'Cardiología',
  description: 'Especialista en cardiología con más de 10 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares.',
  education: 'Universidad de Buenos Aires',
  profile_picture: null,
  appointments_count: 24,
  rating: 4.8,
  availability: [
    { day: 'Lunes', start_time: '09:00', end_time: '17:00' },
    { day: 'Miércoles', start_time: '09:00', end_time: '17:00' },
    { day: 'Viernes', start_time: '14:00', end_time: '20:00' }
  ]
};

// Datos simulados de citas recientes
const mockRecentAppointments = [
  {
    id: 1,
    patient: {
      id: 101,
      first_name: 'Juan',
      last_name: 'Pérez'
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
      last_name: 'Rodríguez'
    },
    start_time: '2025-05-21T10:00:00',
    end_time: '2025-05-21T10:30:00',
    status: 'confirmed'
  }
];

const ProfessionalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [professional, setProfessional] = useState<any | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    const fetchProfessionalData = async () => {
      try {
        setLoading(true);
        // Simulación de llamada a la API
        setTimeout(() => {
          setProfessional(mockProfessional);
          setRecentAppointments(mockRecentAppointments);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Error al cargar los detalles del profesional');
        setLoading(false);
      }
    };
    
    fetchProfessionalData();
  }, [id]);
  
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDeleteProfessional = async () => {
    try {
      setActionLoading(true);
      // Simulación de llamada a la API
      setTimeout(() => {
        setActionLoading(false);
        setDeleteDialogOpen(false);
        navigate('/professionals', { replace: true });
      }, 1000);
    } catch (err) {
      setError('Error al eliminar el profesional');
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };
  
  // Función para generar las iniciales a partir del nombre y apellido
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/professionals')}
          >
            Profesionales
          </Link>
          <Typography color="text.primary">Perfil del profesional</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/professionals')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            Perfil del Profesional
          </Typography>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/professionals/${id}/edit`)}
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
      ) : professional ? (
        <Grid container spacing={3}>
          {/* Información principal del profesional */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: '#1976d2',
                    fontSize: '3rem',
                    mb: 2
                  }}
                >
                  {getInitials(professional.first_name, professional.last_name)}
                </Avatar>
                
                <Typography variant="h5" align="center" sx={{ fontWeight: 'bold' }}>
                  Dr(a). {professional.first_name} {professional.last_name}
                </Typography>
                
                <Chip
                  label={professional.specialty}
                  color="primary"
                  sx={{ mt: 1 }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      sx={{
                        color: star <= Math.round(professional.rating) ? '#FFD700' : '#e0e0e0',
                        fontSize: '1.2rem'
                      }}
                    />
                  ))}
                  <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'medium' }}>
                    ({professional.rating})
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <List sx={{ py: 0 }}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <EmailIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={professional.email}
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PhoneIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Teléfono"
                    secondary={professional.phone_number}
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <MedicalServicesIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Formación"
                    secondary={professional.education}
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarTodayIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Citas atendidas"
                    secondary={professional.appointments_count}
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Button
                variant="contained"
                fullWidth
                startIcon={<EventAvailableIcon />}
                onClick={() => navigate(`/appointments/new?professional=${professional.id}`)}
              >
                Agendar cita
              </Button>
            </Paper>
          </Grid>
          
          {/* Descripción y disponibilidad */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Acerca del profesional
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {professional.description}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Disponibilidad
                  </Typography>
                  
                  {professional.availability.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {professional.availability.map((slot: any, index: number) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            p: 1,
                            borderRadius: 1,
                            bgcolor: 'action.hover'
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {slot.day}
                          </Typography>
                          <Typography variant="body1">
                            {slot.start_time} - {slot.end_time}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      No hay información de disponibilidad.
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Citas próximas
                  </Typography>
                  
                  {recentAppointments.length > 0 ? (
                    <List>
                      {recentAppointments.map((appointment) => (
                        <ListItem
                          key={appointment.id}
                          sx={{ 
                            p: 2, 
                            mb: 1, 
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: 'action.hover',
                              cursor: 'pointer'
                            }
                          }}
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                        >
                          <ListItemText
                            primary={`${appointment.patient.first_name} ${appointment.patient.last_name}`}
                            secondary={formatDate(appointment.start_time)}
                          />
                          <Chip
                            label={appointment.status === 'scheduled' ? 'Programada' : 'Confirmada'}
                            color={appointment.status === 'scheduled' ? 'primary' : 'success'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      No hay citas próximas.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="error">No se encontró el profesional</Alert>
      )}
      
      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Eliminar profesional</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar a este profesional? Esta acción no se puede deshacer.
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
            onClick={handleDeleteProfessional} 
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

export default ProfessionalDetailsPage;
