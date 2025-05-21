import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Componente de prueba para acceder al contexto
const TestComponent = () => {
  const { mode, toggleColorMode } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-mode">{mode}</div>
      <button data-testid="toggle-button" onClick={toggleColorMode}>
        Cambiar tema
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Simular localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Limpiar mock entre pruebas
    jest.clearAllMocks();
  });

  it('debe proporcionar el modo de tema predeterminado (light)', () => {
    // Configurar localStorage para devolver null (sin tema guardado)
    localStorage.getItem = jest.fn().mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('debe cargar el tema desde localStorage si está disponible', () => {
    // Configurar localStorage para devolver un tema guardado
    localStorage.getItem = jest.fn().mockReturnValue('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    expect(localStorage.getItem).toHaveBeenCalledWith('theme');
  });

  it('debe cambiar el tema correctamente al hacer clic en el botón', () => {
    // Configurar localStorage para devolver un tema inicial
    localStorage.getItem = jest.fn().mockReturnValue('light');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Verificar tema inicial
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');

    // Hacer clic en el botón de cambio de tema
    fireEvent.click(screen.getByTestId('toggle-button'));

    // Verificar que el tema ha cambiado
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    
    // Verificar que se guarda en localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});
