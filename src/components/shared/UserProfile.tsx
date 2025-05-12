import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Container } from '@mui/material';
import { auth } from '../../services/auth';

export const UserProfile: React.FC = () => {
  const user = auth.getCurrentUser();
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.fullName || '');

  const handleSave = () => {
    // Placeholder: implementar guardado de perfil
    alert('Perfil guardado');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#E31C79' }}>
        Mi Perfil
      </Typography>
      <Box component="form" noValidate autoComplete="off">
        <TextField
          fullWidth
          label="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Nombre Completo"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}
        >
          Guardar Perfil
        </Button>
      </Box>
    </Container>
  );
};

export default UserProfile; 