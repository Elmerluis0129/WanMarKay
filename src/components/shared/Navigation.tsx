import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import { auth } from '../../services/auth';

interface NavigationProps {
    title?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ title = 'WanMarKay' }) => {
    const navigate = useNavigate();
    const isAdmin = auth.isAdmin();

    const handleLogout = async () => {
        try {
            await auth.logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return (
        <AppBar position="static" sx={{ backgroundColor: '#E31C79', mb: 3 }}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
                <Stack direction="row" spacing={2}>
                    {isAdmin && (
                        <>
                            <Button 
                                color="inherit" 
                                onClick={() => navigate('/admin/invoice/create')}
                                startIcon={<AddCircleIcon fontSize="small" />}
                            >
                                Crear Factura
                            </Button>
                            <Button 
                                color="inherit" 
                                onClick={() => navigate('/admin/user/create')}
                                startIcon={<PersonAddIcon fontSize="small" />}
                            >
                                Crear Usuario
                            </Button>
                            <Button 
                                color="inherit" 
                                onClick={() => navigate('/admin/payment/register')}
                                startIcon={<PaymentIcon fontSize="small" />}
                            >
                                Registrar Pago
                            </Button>
                            <Button 
                                color="inherit" 
                                onClick={() => navigate('/admin')}
                                startIcon={<ReceiptIcon fontSize="small" />}
                            >
                                Ver Facturas
                            </Button>
                        </>
                    )}
                    {!isAdmin && (
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/client')}
                            startIcon={<ReceiptIcon fontSize="small" />}
                        >
                            Mis Facturas
                        </Button>
                    )}
                    <Button 
                        color="inherit" 
                        onClick={handleLogout}
                        startIcon={<LogoutIcon fontSize="small" />}
                    >
                        Cerrar Sesión
                    </Button>
                </Stack>
            </Toolbar>
        </AppBar>
    );
}; 