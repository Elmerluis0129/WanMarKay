import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export const ServerError: React.FC = () => {
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
      <ReportProblemIcon sx={{ fontSize: 120, color: '#E31C79', mb: 2 }} />
      <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        500
      </Typography>
      <Typography variant="h5" gutterBottom>
        Error Interno
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Ha ocurrido un error inesperado.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}>
          Reintentar
        </Button>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Inicio
        </Button>
      </Stack>
    </Box>
  );
};

export default ServerError; 