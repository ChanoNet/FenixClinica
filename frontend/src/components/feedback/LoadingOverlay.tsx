import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

/**
 * Componente que muestra un overlay de carga con un mensaje opcional
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ open, message }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      open={open}
    >
      <CircularProgress color="primary" size={60} thickness={4} />
      {message && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="h6">{message}</Typography>
        </Box>
      )}
    </Backdrop>
  );
};

export default LoadingOverlay;
