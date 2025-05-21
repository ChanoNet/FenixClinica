import React, { forwardRef } from 'react';
import { Snackbar, Alert, AlertProps, Slide, SlideProps } from '@mui/material';

// Transición personalizada para las notificaciones
const SlideTransition = forwardRef(function Transition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return <Slide {...props} direction="up" ref={ref} />;
});

export interface NotificationProps {
  open: boolean;
  message: string;
  severity?: AlertProps['severity'];
  autoHideDuration?: number;
  onClose: () => void;
}

/**
 * Componente de notificación que muestra mensajes de feedback al usuario
 */
const Notification: React.FC<NotificationProps> = ({
  open,
  message,
  severity = 'info',
  autoHideDuration = 5000,
  onClose
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;
