import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import useApiResource from '../hooks/useApiResource';
import patientService from '../services/api/patientService';
import appointmentService from '../services/api/appointmentService';
import LoadingOverlay from '../components/feedback/LoadingOverlay';

/**
 * Ejemplo que demuestra el uso del hook useApiResource para
 * obtener, cachear y actualizar datos de la API
 */
const ApiResourceExample: React.FC = () => {
  // Estado para búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Usar el hook useApiResource para obtener la lista de pacientes
  const {
    data: patients,
    loading: loadingPatients,
    error: patientsError,
    refresh: refreshPatients,
    silentRefresh: silentRefreshPatients
  } = useApiResource(
    () => patientService.getAll(),
    'all-patients',
    {
      cacheDuration: 3 * 60 * 1000, // 3 minutos
      revalidateOnFocus: true
    }
  );
  
  // Usar el hook para obtener citas próximas
  const {
    data: appointments = [], // Proporcionar un array vacío como valor predeterminado
    loading: loadingAppointments,
    error: appointmentsError,
    refresh: refreshAppointments
  } = useApiResource<any[]>( // Especificar el tipo explícitamente como array
    () => appointmentService.getAll({ status: 'scheduled' }), // Usar getAll con filtro de status en vez de getUpcoming
    'upcoming-appointments',
    {
      cacheDuration: 1 * 60 * 1000 // 1 minuto (se actualiza más frecuentemente)
    }
  );
  
  // Hook para pacientes filtrados (demuestra cómo las dependencias afectan)
  const {
    data: filteredPatients = [], // Proporcionar un array vacío como valor predeterminado
    loading: loadingFiltered,
    error: filteredError
  } = useApiResource<any[]>( // Especificar el tipo explícitamente como array
    () => patientService.getAll({ search: debouncedQuery }), // Usar getAll con parámetro search en vez de search directamente
    `patients-search-${debouncedQuery}`,
    {
      dependencies: [debouncedQuery], // Se actualiza cuando cambia la búsqueda
      loadOnMount: debouncedQuery !== '',
      shouldCache: true
    }
  );
  
  // Manejar cambios en el campo de búsqueda con debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Establecer nuevo timeout para debounce
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout as unknown as NodeJS.Timeout);
  };
  
  // Limpiar la búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };
  
  // Forzar recarga de ambos recursos
  const handleRefreshAll = () => {
    refreshPatients();
    refreshAppointments();
  };
  
  // Calculamos pacientes a mostrar basándonos en la búsqueda
  const displayPatients = debouncedQuery ? filteredPatients : (patients || []);
  const isLoading = loadingPatients || loadingAppointments || loadingFiltered;
  const hasError = patientsError || appointmentsError || filteredError;
  
  return (
    <Paper elevation={3} sx={{ p: 3, my: 4, maxWidth: 1200, mx: 'auto', position: 'relative' }}>
      {isLoading && <LoadingOverlay open={isLoading} />}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Ejemplo de Recursos con Caché
        </Typography>
        
        <Button 
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefreshAll}
          disabled={isLoading}
        >
          Actualizar todo
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {hasError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {patientsError || appointmentsError || filteredError}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Lista de Pacientes */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pacientes {debouncedQuery ? 'Filtrados' : ''}
              </Typography>
              
              <TextField
                fullWidth
                placeholder="Buscar pacientes..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={clearSearch}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />
              
              {loadingFiltered && debouncedQuery ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <>
                  {displayPatients && displayPatients.length > 0 ? (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {displayPatients.map((patient: any) => (
                        <ListItem key={patient.id} divider>
                          <ListItemAvatar>
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${patient.first_name} ${patient.last_name}`}
                            secondary={
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  component="span"
                                >
                                  {patient.email}
                                </Typography>
                                <br />
                                {patient.phone}
                              </>
                            }
                          />
                          <Chip 
                            label={`ID: ${patient.id}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        {debouncedQuery 
                          ? 'No se encontraron pacientes que coincidan con la búsqueda' 
                          : 'No hay pacientes disponibles'}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                onClick={() => debouncedQuery ? silentRefreshPatients() : refreshPatients()}
              >
                Actualizar lista
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Citas Próximas */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                Citas Próximas
              </Typography>
              
              {loadingAppointments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <>
                  {appointments && appointments.length > 0 ? (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {appointments.map((appointment: any) => (
                        <ListItem key={appointment.id} divider alignItems="flex-start">
                          <ListItemText
                            primary={
                              <Typography fontWeight="bold">
                                {format(new Date(appointment.start_time), 'PPP', { locale: es })}
                                {' - '}
                                {format(new Date(appointment.start_time), 'HH:mm')}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" color="text.primary">
                                  Paciente: {appointment.patient.first_name} {appointment.patient.last_name}
                                </Typography>
                                <Typography variant="body2">
                                  Profesional: {appointment.professional.first_name} {appointment.professional.last_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {appointment.reason}
                                </Typography>
                              </>
                            }
                          />
                          <Chip 
                            label={getStatusLabel(appointment.status)} 
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        No hay citas próximas disponibles
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                onClick={() => refreshAppointments()}
              >
                Actualizar citas
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Notas sobre la implementación:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Los datos se obtienen de la API y se almacenan en caché para mejorar el rendimiento<br />
          • La caché de pacientes dura 3 minutos, mientras que la de citas dura 1 minuto<br />
          • La búsqueda utiliza "debounce" para evitar realizar demasiadas peticiones<br />
          • Cada búsqueda se cachea por separado para mejorar futuras búsquedas idénticas<br />
          • Los datos se revalidan automáticamente cuando la ventana recupera el foco
        </Typography>
      </Box>
    </Paper>
  );
};

// Funciones auxiliares
function getStatusLabel(status: string): string {
  switch (status) {
    case 'scheduled': return 'Programada';
    case 'confirmed': return 'Confirmada';
    case 'cancelled': return 'Cancelada';
    case 'completed': return 'Completada';
    default: return status;
  }
}

function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'scheduled': return 'info';
    case 'confirmed': return 'primary';
    case 'cancelled': return 'error';
    case 'completed': return 'success';
    default: return 'default';
  }
}

export default ApiResourceExample;
