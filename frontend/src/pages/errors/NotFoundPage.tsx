import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        py: 5 
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5,
            borderRadius: 2,
            maxWidth: '600px',
            width: '100%'
          }}
        >
          <Typography variant="h1" sx={{ fontSize: { xs: '4rem', md: '8rem' }, fontWeight: 'bold', color: 'primary.main' }}>
            404
          </Typography>
          
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            Página no encontrada
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </Typography>
          
          <Button 
            variant="contained" 
            startIcon={<HomeIcon />}
            size="large"
            onClick={() => navigate('/')}
            sx={{ mt: 3 }}
          >
            Volver al inicio
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
