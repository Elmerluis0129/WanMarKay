import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        px: 2,
        backgroundColor: '#f5f5f5',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 120, color: '#E31C79', mb: 2 }} />
      <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        404
      </Typography>
      <Typography variant="h5" gutterBottom>
        Página no encontrada
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Lo sentimos, la página que buscas no existe.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Volver atrás
        </Button>
        <Button variant="contained" onClick={() => navigate('/admin/reports')}
          sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}
        >
          Ir al inicio
        </Button>
      </Stack>
    </Box>
  );
};

export default NotFound; 