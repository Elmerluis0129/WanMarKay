import React from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export const ComingSoon: React.FC = () => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center',
    px: 2,
    backgroundColor: '#f5f5f5'
  }}>
    <AccessTimeIcon sx={{ fontSize: 120, color: '#E31C79', mb: 2 }} />
    <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
      Próximamente
    </Typography>
    <Typography variant="body1">
      Esta sección está en desarrollo.
    </Typography>
  </Box>
);

export default ComingSoon; 