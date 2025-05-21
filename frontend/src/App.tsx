import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { RealTimeProvider } from './context/RealTimeContext';
import LoadingOverlay from './components/feedback/LoadingOverlay';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Páginas públicas
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Páginas protegidas - Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Páginas protegidas - Citas
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import AppointmentFormPage from './pages/appointments/AppointmentFormPage';
import AppointmentDetailsPage from './pages/appointments/AppointmentDetailsPage';

// Páginas protegidas - Profesionales
import ProfessionalsPage from './pages/professionals/ProfessionalsPage';
import ProfessionalDetailsPage from './pages/professionals/ProfessionalDetailsPage';
import ProfessionalFormPage from './pages/professionals/ProfessionalFormPage';

// Páginas protegidas - Pacientes
import PatientsPage from './pages/patients/PatientsPage';
import PatientDetailsPage from './pages/patients/PatientDetailsPage';
import PatientFormPage from './pages/patients/PatientFormPage';

// Páginas protegidas - Usuario
import ProfilePage from './pages/profile/ProfilePage';

// Páginas de error
import NotFoundPage from './pages/errors/NotFoundPage';

// Componente de ruta protegida con mejor experiencia de carga
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay open={true} message="Verificando credenciales..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { theme } = useTheme();
  
  // Función para limpiar caché cada cierto tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      // Llamar a cacheService.cleanExpired() para limpiar los elementos expirados
      console.log('[Caché] Limpiando caché expirado');
      try {
        // Se puede importar y usar cacheService.cleanExpired() aquí
      } catch (error) {
        console.error('Error al limpiar caché:', error);
      }
    }, 60 * 1000); // Cada minuto
    
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <RealTimeProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Rutas protegidas */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          
          {/* Rutas de citas */}
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/new" element={<AppointmentFormPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
          <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />
          
          {/* Rutas de profesionales */}
          <Route path="/professionals" element={<ProfessionalsPage />} />
          <Route path="/professionals/new" element={<ProfessionalFormPage />} />
          <Route path="/professionals/:id" element={<ProfessionalDetailsPage />} />
          <Route path="/professionals/:id/edit" element={<ProfessionalFormPage />} />
          
          {/* Rutas de pacientes */}
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/new" element={<PatientFormPage />} />
          <Route path="/patients/:id" element={<PatientDetailsPage />} />
          <Route path="/patients/:id/edit" element={<PatientFormPage />} />
          
          {/* Rutas de perfil de usuario */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Ruta por defecto para páginas no encontradas */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
        </RealTimeProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
