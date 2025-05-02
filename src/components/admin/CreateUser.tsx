import React, { useState } from 'react';
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
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../../types/user';
import { userService } from '../../services/userService';
import { Navigation } from '../shared/Navigation';

export const CreateUser: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        password: '',
        role: 'client' as UserRole,
        cedula: '',
        phone: '',
        address: '',
    });
    const [message, setMessage] = useState({ text: '', isError: false });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRoleChange = (e: SelectChangeEvent) => {
        setFormData({
            ...formData,
            role: e.target.value as UserRole,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Quito guiones y no-dígitos antes de guardar
        const cleanCedula = formData.cedula.replace(/-/g, '');
        const cleanPhone = formData.phone.replace(/\D/g, '');
        const newUser: User = {
            id: uuidv4(),
            fullName: formData.fullName,
            username: formData.username,
            password: formData.password,
            role: formData.role,
            cedula: cleanCedula,
            phone: cleanPhone,
            address: formData.address,
        };

        try {
            await userService.addUser(newUser);
            setMessage({ text: 'Usuario creado exitosamente', isError: false });
            setFormData({
                fullName: '',
                username: '',
                password: '',
                role: 'client',
                cedula: '',
                phone: '',
                address: '',
            });
        } catch (error) {
            setMessage({ text: 'Error al crear el usuario', isError: true });
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
                            backgroundColor: '#fff',
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
                                name="fullName"
                                label="Nombre Completo"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="username"
                                label="Usuario"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Contraseña"
                                type="password"
                                value={formData.password}
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
                                        helperText="Formato: 000-0000000-0"
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
                            {message.text && (
                                <Typography 
                                    color={message.isError ? 'error' : 'success'} 
                                    sx={{ mt: 2 }}
                                >
                                    {message.text}
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
                                Crear Usuario
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}; 