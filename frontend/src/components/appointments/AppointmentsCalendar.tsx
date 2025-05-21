import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

import appointmentService from '../../services/api/appointmentService';
import { useAuth } from '../../context/AuthContext';

interface AppointmentsCalendarProps {
  appointments: any[];
  onRefresh?: () => void;
}

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ appointments }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth(); // Obtener información del usuario actual

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: es });
  const calendarEnd = endOfWeek(monthEnd, { locale: es });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Cambiar mes
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());
  
  // Obtener color según el estado de la cita
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

  // Obtener citas para un día específico
  const getAppointmentsForDay = (day: Date) => {
    // Inspeccionar la estructura de la primera cita para depuración
    if (appointments.length > 0 && day.getDate() === new Date().getDate()) {
      console.log('Estructura de una cita de ejemplo:', JSON.stringify(appointments[0], null, 2));
      console.log('Rol del usuario actual:', user?.role);
    }
    
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.start_time);
      return (
        appointmentDate.getDate() === day.getDate() &&
        appointmentDate.getMonth() === day.getMonth() &&
        appointmentDate.getFullYear() === day.getFullYear()
      );
    });
  };

  // Renderizar encabezado del calendario
  const renderHeader = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Mes anterior">
            <IconButton onClick={prevMonth}>
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Hoy">
            <IconButton onClick={goToToday} sx={{ mx: 1 }}>
              <TodayIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Mes siguiente">
            <IconButton onClick={nextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  // Renderizar días de la semana
  const renderDaysOfWeek = () => {
    const weekDays = eachDayOfInterval({
      start: startOfWeek(new Date(), { locale: es }),
      end: endOfWeek(new Date(), { locale: es })
    });

    return (
      <Grid container sx={{ mb: 1 }}>
        {weekDays.map((day, index) => (
          <Grid item xs={12/7} key={index} sx={{ textAlign: 'center' }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold',
                textTransform: 'capitalize',
                color: index === 0 || index === 6 ? 'error.main' : 'text.primary'
              }}
            >
              {format(day, isMobile ? 'EEEEE' : 'EEEE', { locale: es })}
            </Typography>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Renderizar celdas del calendario
  const renderCells = () => {
    return (
      <Grid container>
        {calendarDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);
          
          return (
            <Grid 
              item 
              xs={12/7} 
              key={index}
              sx={{
                height: '120px',
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: isCurrentMonth ? 'background.paper' : 'action.hover',
                position: 'relative',
                p: 1,
                overflow: 'hidden'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isCurrentDay ? 'bold' : 'regular',
                  color: !isCurrentMonth ? 'text.disabled' : 
                         isCurrentDay ? 'primary.main' : 'text.primary',
                  mb: 1
                }}
              >
                {format(day, 'd')}
              </Typography>
              
              {dayAppointments.length > 0 ? (
                <Box sx={{ overflow: 'auto', maxHeight: '85px' }}>
                  {dayAppointments.slice(0, 3).map((appointment, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mb: 0.5,
                        p: 0.5,
                        borderLeft: '4px solid',
                        borderColor: getStatusColor(appointment.status),
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '&:hover': {
                          backgroundColor: 'action.selected'
                        }
                      }}
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                        {format(parseISO(appointment.start_time), 'HH:mm')}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {/* Mostrar texto diferente según el rol del usuario */}
                        {(() => {
                          // Modo debug: Mostrar información detallada en consola
                          if (process.env.NODE_ENV === 'development') {
                            console.log(`Mostrando cita ${appointment.id || 'sin ID'} para usuario rol ${user?.role || 'desconocido'}:`, {
                              professional: appointment.professional,
                              patient: appointment.patient,
                              professionalType: typeof appointment.professional,
                              patientType: typeof appointment.patient,
                              specialty: typeof appointment.professional === 'object' ? appointment.professional.specialty : 'N/A',
                              date: appointment.start_time
                            });
                          }

                          // PACIENTE: Debe ver el nombre del profesional
                          if (user?.role === 'patient') {
                            // Verificamos si tenemos un objeto profesional completo
                            if (appointment.professional && typeof appointment.professional === 'object') {
                              // Nombre completo con título y especialidad en nueva línea
                              const profName = appointment.professional.first_name || '';
                              const profLastName = appointment.professional.last_name || '';
                              const specialty = appointment.professional.specialty || '';
                              
                              return (
                                <>
                                  <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                    Dr. {profName} {profLastName}
                                  </span>
                                  {specialty && (
                                    <span style={{ fontSize: '0.65rem', display: 'block', color: '#666' }}>
                                      {specialty}
                                    </span>
                                  )}
                                </>
                              );
                            } 
                            // Si solo tenemos el ID o datos incompletos
                            else {
                              return (
                                <span style={{ fontStyle: 'italic', color: '#888' }}>
                                  {typeof appointment.professional === 'number' 
                                    ? `Profesional #${appointment.professional}` 
                                    : 'Profesional pendiente'}
                                </span>
                              );
                            }
                          } 
                          // PROFESIONAL/ADMIN: Debe ver el nombre del paciente
                          else {
                            // Verificamos si tenemos un objeto paciente completo
                            if (appointment.patient && typeof appointment.patient === 'object') {
                              const patientName = appointment.patient.first_name || '';
                              const patientLastName = appointment.patient.last_name || '';
                              
                              return (
                                <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
                                  {patientName} {patientLastName}
                                </span>
                              );
                            } 
                            // Si solo tenemos el ID o datos incompletos
                            else {
                              return (
                                <span style={{ fontStyle: 'italic', color: '#888' }}>
                                  {typeof appointment.patient === 'number' 
                                    ? `Paciente #${appointment.patient}` 
                                    : 'Paciente pendiente'}
                                </span>
                              );
                            }
                          }
                        })()}
                      </Typography>
                    </Box>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <Chip
                      label={`+${dayAppointments.length - 3} más`}
                      size="small"
                      sx={{ height: '18px', fontSize: '0.7rem', width: '100%', mt: 0.5 }}
                      onClick={() => {
                        // Aquí podría implementarse lógica para mostrar todas las citas del día
                      }}
                    />
                  )}
                </Box>
              ) : (
                isCurrentMonth && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    No hay citas
                  </Typography>
                )
              )}
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </Paper>
  );
};

export default AppointmentsCalendar;
