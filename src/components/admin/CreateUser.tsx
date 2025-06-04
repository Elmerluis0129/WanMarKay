import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { auth } from '../../services/auth';
import InputMask from 'react-input-mask';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { User, UserRole } from '../../types/user'; // UserStatus no es necesario si no está definido
import { userService } from '../../services/userService';
import { Navigation } from '../shared/Navigation';
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
    InputAdornment,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

dayjs.extend(utc);
dayjs.extend(timezone);

interface FormErrors {
    cedula?: string;
    email?: string;
}

interface UserFormData {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    role: UserRole;
    cedula: string;
    phone: string;
    address: string;
}

const CreateUser: React.FC = () => {
    const theme = useTheme();
    const currentUser = auth.getCurrentUser();
    
    // Estados
    const [formData, setFormData] = useState<UserFormData>({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        email: 'pendiente@actualizar.com',
        role: 'client',
        cedula: '',
        phone: '',
        address: 'Pendiente de actualizar',
    });
    
    type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';
    
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: SnackbarSeverity;
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});

    // Validar cédula
    const validateCedula = (cedula: string): boolean => {
        // Formato: 000-0000000-0 o 00000000000
        const cedulaRegex = /^\d{3}-?\d{7}-?\d$/;
        return cedulaRegex.test(cedula);
    };

    // Validar email
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Generar automáticamente usuario, contraseña y correo cuando cambian los nombres
    useEffect(() => {
        if (formData.firstName && formData.lastName) {
            // Limpiar espacios de los nombres
            const cleanFirstName = formData.firstName.toLowerCase().replace(/\s+/g, '').trim();
            const cleanLastName = formData.lastName.toLowerCase().replace(/\s+/g, '').trim();
            
            // Generar usuario: nombre en minúsculas (sin espacios) + primera letra del apellido en mayúscula
            const firstLetterLastName = cleanLastName.charAt(0).toUpperCase();
            const username = `${cleanFirstName}${firstLetterLastName}`;
            
            // Generar contraseña: usuario + 123
            const password = `${username}123`;
            
            // Generar correo: nombre + apellido (sin espacios) + @actualizar.com
            const email = `${cleanFirstName}${cleanLastName}@actualizar.com`;

            setFormData((prev: UserFormData) => ({
                ...prev,
                username,
                password,
                email
            }));
        }
    }, [formData.firstName, formData.lastName]);

    // Validar en tiempo real
    const validateField = (name: string, value: string) => {
        if (name === 'cedula') {
            if (value && !validateCedula(value)) {
                setFormErrors((prev: FormErrors) => ({ ...prev, cedula: 'Si no tiene una cédula, Use: 111-1111111-1' }));
            } else {
                const { cedula, ...rest } = formErrors;
                setFormErrors(rest);
            }
        } else if (name === 'email') {
            if (value && value !== 'pendiente@actualizar.com' && !validateEmail(value)) {
                setFormErrors((prev: FormErrors) => ({ ...prev, email: 'Formato de correo electrónico inválido' }));
            } else {
                const { email, ...rest } = formErrors;
                setFormErrors(rest);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        if (name) {
            setFormData((prev: UserFormData) => ({
                ...prev,
                [name]: value
            }));
            
            // Validar en tiempo real
            if (name === 'cedula' || name === 'email') {
                validateField(name, value as string);
            }
        }
    };

    const handleRoleChange = (e: SelectChangeEvent<UserRole>) => {
        setFormData((prev: UserFormData) => ({
            ...prev,
            role: e.target.value as UserRole
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar campos requeridos
        if (!formData.cedula || !formData.phone) {
            setSnackbar({
                open: true,
                message: 'Por favor complete todos los campos requeridos',
                severity: 'error'
            });
            return;
        }
        
        // Validar formato de cédula
        if (!validateCedula(formData.cedula)) {
            setFormErrors(prev => ({ ...prev, cedula: 'Formato de cédula inválido. Use: 000-0000000-0' }));
            return;
        }
        
        // Validar formato de correo (si no es el predeterminado)
        if (formData.email !== 'pendiente@actualizar.com' && !validateEmail(formData.email)) {
            setFormErrors(prev => ({ ...prev, email: 'Formato de correo electrónico inválido' }));
            return;
        }
        
        try {
            const allUsers = await userService.getUsers();
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const cleanCedula = (formData.cedula || '').replace(/[^0-9]/g, '');
            
            // Validar cédula duplicada (permitir múltiples con 11111111111)
            if (cleanCedula !== '11111111111') {
                const cedulaExists = allUsers.some(u => {
                    const userCedula = u.cedula?.replace(/[^0-9]/g, '');
                    return userCedula === cleanCedula;
                });

                if (cedulaExists) {
                    setSnackbar({
                        open: true,
                        message: 'Ya existe un usuario con este número de cédula',
                        severity: 'error'
                    });
                    return;
                }
            }
            
            // Validar nombre duplicado
            const existingUser = allUsers.find(u => {
                return u.email?.toLowerCase() === formData.email.toLowerCase() || 
                       u.fullName?.toLowerCase() === fullName.toLowerCase();
            });

            if (existingUser) {
                const message = existingUser.email?.toLowerCase() === formData.email.toLowerCase()
                    ? 'Ya existe un usuario con este correo electrónico'
                    : 'Ya existe un usuario con este nombre y apellido';
                    
                setSnackbar({
                    open: true,
                    message,
                    severity: 'error'
                });
                return;
            }

            // Crear el nuevo usuario
            const cleanPhone = (formData.phone || '').replace(/\D/g, '');
            
            const userData: User = {
                ...formData,
                id: uuidv4(),
                fullName: `${formData.firstName} ${formData.lastName}`.trim(),
                mustChangePassword: true,
                isActive: true,
                createdAt: new Date().toISOString(),
                passwordHistory: []
            };

            await userService.addUser(userData);
            
            setSnackbar({
                open: true,
                message: `Usuario "${userData.username}" creado exitosamente`,
                severity: 'success'
            });
            
            // Resetear formulario
            setFormData({
                firstName: '',
                lastName: '',
                username: '',
                password: '',
                email: 'pendiente@actualizar.com',
                role: 'client',
                cedula: '',
                phone: '',
                address: 'Pendiente de actualizar',
            });
            
        } catch (error) {
            console.error('Error al crear el usuario:', error);
            setSnackbar({
                open: true,
                message: 'Error al crear el usuario',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
            ...prev,
            open: false
        }));
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
                        <Typography component="h1" variant="h5" sx={{ color: 'primary.main', mb: 3, textAlign: 'center' }}>
                            Crear Nuevo Usuario
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    El usuario deberá actualizar su correo electrónico al iniciar sesión por primera vez.
                                </Alert>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            name="firstName"
                                            label="Nombres"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            name="lastName"
                                            label="Apellidos"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                        <InputMask
                                            mask="999-9999999-9"
                                            value={formData.cedula}
                                            onChange={handleChange}
                                        >
                                            {(maskProps: any) => (
                                                <TextField
                                                    {...maskProps}
                                                    margin="normal"
                                                    fullWidth
                                                    name="cedula"
                                                    label="Cédula"
                                                    required
                                                    error={!!formErrors.cedula}
                                                    helperText={formErrors.cedula}
                                                />
                                            )}
                                        </InputMask>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                        <InputMask
                                            mask="+1 (999) 999-9999"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        >
                                            {(maskProps: any) => (
                                                <TextField
                                                    {...maskProps}
                                                    margin="normal"
                                                    fullWidth
                                                    name="phone"
                                                    label="Teléfono"
                                                    required
                                                />
                                            )}
                                        </InputMask>
                                    </Box>
                                </Box>
                                <Box sx={{ width: '100%', maxWidth: 400 }}>
                                    <FormControl fullWidth margin="normal" required>
                                        <InputLabel>Rol</InputLabel>
                                        <Select
                                            value={formData.role}
                                            onChange={handleRoleChange}
                                            name="role"
                                            label="Rol"
                                        >
                                            {currentUser?.role === 'superadmin' && (
                                                <MenuItem value="superadmin">Super Administrador</MenuItem>
                                            )}
                                            <MenuItem value="admin">Administrador</MenuItem>
                                            <MenuItem value="client">Cliente</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                {/* Dirección se establece automáticamente como 'Pendiente de actualizar' */}
                                <input type="hidden" name="address" value={formData.address} />
                                <Box sx={{
                                    mt: 2,
                                    p: 2,
                                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                    borderRadius: 1,
                                    border: `1px solid ${theme.palette.divider}`
                                }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Credenciales generadas automáticamente:
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="text.primary">
                                            <Box component="span" sx={{ color: 'text.secondary', mr: 1, minWidth: 80, display: 'inline-block' }}>Usuario:</Box>
                                            {formData.username || 'Ingrese nombre y apellido'}
                                        </Typography>
                                        <Typography variant="body2" color="text.primary">
                                            <Box component="span" sx={{ color: 'text.secondary', mr: 1, minWidth: 80, display: 'inline-block' }}>Correo:</Box>
                                            {formData.email || 'Se generará automáticamente'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ mt: 3, mb: 2 }}
                                >
                                    Crear Usuario
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export { CreateUser };