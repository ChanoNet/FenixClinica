import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Por favor, ingresa una dirección de correo electrónico válida");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Simulamos el envío de correo (en producción, esto sería una llamada a la API)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
        Recuperar contraseña
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success ? (
        <Box sx={{ width: '100%' }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Se han enviado las instrucciones a tu correo electrónico. Por favor, revisa tu bandeja de entrada.
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/login')}
          >
            Volver al inicio de sesión
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            type="submit"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Enviar instrucciones"}
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/login')}
            >
              Volver al inicio de sesión
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ForgotPasswordPage;
