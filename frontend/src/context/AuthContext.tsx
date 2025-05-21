import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/api/authService';

// Definir tipos
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'professional' | 'patient';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comprobar si el usuario ya está autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      // Verificamos si existe un token de acceso
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          // Obtenemos los datos del usuario actual usando el servicio
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Si hay un error con el token, cerrar sesión
          authService.logout();
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar el servicio de autenticación para iniciar sesión
      const authResponse = await authService.login({ email, password });
      
      // En lugar de usar directamente userData.user, que podría estar incompleto,
      // obtenemos los datos completos del usuario usando getCurrentUser
      try {
        console.log('Login exitoso, obteniendo datos completos del usuario...');
        const completeUserData = await authService.getCurrentUser();
        
        // Verificar que tenemos el rol para mostrar correctamente el menú
        if (!completeUserData.role) {
          console.warn('Advertencia: Los datos del usuario no incluyen el rol');
        } else {
          console.log(`Usuario autenticado con rol: ${completeUserData.role}`);
        }
        
        // Establecer el usuario completo en el estado
        setUser(completeUserData);
      } catch (userError) {
        console.error('Error al obtener datos completos del usuario:', userError);
        // Si falla, usamos los datos parciales que recibimos del login
        setUser(authResponse.user);
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al iniciar sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para registrar usuario
  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar el servicio de autenticación para registrar
      const response = await authService.register(userData);
      
      // Si el registro es exitoso, iniciar sesión automáticamente
      if (response.tokens) {
        // Iniciar sesión directamente con las credenciales
        await login(userData.email, userData.password);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.email?.[0] || 
                         'Error al registrar usuario';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    // Usar el servicio de autenticación para cerrar sesión
    authService.logout();
    setUser(null);
  };

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    error,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
