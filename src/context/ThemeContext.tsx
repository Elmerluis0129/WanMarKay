import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Paleta de colores para modo oscuro
const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#E31C79',
    dark: '#C4156A',
  },
  background: {
    default: '#23202B', // Gris violeta oscuro
    paper: '#2D2535',   // Lavanda oscuro
  },
  text: {
    primary: '#F3EAF7', // Blanco lavanda
    secondary: '#BCAFC9',
  },
  divider: '#3A2F4A',
};

// Paleta de colores para modo claro (actual)
const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#E31C79',
    dark: '#C4156A',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#2D2D2D',
    secondary: '#6D6D6D',
  },
  divider: '#E0BFD8',
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Intentar recuperar el tema guardado en localStorage
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'light';
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme = useMemo(() => {
    const palette = mode === 'dark' ? darkPalette : lightPalette;
    return createTheme({
      palette,
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#2D2535' : '#E31C79',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: palette.background.paper,
              color: palette.text.primary,
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              backgroundColor: palette.background.paper,
              color: palette.text.primary,
              borderColor: mode === 'dark' ? '#3A2F4A' : '#E0BFD8',
            },
            head: {
              backgroundColor: mode === 'dark' ? '#2D2535' : '#f5f5f5',
              color: palette.text.primary,
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              '&:nth-of-type(odd)': {
                backgroundColor: mode === 'dark' ? '#282232' : '#fff',
              },
              '&:nth-of-type(even)': {
                backgroundColor: mode === 'dark' ? '#23202B' : '#f9f9f9',
              },
            },
          },
        },
        MuiTable: {
          styleOverrides: {
            root: {
              backgroundColor: palette.background.paper,
            },
          },
        },
      },
    });
  }, [mode]);

  const value = useMemo(() => ({
    mode,
    toggleTheme,
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 