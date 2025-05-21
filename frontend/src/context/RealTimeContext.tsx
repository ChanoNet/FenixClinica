import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import websocketService, { WebSocketEventType } from '../services/websocketService';

// Define la estructura de los datos para las notificaciones en tiempo real
interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: string;
  link?: string;
}

// Interface para el contexto
interface RealTimeContextProps {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

// Crear el contexto
const RealTimeContext = createContext<RealTimeContextProps | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime debe ser usado dentro de un RealTimeProvider');
  }
  return context;
};

// Propiedades del proveedor
interface RealTimeProviderProps {
  children: ReactNode;
}

// Componente proveedor
export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);

  // Obtener el número de notificaciones no leídas
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Manejar la recepción de notificaciones generales
  const handleNotification = (payload: any) => {
    if (payload.message) {
      showNotification({
        message: payload.message,
        severity: payload.severity || 'info',
        autoHideDuration: 5000
      });
    }
    
    // Actualizar el estado de conexión si se proporciona
    if (payload.connected !== undefined) {
      setConnected(payload.connected);
    }
  };

  // Manejar la creación de citas
  const handleAppointmentCreated = (payload: any) => {
    const { appointment } = payload;
    
    // Crear notificación para el usuario
    const newNotification: Notification = {
      id: Date.now(), // Usar timestamp como ID temporal
      title: 'Nueva cita creada',
      message: `Se ha creado una nueva cita para ${appointment.patient_name} con ${appointment.professional_name} para el ${new Date(appointment.start_time).toLocaleDateString('es-ES')}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'appointment_created',
      link: `/appointments/${appointment.id}`
    };
    
    // Añadir a la lista de notificaciones
    setNotifications(prev => [newNotification, ...prev]);
    
    // Mostrar notificación visual
    showNotification({
      message: newNotification.message,
      severity: 'success',
      autoHideDuration: 6000
    });
  };

  // Manejar actualización de citas
  const handleAppointmentUpdated = (payload: any) => {
    const { appointment } = payload;
    
    // Crear notificación para el usuario
    const newNotification: Notification = {
      id: Date.now(),
      title: 'Cita actualizada',
      message: `La cita con ${appointment.professional_name} para el ${new Date(appointment.start_time).toLocaleDateString('es-ES')} ha sido actualizada`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'appointment_updated',
      link: `/appointments/${appointment.id}`
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    showNotification({
      message: newNotification.message,
      severity: 'info',
      autoHideDuration: 6000
    });
  };

  // Manejar eliminación de citas
  const handleAppointmentDeleted = (payload: any) => {
    const { appointment_id } = payload;
    
    // Crear notificación para el usuario
    const newNotification: Notification = {
      id: Date.now(),
      title: 'Cita cancelada',
      message: 'Una cita ha sido cancelada',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'appointment_deleted'
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    showNotification({
      message: newNotification.message,
      severity: 'warning',
      autoHideDuration: 6000
    });
  };

  // Manejar recordatorios de citas
  const handleAppointmentReminder = (payload: any) => {
    const { appointment } = payload;
    
    // Crear notificación para el usuario
    const newNotification: Notification = {
      id: Date.now(),
      title: 'Recordatorio de cita',
      message: `Recordatorio: Tiene una cita con ${appointment.professional_name} mañana a las ${new Date(appointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'appointment_reminder',
      link: `/appointments/${appointment.id}`
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    showNotification({
      message: newNotification.message,
      severity: 'info',
      autoHideDuration: 10000 // Mostrar por más tiempo
    });
  };

  // Marcar una notificación como leída
  const markAsRead = (id: number) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Efecto para conectar/desconectar WebSocket
  useEffect(() => {
    // Solo conectar si el usuario está autenticado
    if (isAuthenticated && user) {
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (token) {
        // Registrar los manejadores de eventos
        websocketService.subscribe('notification', handleNotification);
        websocketService.subscribe('appointment_created', handleAppointmentCreated);
        websocketService.subscribe('appointment_updated', handleAppointmentUpdated);
        websocketService.subscribe('appointment_deleted', handleAppointmentDeleted);
        websocketService.subscribe('appointment_reminder', handleAppointmentReminder);
        
        // Conectar al WebSocket
        websocketService.connect(token);
        setConnected(true);
      }
    } else {
      // Desconectar si el usuario no está autenticado
      websocketService.disconnect();
      setConnected(false);
    }

    // Limpieza al desmontar
    return () => {
      // Eliminar los manejadores de eventos
      const eventTypes: WebSocketEventType[] = [
        'notification',
        'appointment_created',
        'appointment_updated',
        'appointment_deleted',
        'appointment_reminder'
      ];
      
      eventTypes.forEach(eventType => {
        if (eventType === 'notification') {
          websocketService.unsubscribe(eventType, handleNotification);
        } else if (eventType === 'appointment_created') {
          websocketService.unsubscribe(eventType, handleAppointmentCreated);
        } else if (eventType === 'appointment_updated') {
          websocketService.unsubscribe(eventType, handleAppointmentUpdated);
        } else if (eventType === 'appointment_deleted') {
          websocketService.unsubscribe(eventType, handleAppointmentDeleted);
        } else if (eventType === 'appointment_reminder') {
          websocketService.unsubscribe(eventType, handleAppointmentReminder);
        }
      });
    };
  }, [isAuthenticated, user]);

  // Valores del contexto
  const contextValue: RealTimeContextProps = {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeContext;
