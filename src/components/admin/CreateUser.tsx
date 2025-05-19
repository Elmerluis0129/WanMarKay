import React, { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Snackbar,
    Alert,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../../types/user';
import { userService } from '../../services/userService';
import { Navigation } from '../shared/Navigation';

export const CreateUser: React.FC = () => {
    const [formData, setFormData] = useState({
        firstNames: '',
        lastNames: '',
        username: '',
        password: '',
        role: 'client' as UserRole,
        cedula: '',
        phone: '',
        address: '',
    });
    const [cedulaError, setCedulaError] = useState<string>('');
    const [usernameTouched, setUsernameTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success'|'error'>('success');

    useEffect(() => {
        const clean = (s: string) => s.replace(/\D/g, '');
        const defaultClean = '11111111111'; // cedula default sin guiones
        const current = clean(formData.cedula || '');
        if (!current || current === defaultClean) { setCedulaError(''); return; }
        userService.getUsers()
          .then(users => {
            const exists = users.some(u => u.cedula?.replace(/\D/g,'') === current);
            setCedulaError(exists ? 'Ya existe un usuario con esta cédula' : '');
          })
          .catch(() => setCedulaError(''));
    }, [formData.cedula]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value } as any;
            if (name === 'firstNames' || name === 'lastNames') {
                const first = newData.firstNames.trim().split(' ')[0] || '';
                const initial = newData.lastNames.trim().split(' ')[0]?.[0] || '';
                const autoUser = `${first.toLowerCase()}${initial.toUpperCase()}`;
                if (!usernameTouched) newData.username = autoUser;
                if (!passwordTouched) newData.password = autoUser + '123';
            }
            return newData;
        });
        if (name === 'username') setUsernameTouched(true);
        if (name === 'password') setPasswordTouched(true);
    };

    const handleRoleChange = (e: SelectChangeEvent) => {
        setFormData({
            ...formData,
            role: e.target.value as UserRole,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allUsers = await userService.getUsers();
        const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase();
        const fullName = `${formData.firstNames} ${formData.lastNames}`.trim();
        if (allUsers.some(u => normalize(u.fullName) === normalize(fullName))) {
            setSnackbarMessage('Ya existe un usuario con ese nombre');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        if (allUsers.some(u => normalize(u.username) === normalize(formData.username))) {
            setSnackbarMessage('El nombre de usuario ya está en uso');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        const cleanCedula = formData.cedula.replace(/-/g, '');
        const cleanPhone = formData.phone.replace(/\D/g, '');
        const newUser: User = {
            id: uuidv4(),
            fullName,
            username: formData.username,
            password: formData.password,
            role: formData.role,
            cedula: cleanCedula,
            phone: cleanPhone,
            address: formData.address,
        };

        try {
            await userService.addUser(newUser);
            setSnackbarMessage(`Usuario "${newUser.username}" creado exitosamente`);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setFormData({
                firstNames: '',
                lastNames: '',
                username: '',
                password: '',
                role: 'client',
                cedula: '',
                phone: '',
                address: '',
            });
        } catch (error) {
            setSnackbarMessage('Error al crear el usuario');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    return (
        <>
            <Navigation title="Crear Nuevo Usuario" />
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            padding: 4,
                            width: '100%',
                            borderRadius: 2,
                        }}
                    >
                        <Typography component="h1" variant="h5" sx={{ color: '#E31C79', mb: 3 }}>
                            Crear Nuevo Usuario
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="firstNames"
                                label="Nombre(s)"
                                value={formData.firstNames}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="lastNames"
                                label="Apellido(s)"
                                value={formData.lastNames}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                name="address"
                                label="Dirección/Referencia"
                                value={formData.address}
                                onChange={handleChange}
                            />
                            <InputMask
                                mask="999-9999999-9"
                                value={formData.cedula}
                                onChange={handleChange}
                                maskChar=""
                            >
                                {(maskProps: any) => (
                                    <TextField
                                        {...maskProps}
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="cedula"
                                        label="Cédula"
                                        error={Boolean(cedulaError)}
                                        helperText={cedulaError || 'Formato: 000-0000000-0'}
                                    />
                                )}
                            </InputMask>
                            <InputMask
                                mask="+1 (999) 999-9999"
                                value={formData.phone}
                                onChange={handleChange}
                                maskChar=""
                            >
                                {(maskProps: any) => (
                                    <TextField
                                        {...maskProps}
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="phone"
                                        label="Teléfono"
                                    />
                                )}
                            </InputMask>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Rol"
                                    onChange={handleRoleChange}
                                >
                                    <MenuItem value="client">Cliente</MenuItem>
                                    <MenuItem value="admin">Administrador</MenuItem>
                                </Select>
                            </FormControl>
                            <Snackbar
                                open={snackbarOpen}
                                autoHideDuration={3000}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                onClose={() => setSnackbarOpen(false)}
                            >
                                <Alert
                                    onClose={() => setSnackbarOpen(false)}
                                    severity={snackbarSeverity}
                                    elevation={6}
                                    variant="filled"
                                >
                                    {snackbarMessage}
                                </Alert>
                            </Snackbar>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={Boolean(cedulaError)}
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    backgroundColor: '#E31C79',
                                    '&:hover': {
                                        backgroundColor: '#C4156A',
                                    },
                                }}
                            >
                                Crear Usuario
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}; 