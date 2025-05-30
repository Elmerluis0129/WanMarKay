import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { aboutMeService } from '../../services/aboutMeService';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const data = await aboutMeService.getAboutMe();
        setLogoUrl(data.logo_url || null);
      } catch (error) {
        console.error('Error al cargar el logo:', error);
      }
    };

    fetchLogo();
    
    // Escuchar actualizaciones del logo
    const handleLogoUpdate = () => fetchLogo();
    window.addEventListener('logo-updated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('logo-updated', handleLogoUpdate);
    };
  }, []);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        px: 3,
        py: 4,
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
        color: theme.palette.text.primary,
      }}
    >
      {/* Logo */}
      {logoUrl && (
        <Box 
          component="img"
          src={logoUrl}
          alt="Logo"
          sx={{
            height: 80,
            width: 'auto',
            mb: 4,
            objectFit: 'contain',
            filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'none'
          }}
        />
      )}
      
      <Box 
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 3,
          maxWidth: 600,
          width: '100%',
          mx: 'auto',
        }}
      >
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: 100, 
            color: theme.palette.primary.main,
            mb: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }} 
        />
        
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: '6rem',
            lineHeight: 1.1,
            color: theme.palette.primary.main,
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            mb: 3
          }}
        >
          404
        </Typography>
        
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mb: 2,
            color: theme.palette.text.primary
          }}
        >
          Página no encontrada
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 4,
            color: theme.palette.text.secondary,
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          Lo sentimos, no pudimos encontrar la página que estás buscando.
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          justifyContent="center"
          sx={{ mt: 4 }}
        >
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'action.hover'
              }
            }}
          >
            Volver atrás
          </Button>
          
          <Button 
            variant="contained" 
            onClick={() => navigate('/admin/reports')}
            size="large"
            sx={{ 
              px: 4,
              py: 1.5,
              backgroundColor: 'primary.main',
              '&:hover': { 
                backgroundColor: 'primary.dark',
                boxShadow: 3
              },
              boxShadow: 2
            }}
          >
            Ir al inicio
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default NotFound;