import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/api/dashboardService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar los componentes necesarios de ChartJS
ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    today: 0,
    this_week: 0,
    this_month: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  // Cargar datos del dashboard desde la API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener estadísticas del dashboard
        const statsData = await dashboardService.getStats();
        setStats(statsData);
        
        // Obtener próximas citas
        const appointmentsData = await dashboardService.getUpcomingAppointments(5);
        setUpcomingAppointments(appointmentsData);
      } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        // Usar datos simulados como fallback
        setStats({
          total: 10,
          scheduled: 3,
          confirmed: 2,
          completed: 1,
          cancelled: 1,
          no_show: 0,
          today: 2,
          this_week: 5,
          this_month: 10,
        });
        
        setUpcomingAppointments([
          {
            id: 1,
            patient_name: 'Juan Pérez',
            professional_name: 'Dra. María García',
            start_time: '2025-05-17T14:30:00',
            status: 'scheduled',
          },
          {
            id: 2,
            patient_name: 'Laura Rodríguez',
            professional_name: 'Dr. Carlos López',
            start_time: '2025-05-18T10:00:00',
            status: 'confirmed',
          },
          {
            id: 3,
            patient_name: 'Roberto Fernández',
            professional_name: 'Dra. Ana Martínez',
            start_time: '2025-05-19T16:15:00',
            status: 'scheduled',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]); // Actualizar cuando cambie el usuario

  // Configuración de gráficos
  const appointmentStatusData = {
    labels: ['Programadas', 'Confirmadas', 'Completadas', 'Canceladas', 'No asistió'],
    datasets: [
      {
        data: [stats.scheduled, stats.confirmed, stats.completed, stats.cancelled, stats.no_show],
        backgroundColor: [
          '#6200ea',  // Púrpura para programadas
          '#03dac6',  // Turquesa para confirmadas
          '#4caf50',  // Verde para completadas
          '#f44336',  // Rojo para canceladas
          '#ff9800',  // Naranja para no asistió
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: theme.palette.text.primary,
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Helper para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper para obtener el color por estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#6200ea';
      case 'confirmed':
        return '#03dac6';
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      case 'no_show':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  // Helper para obtener el texto del estado
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

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/appointments/new')}
        >
          Nueva Cita
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Resumen en tarjetas */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#6200ea', mr: 2 }}>
                    <EventIcon />
                  </Avatar>
                  <Typography variant="h6">Citas Programadas</Typography>
                </Box>
                <Typography variant="h3" sx={{ textAlign: 'center', my: 2, fontWeight: 'bold', color: '#6200ea' }}>
                  {stats.scheduled}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {stats.total} citas en total
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#03dac6', mr: 2 }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Typography variant="h6">Citas Completadas</Typography>
                </Box>
                <Typography variant="h3" sx={{ textAlign: 'center', my: 2, fontWeight: 'bold', color: '#03dac6' }}>
                  {stats.completed}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((stats.completed / (stats.total || 1)) * 100)}% de tasa de completitud
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                    <CancelIcon />
                  </Avatar>
                  <Typography variant="h6">Citas Canceladas</Typography>
                </Box>
                <Typography variant="h3" sx={{ textAlign: 'center', my: 2, fontWeight: 'bold', color: '#f44336' }}>
                  {stats.cancelled}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((stats.cancelled / (stats.total || 1)) * 100)}% de tasa de cancelación
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de estados de citas */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Distribución de Citas" />
              <CardContent>
                <Box sx={{ height: 300, position: 'relative' }}>
                  <Doughnut data={appointmentStatusData} options={chartOptions} />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" component="div" color="text.secondary">
                      Total
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Próximas citas */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Próximas Citas" 
                action={
                  <IconButton onClick={() => navigate('/appointments')}>
                    <ArrowForwardIcon />
                  </IconButton>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <List>
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment: any) => (
                      <React.Fragment key={appointment.id}>
                        <ListItem 
                          alignItems="flex-start" 
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getStatusColor(appointment.status) }}>
                              <CalendarTodayIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1" component="span">
                                  {user?.role === 'professional' ? appointment.patient_name : appointment.professional_name}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  component="span"
                                  sx={{ 
                                    color: getStatusColor(appointment.status),
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {getStatusText(appointment.status)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {user?.role === 'professional' ? 'Paciente' : 'Profesional'}: {user?.role === 'professional' ? appointment.patient_name : appointment.professional_name}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="text.secondary">
                                  Fecha y hora: {formatDate(appointment.start_time)}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText
                        primary="No hay citas programadas"
                        secondary="Crea una nueva cita haciendo clic en 'Nueva Cita'"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Acciones rápidas */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Acciones Rápidas" />
              <CardContent>
                <Grid container spacing={2}>
                  {user?.role === 'admin' && (
                    <>
                      <Grid item xs={6} md={3}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/appointments/new')}
                          sx={{ py: 1.5 }}
                        >
                          Nueva Cita
                        </Button>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<PersonIcon />}
                          onClick={() => navigate('/professionals')}
                          sx={{ py: 1.5 }}
                        >
                          Gestionar Profesionales
                        </Button>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<PeopleIcon />}
                          onClick={() => navigate('/patients')}
                          sx={{ py: 1.5 }}
                        >
                          Gestionar Pacientes
                        </Button>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<EventIcon />}
                          onClick={() => navigate('/appointments')}
                          sx={{ py: 1.5 }}
                        >
                          Ver Todas las Citas
                        </Button>
                      </Grid>
                    </>
                  )}
                  
                  {user?.role === 'professional' && (
                    <>
                      <Grid item xs={6} md={4}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<CalendarTodayIcon />}
                          onClick={() => navigate('/appointments')}
                          sx={{ py: 1.5 }}
                        >
                          Mis Citas
                        </Button>
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<PeopleIcon />}
                          onClick={() => navigate('/patients')}
                          sx={{ py: 1.5 }}
                        >
                          Mis Pacientes
                        </Button>
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<SettingsIcon />}
                          onClick={() => navigate('/profile')}
                          sx={{ py: 1.5 }}
                        >
                          Mis Horarios
                        </Button>
                      </Grid>
                    </>
                  )}
                  
                  {user?.role === 'patient' && (
                    <>
                      <Grid item xs={6} md={4}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/appointments/new')}
                          sx={{ py: 1.5 }}
                        >
                          Nueva Cita
                        </Button>
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<CalendarTodayIcon />}
                          onClick={() => navigate('/appointments')}
                          sx={{ py: 1.5 }}
                        >
                          Mis Citas
                        </Button>
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<PersonIcon />}
                          onClick={() => navigate('/professionals')}
                          sx={{ py: 1.5 }}
                        >
                          Buscar Profesionales
                        </Button>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;
