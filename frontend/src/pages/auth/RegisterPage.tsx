import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'patient',
    phone_number: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();
  
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    let isValid = true;
    
    if (!formData.email) {
      errors.email = "El correo electrónico es obligatorio";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Dirección de correo inválida";
      isValid = false;
    }
    
    if (!formData.password) {
      errors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    }
    
    if (formData.password !== formData.password2) {
      errors.password2 = "Las contraseñas no coinciden";
      isValid = false;
    }
    
    if (!formData.first_name) {
      errors.first_name = "El nombre es obligatorio";
      isValid = false;
    }
    
    if (!formData.last_name) {
      errors.last_name = "El apellido es obligatorio";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    setFormData({
      ...formData,
      role: e.target.value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Usar el servicio de autenticación para registrar al usuario
      await register(formData);
      // Si el registro es exitoso, mostrar mensaje y redirigir al dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Error en registro:', err);
      
      // Manejar errores específicos del backend
      if (err.response?.data) {
        const backendErrors = err.response.data;
        const newFormErrors: {[key: string]: string} = {};
        
        // Procesar errores para cada campo si vienen del backend
        Object.keys(backendErrors).forEach(key => {
          if (Array.isArray(backendErrors[key])) {
            newFormErrors[key] = backendErrors[key][0];
          } else if (typeof backendErrors[key] === 'string') {
            newFormErrors[key] = backendErrors[key];
          }
        });
        
        if (Object.keys(newFormErrors).length > 0) {
          setFormErrors(newFormErrors);
        }
      }
    }
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
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
        Crear una cuenta
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Completa el formulario para registrarte en el sistema
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
          value={formData.email}
          onChange={handleChange}
          error={!!formErrors.email}
          helperText={formErrors.email}
          disabled={loading}
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="first_name"
            label="Nombre"
            name="first_name"
            autoComplete="given-name"
            value={formData.first_name}
            onChange={handleChange}
            error={!!formErrors.first_name}
            helperText={formErrors.first_name}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="last_name"
            label="Apellido"
            name="last_name"
            autoComplete="family-name"
            value={formData.last_name}
            onChange={handleChange}
            error={!!formErrors.last_name}
            helperText={formErrors.last_name}
            disabled={loading}
          />
        </Box>
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="role-label">Tipo de Usuario</InputLabel>
          <Select
            labelId="role-label"
            id="role"
            value={formData.role}
            label="Tipo de Usuario"
            onChange={handleRoleChange}
            disabled={loading}
          >
            <MenuItem value="patient">Paciente</MenuItem>
            <MenuItem value="professional">Profesional</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          margin="normal"
          fullWidth
          id="phone_number"
          label="Teléfono"
          name="phone_number"
          autoComplete="tel"
          value={formData.phone_number}
          onChange={handleChange}
          disabled={loading}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          error={!!formErrors.password}
          helperText={formErrors.password}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          name="password2"
          label="Confirmar Contraseña"
          type={showPassword ? 'text' : 'password'}
          id="password2"
          autoComplete="new-password"
          value={formData.password2}
          onChange={handleChange}
          error={!!formErrors.password2}
          helperText={formErrors.password2}
          disabled={loading}
        />
        
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          type="submit"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Registrarse"}
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
          <Typography variant="body2">
            ¿Ya tienes una cuenta?
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/login')}
            sx={{ ml: 1 }}
          >
            Iniciar sesión
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
