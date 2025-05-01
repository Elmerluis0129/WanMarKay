import React from 'react';
import { Box, Typography } from '@mui/material';

export const Footer: React.FC = () => (
    <Box component="footer" sx={{ mt: 4, py: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
        <Typography variant="body2">© Wanda - Mary Key. Derechos Reservados.</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>Desarrollador: Elmer Saint-Hilare</Typography>
    </Box>
); 