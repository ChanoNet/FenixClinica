import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, Theme, PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Recuperar el modo preferido del localStorage o utilizar 'light' como predeterminado
  const storedMode = localStorage.getItem('themeMode') as PaletteMode | null;
  const [mode, setMode] = useState<PaletteMode>(storedMode || 'light');

  // Alternar entre modos claro y oscuro
  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Crear el tema según el modo
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            // Cambiado de púrpura a un azul más moderno
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
            contrastText: '#ffffff',
          },
          secondary: {
            // Verde/turquesa más suave
            main: '#00BFA5',
            light: '#5df2d6',
            dark: '#008e76',
            contrastText: '#000000',
          },
          error: {
            main: '#f44336', // Rojo más estándar
            light: '#e57373',
            dark: '#d32f2f',
          },
          warning: {
            main: '#ff9800', // Naranja 
            light: '#ffb74d',
            dark: '#f57c00',
          },
          info: {
            main: '#29b6f6', // Azul claro
            light: '#4fc3f7',
            dark: '#0288d1',
          },
          success: {
            main: '#4caf50', // Verde
            light: '#81c784',
            dark: '#388e3c',
          },
          background: {
            default: mode === 'light' ? '#f8f9fa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          // Mejoras para el modo oscuro
          ...(mode === 'dark' && {
            primary: {
              main: '#90caf9', // Azul más claro para modo oscuro
              light: '#e3f2fd',
              dark: '#42a5f5',
              contrastText: '#000000',
            },
            secondary: {
              main: '#80cbc4', // Verde/turquesa más claro
              light: '#b2dfdb',
              dark: '#4db6ac',
              contrastText: '#000000',
            },
            text: {
              primary: '#ffffff',
              secondary: 'rgba(255, 255, 255, 0.7)',
              disabled: 'rgba(255, 255, 255, 0.5)',
            },
            divider: 'rgba(255, 255, 255, 0.12)',
          }),
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 500,
            fontSize: 'clamp(2rem, 5vw, 2.5rem)', // Tamaño responsive
          },
          h2: {
            fontWeight: 500,
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          },
          h3: {
            fontWeight: 500,
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          },
          h4: {
            fontWeight: 500,
            fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
          },
          h5: {
            fontWeight: 500,
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          },
          body1: {
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
          },
          body2: {
            fontSize: 'clamp(0.8rem, 1.25vw, 0.875rem)',
          },
          button: {
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: '0.95rem',
                '@media (max-width:600px)': {
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                },
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                },
              },
              // Mejorar el color de los botones de texto en modo oscuro
              text: {
                ...(mode === 'dark' && {
                  color: '#90caf9',
                }),
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                boxShadow: mode === 'light' 
                  ? '0px 4px 20px rgba(0, 0, 0, 0.05)' 
                  : '0px 4px 20px rgba(0, 0, 0, 0.3)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                overflow: 'hidden',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '@media (hover: hover)': { // Solo aplicar en dispositivos que soporten hover
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: mode === 'light' 
                      ? '0px 8px 25px rgba(0, 0, 0, 0.1)' 
                      : '0px 8px 25px rgba(0, 0, 0, 0.4)',
                  },
                },
                '@media (max-width:600px)': {
                  borderRadius: 6, // Bordes más pequeños en móviles
                },
              },
            },
          },
          // Mejoras para dispositivos móviles
          MuiContainer: {
            styleOverrides: {
              root: {
                '@media (max-width:600px)': {
                  padding: '0 12px',
                },
              },
            },
          },
          // Mejoras para las tablas en dispositivos móviles
          MuiTable: {
            styleOverrides: {
              root: {
                '@media (max-width:768px)': {
                  overflowX: 'auto',
                  display: 'block',
                },
              },
            },
          },
          // Mejoras para los iconos
          MuiSvgIcon: {
            styleOverrides: {
              root: {
                fontSize: '1.25rem',
                '@media (max-width:600px)': {
                  fontSize: '1.1rem',
                },
              },
            },
          },
          // Mejoras para los inputs
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                '& fieldset': {
                  borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)',
                  transition: 'border-color 0.2s ease-in-out',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'light' ? '#2196f3' : '#90caf9',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
