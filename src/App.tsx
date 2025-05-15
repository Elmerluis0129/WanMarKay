import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { AppRoutes } from './routes/AppRoutes';
import { Footer } from './components/shared/Footer';

const theme = createTheme({
  palette: {
    primary: {
      main: '#E31C79',
      dark: '#C4156A',
    },
    background: {
      default: '#f5f5f5',
    },
  },
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
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Router>
          {/* Fondo animado global */}
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
            <style>{`
              @keyframes gradientMove {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animated-bg {
                position: absolute;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(120deg, #fbeff7 0%, #f7e9f3 100%, #fff 100%);
                background-size: 200% 200%;
                animation: gradientMove 10s ease-in-out infinite;
                z-index: 0;
              }
              .bubble {
                position: absolute;
                border-radius: 50%;
                opacity: 0.15;
                background: #E31C79;
                animation: floatxy 3s infinite linear;
              }
              @keyframes floatxy {
                0% { transform: translate(0, 0) scale(1); }
                25% { transform: translate(20px, -20px) scale(1.07); }
                50% { transform: translate(-20px, -40px) scale(1.1); }
                75% { transform: translate(-10px, -20px) scale(1.05); }
                100% { transform: translate(0, 0) scale(1); }
              }
            `}</style>
            <div className="animated-bg" />
            <div className="bubble" style={{ width: 120, height: 120, left: '10%', top: '60%', animationDelay: '0s' }} />
            <div className="bubble" style={{ width: 80, height: 80, left: '70%', top: '20%', animationDelay: '2s' }} />
            <div className="bubble" style={{ width: 60, height: 60, left: '50%', top: '80%', animationDelay: '4s' }} />
            <div className="bubble" style={{ width: 100, height: 100, left: '80%', top: '70%', animationDelay: '6s' }} />
            <div className="bubble" style={{ width: 90, height: 90, left: '20%', top: '10%', animationDelay: '1s' }} />
            <div className="bubble" style={{ width: 70, height: 70, left: '60%', top: '60%', animationDelay: '3s' }} />
            <div className="bubble" style={{ width: 50, height: 50, left: '30%', top: '75%', animationDelay: '5s' }} />
            <div className="bubble" style={{ width: 110, height: 110, left: '85%', top: '30%', animationDelay: '7s' }} />
            <div className="bubble" style={{ width: 40, height: 40, left: '40%', top: '15%', animationDelay: '2.5s' }} />
            <div className="bubble" style={{ width: 60, height: 60, left: '75%', top: '50%', animationDelay: '4.5s' }} />
            <div className="bubble" style={{ width: 55, height: 55, left: '15%', top: '30%', animationDelay: '1.5s' }} />
            <div className="bubble" style={{ width: 85, height: 85, left: '35%', top: '60%', animationDelay: '3.5s' }} />
            <div className="bubble" style={{ width: 45, height: 45, left: '65%', top: '10%', animationDelay: '2.2s' }} />
            <div className="bubble" style={{ width: 75, height: 75, left: '55%', top: '40%', animationDelay: '5.5s' }} />
            <div className="bubble" style={{ width: 95, height: 95, left: '25%', top: '85%', animationDelay: '6.5s' }} />
            <div className="bubble" style={{ width: 35, height: 35, left: '80%', top: '10%', animationDelay: '3.8s' }} />
            <div className="bubble" style={{ width: 65, height: 65, left: '90%', top: '50%', animationDelay: '7.2s' }} />
            <div className="bubble" style={{ width: 50, height: 50, left: '5%', top: '80%', animationDelay: '8s' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
            <div style={{ flex: 1 }}>
              <AppRoutes />
            </div>
            <Footer />
          </div>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
