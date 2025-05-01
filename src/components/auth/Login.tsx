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
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const user = await auth.login({ username, password });
            if (user) {
                navigate(user.role === 'admin' ? '/admin' : '/client');
            } else {
                setError('Credenciales inválidas');
            }
        } catch (err) {
            setError('Error al autenticar');
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
                        WanMarKay - Iniciar Sesión
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Usuario"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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