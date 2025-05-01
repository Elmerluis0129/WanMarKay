import React, { useState } from 'react';
import { 
    Box, 
    Container, 
    TextField, 
    Button, 
    Typography, 
    Paper 
} from '@mui/material';
import { auth } from '../../services/auth';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = auth.login({ email, password });
        
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/client');
        } else {
            setError('Credenciales inválidas');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderRadius: 2,
                    }}
                >
                    <Typography component="h1" variant="h5" sx={{ color: '#E31C79' }}>
                        Mary Kay - Iniciar Sesión
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Correo Electrónico"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                            <Typography color="error" sx={{ mt: 1 }}>
                                {error}
                            </Typography>
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                backgroundColor: '#E31C79',
                                '&:hover': {
                                    backgroundColor: '#C4156A',
                                },
                            }}
                        >
                            Iniciar Sesión
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}; 