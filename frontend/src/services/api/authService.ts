import axiosInstance from './config';

// Tipos para los parámetros de solicitud
interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'professional' | 'patient';
  phone_number?: string;
}

interface ForgotPasswordParams {
  email: string;
}

interface ResetPasswordParams {
  token: string;
  password: string;
  password2: string;
}

// Servicio de autenticación
const authService = {
  // Inicio de sesión
  login: async (params: LoginParams) => {
    try {
      console.log('Intentando autenticar con:', params.email);
      
      // Enviamos tanto username como email para mayor compatibilidad con SimpleJWT
      const authData = {
        username: params.email, // SimpleJWT usa username por defecto
        email: params.email,    // Por si hay una sobrecarga personalizada
        password: params.password
      };
      
      console.log('Datos de autenticación enviados:', authData);
      const response = await axiosInstance.post('/v1/users/token/', authData);
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      
      // Si no hay un campo user en la respuesta, creamos uno con información básica
      // para asegurar compatibilidad con el AuthContext
      if (!response.data.user) {
        response.data.user = {
          email: params.email,
          // Otros campos pueden ser completados después al cargar el perfil completo
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error en la autenticación:', error);
      throw error;
    }
  },

  // Registro de usuario
  register: async (params: RegisterParams) => {
    const response = await axiosInstance.post('/v1/users/register/', params);
    return response.data;
  },

  // Recuperación de contraseña
  forgotPassword: async (params: ForgotPasswordParams) => {
    const response = await axiosInstance.post('/v1/users/password-reset/', params);
    return response.data;
  },

  // Restablecimiento de contraseña
  resetPassword: async (params: ResetPasswordParams) => {
    const response = await axiosInstance.post('/v1/users/password-reset-confirm/', params);
    return response.data;
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/v1/users/me/');
    return response.data;
  },

  // Actualizar perfil de usuario
  updateProfile: async (data: any) => {
    const response = await axiosInstance.patch('/v1/users/me/', data);
    return response.data;
  },

  // Cambiar contraseña
  changePassword: async (data: { current_password: string; new_password: string; new_password2: string }) => {
    const response = await axiosInstance.post('/v1/users/change-password/', data);
    return response.data;
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

export default authService;
