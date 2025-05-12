import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block';

export const Forbidden: React.FC = () => {
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
      <BlockIcon sx={{ fontSize: 120, color: '#E31C79', mb: 2 }} />
      <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        403
      </Typography>
      <Typography variant="h5" gutterBottom>
        Acceso Denegado
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        No tienes permisos para ver esta página.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Volver
        </Button>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}>
          Inicio
        </Button>
      </Stack>
    </Box>
  );
};

export default Forbidden; 