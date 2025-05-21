import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme as useMuiTheme } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const AuthLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const theme = useMuiTheme();

  // Si el usuario ya está autenticado, redirigir al dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'background.default',
        py: 6,
        backgroundImage: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, rgba(98, 0, 234, 0.1) 0%, rgba(3, 218, 198, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(98, 0, 234, 0.2) 0%, rgba(3, 218, 198, 0.2) 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              textShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              mb: 1,
            }}
          >
            FenixClinicas
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center">
            Sistema de Gestión de Citas Médicas
          </Typography>
        </Box>
        
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 3,
            mb: 3,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
        >
          <Outlet />
        </Paper>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          &copy; {new Date().getFullYear()} FenixClinicas. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
};

export default AuthLayout;
