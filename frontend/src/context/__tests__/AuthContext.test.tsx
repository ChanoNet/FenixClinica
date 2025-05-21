import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import authService from '../../services/api/authService';

// Mock del servicio de autenticación
jest.mock('../../services/api/authService');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Componente de prueba para acceder al contexto
const TestComponent = () => {
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Cargando...' : 'Completado'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'Autenticado' : 'No autenticado'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button 
        data-testid="login-button" 
        onClick={() => login({ email: 'test@example.com', password: 'password123' })}
      >
        Iniciar sesión
      </button>
      <button data-testid="logout-button" onClick={logout}>Cerrar sesión</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Limpiar mocks entre pruebas
    jest.clearAllMocks();
    
    // Limpiar el localStorage
    localStorage.clear();
  });

  it('debe proporcionar un estado inicial de no autenticado', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado');
    expect(screen.getByTestId('loading')).toHaveTextContent('Completado');
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
  });

  it('debe autenticar al usuario después del inicio de sesión exitoso', async () => {
    // Configurar mock del servicio de autenticación
    const mockUser = { 
      id: 1, 
      email: 'test@example.com', 
      first_name: 'Usuario', 
      last_name: 'Prueba',
      role: 'admin'
    };
    const mockToken = 'fake-token-123';
    
    mockedAuthService.login.mockResolvedValueOnce({
      user: mockUser,
      token: mockToken
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verificar estado inicial
    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado');

    // Simular inicio de sesión
    await act(async () => {
      userEvent.click(screen.getByTestId('login-button'));
    });

    // Verificar que se llamó al servicio con los parámetros correctos
    expect(mockedAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });

    // Esperar a que se actualice el estado
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Autenticado');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Verificar que el token se guardó en localStorage
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  it('debe cerrar la sesión del usuario correctamente', async () => {
    // Simular un usuario ya autenticado
    localStorage.setItem('token', 'fake-token-123');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'test@example.com',
      first_name: 'Usuario',
      last_name: 'Prueba',
      role: 'admin'
    }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verificar que el usuario está autenticado inicialmente
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Autenticado');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Simular cierre de sesión
    await act(async () => {
      userEvent.click(screen.getByTestId('logout-button'));
    });

    // Verificar que el usuario ya no está autenticado
    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado');
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();

    // Verificar que el token y el usuario se eliminaron del localStorage
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
