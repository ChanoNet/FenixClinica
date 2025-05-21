import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Tooltip,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  EventAvailable as EventIcon,
  Event as CalendarIcon,
  Check as CheckIcon,
  DeleteOutline as DeleteIcon,
  CircleNotifications as CircleNotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRealTime } from '../../context/RealTimeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Centro de notificaciones que muestra las notificaciones en tiempo real
 */
const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, connected } = useRealTime();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    handleClose();
  };

  // Obtener ícono según el tipo de notificación
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_created':
        return <EventIcon color="success" />;
      case 'appointment_updated':
        return <CalendarIcon color="primary" />;
      case 'appointment_deleted':
        return <DeleteIcon color="error" />;
      case 'appointment_reminder':
        return <EventIcon color="warning" />;
      default:
        return <CircleNotificationsIcon color="info" />;
    }
  };

  // Formatear fecha
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return format(date, "'Hoy' 'a las' HH:mm", { locale: es });
    } else if (diffInHours < 48) {
      return format(date, "'Ayer' 'a las' HH:mm", { locale: es });
    } else {
      return format(date, "dd/MM/yyyy HH:mm", { locale: es });
    }
  };

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton
          onClick={handleOpen}
          size="large"
          aria-label="mostrar notificaciones"
          aria-controls="notification-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            overlap="circular"
            variant="dot"
            invisible={unreadCount === 0}
          >
            <NotificationsIcon 
              sx={{ 
                color: connected ? 'inherit' : 'text.disabled',
                animation: unreadCount > 0 ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                  '100%': { opacity: 1 }
                }
              }} 
            />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 320,
            maxHeight: 400,
            borderRadius: 2,
            mt: 1.5,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notificaciones
            {!connected && (
              <Typography 
                component="span" 
                variant="caption" 
                sx={{ ml: 1, color: 'warning.main' }}
              >
                (offline)
              </Typography>
            )}
          </Typography>
          
          {unreadCount > 0 && (
            <Button 
              size="small" 
              startIcon={<CheckIcon />}
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    transition: 'background-color 0.3s'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.read ? 'normal' : 'bold',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        {notification.title}
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ ml: 1, whiteSpace: 'nowrap' }}
                        >
                          {formatDateTime(notification.timestamp)}
                        </Typography>
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
