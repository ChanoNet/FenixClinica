import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/api/authService';

// Componente para la pestaña de información personal
const PersonalInfoTab: React.FC<{ userData: any; onSave: (data: any) => void }> = ({ userData, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del usuario cuando cambia userData
  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || ''
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      // Enviar los datos actualizados a la API
      await authService.updateProfile(formData);
      
      // Actualizar el estado local
      onSave(formData);
      setSuccess(true);
      
      // Ocultar mensaje de éxito después de un tiempo
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error al guardar cambios:', err);
      setError(err.response?.data?.detail || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSavePersonalInfo}>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Información personal actualizada correctamente
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nombre"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Apellido"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Correo electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled // El email no se puede cambiar
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Número de teléfono"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Guardar cambios'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Componente para la pestaña de cambio de contraseña
const ChangePasswordTab: React.FC = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (formData.new_password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Enviar solicitud de cambio de contraseña a la API
      await authService.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        new_password2: formData.confirm_password
      });
      
      // Limpiar el formulario
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setSuccess(true);
      
      // Ocultar mensaje de éxito después de un tiempo
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error al cambiar la contraseña:', err);
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') setShowCurrentPassword(!showCurrentPassword);
    if (field === 'new') setShowNewPassword(!showNewPassword);
    if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Contraseña actualizada correctamente
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Contraseña actual"
            name="current_password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={formData.current_password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('current')}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nueva contraseña"
            name="new_password"
            type={showNewPassword ? 'text' : 'password'}
            value={formData.new_password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('new')}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Confirmar nueva contraseña"
            name="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirm_password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('confirm')}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Cambiar contraseña'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Componente principal
const ProfilePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Obtener datos del usuario actual desde la API
        const userData = await authService.getCurrentUser();
        setUserData(userData);
      } catch (error) {
        console.error('Error al cargar los datos del usuario:', error);
        // Simular datos como fallback
        const mockUser = {
          id: 1,
          first_name: 'Juan',
          last_name: 'Pérez',
          email: 'juan.perez@example.com',
          phone_number: '555-123-4567',
          profile_picture: null,
          role: 'admin'
        };
        
        setUserData(mockUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSavePersonalInfo = (data: any) => {
    // Actualizar los datos del usuario
    setUserData({
      ...userData,
      ...data
    });
  };

  // Función para generar las iniciales a partir del nombre y apellido
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Obtener el nombre de rol en español
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'professional':
        return 'Profesional';
      case 'patient':
        return 'Paciente';
      default:
        return role;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Mi Perfil
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : userData ? (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#1976d2',
                  fontSize: '2rem'
                }}
              >
                {getInitials(userData.first_name, userData.last_name)}
              </Avatar>
              
              <Box sx={{ ml: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {userData.first_name} {userData.last_name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {userData.email}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    display: 'inline-block',
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    mt: 1
                  }}
                >
                  {getRoleName(userData.role)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab 
                icon={<PersonIcon />} 
                label="Información Personal" 
                iconPosition="start"
              />
              <Tab 
                icon={<LockIcon />} 
                label="Cambiar Contraseña" 
                iconPosition="start"
              />
            </Tabs>
            
            <Divider />
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <PersonalInfoTab userData={userData} onSave={handleSavePersonalInfo} />
              )}
              
              {tabValue === 1 && (
                <ChangePasswordTab />
              )}
            </Box>
          </Paper>
        </>
      ) : (
        <Alert severity="error">
          Error al cargar los datos del perfil. Por favor, inténtalo de nuevo más tarde.
        </Alert>
      )}
    </Box>
  );
};

export default ProfilePage;
