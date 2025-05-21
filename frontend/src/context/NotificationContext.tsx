import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationProps } from '../components/feedback/Notification';

// Tipo para las notificaciones sin incluir las props de control
type NotificationMessage = Omit<NotificationProps, 'open' | 'onClose'>;

// Interface para el contexto
interface NotificationContextProps {
  showNotification: (notification: NotificationMessage) => void;
  hideNotification: () => void;
}

// Crear el contexto
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de un NotificationProvider');
  }
  return context;
};

// Propiedades del proveedor
interface NotificationProviderProps {
  children: ReactNode;
}

// Componente proveedor
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationMessage | null>(null);
  const [open, setOpen] = useState(false);

  const showNotification = (newNotification: NotificationMessage) => {
    setNotification(newNotification);
    setOpen(true);
  };

  const hideNotification = () => {
    setOpen(false);
  };

  // Handler para cuando la notificación se cierra
  const handleClose = () => {
    setOpen(false);
    
    // Opcional: limpiar después de un tiempo para animaciones
    setTimeout(() => {
      setNotification(null);
    }, 300);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && (
        <Notification
          open={open}
          message={notification.message}
          severity={notification.severity}
          autoHideDuration={notification.autoHideDuration}
          onClose={handleClose}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
