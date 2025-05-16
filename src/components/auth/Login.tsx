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
import { motion } from 'framer-motion';

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
        <Box sx={{ minHeight: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
            {/* Fondo animado con gradiente y burbujas a pantalla completa */}
            <Box sx={{
                position: 'fixed',
                top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0,
                pointerEvents: 'none',
            }}>
                <style>{`
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animated-bg {
                    position: absolute;
                    width: 100vw;
                    height: 100vh;
                    background: linear-gradient(120deg, #fbeff7 0%, #f7e9f3 100%, #fff 100%);
                    background-size: 200% 200%;
                    animation: gradientMove 10s ease-in-out infinite;
                    z-index: 0;
                }
                .bubble {
                    position: absolute;
                    border-radius: 50%;
                    opacity: 0.15;
                    background: #E31C79;
                    animation: floatxy 3s infinite linear;
                }
                @keyframes floatxy {
                    0% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -20px) scale(1.07); }
                    50% { transform: translate(-20px, -40px) scale(1.1); }
                    75% { transform: translate(-10px, -20px) scale(1.05); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                `}</style>
                <div className="animated-bg" />
                <div className="bubble" style={{ width: 120, height: 120, left: '10%', top: '60%', animationDelay: '0s' }} />
                <div className="bubble" style={{ width: 80, height: 80, left: '70%', top: '20%', animationDelay: '2s' }} />
                <div className="bubble" style={{ width: 60, height: 60, left: '50%', top: '80%', animationDelay: '4s' }} />
                <div className="bubble" style={{ width: 100, height: 100, left: '80%', top: '70%', animationDelay: '6s' }} />
                {/* Más burbujas */}
                <div className="bubble" style={{ width: 90, height: 90, left: '20%', top: '10%', animationDelay: '1s' }} />
                <div className="bubble" style={{ width: 70, height: 70, left: '60%', top: '60%', animationDelay: '3s' }} />
                <div className="bubble" style={{ width: 50, height: 50, left: '30%', top: '75%', animationDelay: '5s' }} />
                <div className="bubble" style={{ width: 110, height: 110, left: '85%', top: '30%', animationDelay: '7s' }} />
                <div className="bubble" style={{ width: 40, height: 40, left: '40%', top: '15%', animationDelay: '2.5s' }} />
                <div className="bubble" style={{ width: 60, height: 60, left: '75%', top: '50%', animationDelay: '4.5s' }} />
                {/* Aún más burbujas */}
                <div className="bubble" style={{ width: 55, height: 55, left: '15%', top: '30%', animationDelay: '1.5s' }} />
                <div className="bubble" style={{ width: 85, height: 85, left: '35%', top: '60%', animationDelay: '3.5s' }} />
                <div className="bubble" style={{ width: 45, height: 45, left: '65%', top: '10%', animationDelay: '2.2s' }} />
                <div className="bubble" style={{ width: 75, height: 75, left: '55%', top: '40%', animationDelay: '5.5s' }} />
                <div className="bubble" style={{ width: 95, height: 95, left: '25%', top: '85%', animationDelay: '6.5s' }} />
                <div className="bubble" style={{ width: 35, height: 35, left: '80%', top: '10%', animationDelay: '3.8s' }} />
                <div className="bubble" style={{ width: 65, height: 65, left: '90%', top: '50%', animationDelay: '7.2s' }} />
                <div className="bubble" style={{ width: 50, height: 50, left: '5%', top: '80%', animationDelay: '8s' }} />
            </Box>
            <Container component="main" maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={6}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px 0 rgba(227,28,121,0.10)',
                        position: 'relative',
                        zIndex: 2,
                    }}
                >
                    {/* Mensaje de bienvenida animado */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ width: '100%', textAlign: 'center', marginBottom: 8 }}
                    >
                        <Typography variant="h4" sx={{ color: '#E31C79', fontWeight: 700, mb: 1, letterSpacing: 1 }}>
                            ¡Bienvenido!
                        </Typography>
                    </motion.div>
                    {/* Logo animado */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: [1, 1.08, 1] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            type: 'tween',
                            ease: 'easeInOut'
                        }}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 16 }}
                    >
                        {/* Logo dinámico */}
                    </motion.div>
                    {/* Título animado */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        style={{ width: '100%', textAlign: 'center', marginBottom: 16 }}
                    >
                        <Typography component="h1" variant="h5" sx={{ color: '#E31C79', mb: 2 }}>
                            WanMarKay - Iniciar Sesión
                        </Typography>
                    </motion.div>
                    {/* Formulario animado */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        style={{ width: '100%' }}
                    >
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
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    transition: 'box-shadow 0.3s',
                                    '& .MuiInputBase-root': {
                                        transition: 'box-shadow 0.3s',
                                    },
                                    '& .MuiInputBase-root.Mui-focused': {
                                        boxShadow: '0 0 0 3px #E31C7922',
                                    },
                                }}
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
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    transition: 'box-shadow 0.3s',
                                    '& .MuiInputBase-root': {
                                        transition: 'box-shadow 0.3s',
                                    },
                                    '& .MuiInputBase-root.Mui-focused': {
                                        boxShadow: '0 0 0 3px #E31C7922',
                                    },
                                }}
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
                                    fontWeight: 600,
                                    letterSpacing: 1,
                                    fontSize: 18,
                                    boxShadow: '0 2px 8px #E31C7922',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        backgroundColor: '#C4156A',
                                        transform: 'scale(1.04)',
                                        boxShadow: '0 4px 16px #E31C7944',
                                        animation: 'pulse 0.5s',
                                    },
                                }}
                            >
                                Iniciar Sesión
                            </Button>
                            <style>{`
                                @keyframes pulse {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.08); }
                                    100% { transform: scale(1); }
                                }
                            `}</style>
                        </Box>
                    </motion.div>
                </Paper>
            </Container>
        </Box>
    );
}; 