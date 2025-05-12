import React from 'react';
import { Box, Typography } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

export const NoResults: React.FC = () => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    textAlign: 'center',
    px: 2
  }}>
    <SearchOffIcon sx={{ fontSize: 80, color: '#E31C79', mb: 2 }} />
    <Typography variant="h5" gutterBottom>
      Sin resultados
    </Typography>
    <Typography variant="body1">
      No se encontraron registros.
    </Typography>
  </Box>
);

export default NoResults; 