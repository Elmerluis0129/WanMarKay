import React, { useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Box, Container, TextField, Button, Typography, Paper, Snackbar, Alert } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { userService } from '../../services/userService';
import { auth } from '../../services/auth';
dayjs.extend(utc);
dayjs.extend(timezone);

export const ChangePassword: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth.getCurrentUser();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const reason = location.state?.reason;

    if (!user) {
        navigate('/login');
        return null;
    }

    // Si mustChangePassword está en true, forzar cambio
    // (la lógica de redirección ya debe estar en el login, aquí solo lo manejamos al guardar)

    // Validaciones de política de contraseña
    function validatePasswordPolicy(password: string): string | null {
        if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
        if (!/[a-z]/.test(password)) return 'Debe contener al menos una minúscula.';
        if (!/[A-Z]/.test(password)) return 'Debe contener al menos una mayúscula.';
        if (!/[0-9]/.test(password)) return 'Debe contener al menos un número.';
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Políticas de contraseña
        const policyError = validatePasswordPolicy(newPassword);
        if (policyError) {
            setError(policyError);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (user.password === newPassword) {
            setError('La nueva contraseña no puede ser igual a la actual.');
            return;
        }
        if (Array.isArray(user.passwordHistory) && user.passwordHistory.includes(newPassword)) {
            setError('No puedes reutilizar una contraseña que ya usaste anteriormente.');
            return;
        }
        try {
            // Actualizar historial de contraseñas
            const updatedHistory = Array.isArray(user.passwordHistory) ? [...user.passwordHistory] : [];
            if (user.password) {
                updatedHistory.push(user.password);
            }
            const rdDate = dayjs().tz('America/Santo_Domingo').format('YYYY-MM-DD');
            await userService.updateUser({
                ...user,
                password: newPassword,
                mustChangePassword: false,
                passwordHistory: updatedHistory,
                passwordChangedAt: rdDate
            });
            // Actualizar usuario en localStorage
            auth.logout();
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError('Error al cambiar la contraseña.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}>
                <Paper elevation={3} sx={{ padding: 4, width: '100%', borderRadius: 2 }}>
                    <Typography component="h1" variant="h5" sx={{ color: '#E31C79', mb: 3 }}>
                        Cambiar contraseña
                    </Typography>
                    {reason === 'first' && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Por seguridad debes cambiar tu contraseña en tu primer inicio de sesión.
                        </Alert>
                    )}
                    {reason === 'expired' && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Tu contraseña ha expirado. Debes establecer una nueva contraseña para continuar.
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Nueva contraseña"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Confirmar contraseña"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            sx={{ mt: 3, mb: 2, backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}
                        >
                            Guardar nueva contraseña
                        </Button>
                    </Box>
                </Paper>
                <Snackbar open={success} autoHideDuration={2000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    <Alert severity="success" sx={{ width: '100%' }}>
                        Contraseña cambiada correctamente. Por favor, inicia sesión de nuevo.
                    </Alert>
                </Snackbar>
            </Box>
        </Container>
    );
};

export default ChangePassword;
