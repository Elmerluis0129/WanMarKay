import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import { useNavigate } from 'react-router-dom';

export const Maintenance: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center',
      px: 2,
      backgroundColor: '#f5f5f5',
    }}>
      <BuildIcon sx={{ fontSize: 120, color: '#E31C79', mb: 2 }} />
      <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        503
      </Typography>
      <Typography variant="h5" gutterBottom>
        Página en Mantenimiento
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Volveremos muy pronto.
      </Typography>
      <Button variant="contained" onClick={() => window.location.reload()} sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}>
        Reintentar
      </Button>
    </Box>
  );
};

export default Maintenance; 