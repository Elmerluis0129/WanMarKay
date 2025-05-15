import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box component="footer" sx={{ mt: 4, py: 2, textAlign: 'center', bgcolor: 'transparent' }}>
            <Typography variant="body2">© Wanda - Mary Kay. Derechos Reservados.</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>Desarrollador: Elmer Saint-Hilare</Typography>
            <Link
                onClick={() => navigate('/about')}
                sx={{ color: '#E31C79', cursor: 'pointer', ml: 1, textDecoration: 'underline', '&:hover': { color: '#C4156A' } }}
            >
                Sobre mí
            </Link>
        </Box>
    );
}; 