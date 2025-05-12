import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Stack,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { auth } from '../../services/auth';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface NavigationProps {
    title?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ title = 'WanMarKay' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = auth.isAdmin();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        // Limpiar credenciales y forzar redirección al login
        auth.logout();
        window.location.replace('/login');
    };

    return (
        <>
            <AppBar position="static" sx={{ backgroundColor: '#E31C79', mb: 3 }}>
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={() => setDrawerOpen(true)}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: isMobile ? 1 : 0 }}>
                        {title}
                    </Typography>
                    {!isMobile && (
                        <Stack direction="row" spacing={2}>
                            {isAdmin && (
                                <>
                                    <Button 
                                        color="inherit"
                                        variant={isActive('/admin/user/create') ? 'contained' : 'text'}
                                        sx={isActive('/admin/user/create') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
                                        onClick={() => navigate('/admin/user/create')}
                                        startIcon={<PersonAddIcon fontSize="small" />}
                                    >
                                        Crear Usuario
                                    </Button>
                                    <Button 
                                        color="inherit"
                                        variant={isActive('/admin/invoice/create') ? 'contained' : 'text'}
                                        sx={isActive('/admin/invoice/create') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
                                        onClick={() => navigate('/admin/invoice/create')}
                                        startIcon={<AddCircleIcon fontSize="small" />}
                                    >
                                        Crear Factura
                                    </Button>
                                    <Button 
                                        color="inherit"
                                        variant={isActive('/admin/payment/register') ? 'contained' : 'text'}
                                        sx={isActive('/admin/payment/register') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
                                        onClick={() => navigate('/admin/payment/register')}
                                        startIcon={<PaymentIcon fontSize="small" />}
                                    >
                                        Registrar Pago
                                    </Button>
                                    <Button 
                                        color="inherit"
                                        variant={isActive('/admin/user/list') ? 'contained' : 'text'}
                                        sx={isActive('/admin/user/list') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
                                        onClick={() => navigate('/admin/user/list')}
                                        startIcon={<PeopleIcon fontSize="small" />}
                                    >
                                        Ver Usuarios
                                    </Button>
                                    <Button 
                                        color="inherit"
                                        variant={isActive('/admin') ? 'contained' : 'text'}
                                        sx={isActive('/admin') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
                                        onClick={() => navigate('/admin')}
                                        startIcon={<ReceiptIcon fontSize="small" />}
                                    >
                                        Ver Facturas
                                    </Button>
                                    <Button 
                                        color="inherit"
                                        variant={isActive('/admin/payment/list') ? 'contained' : 'text'}
                                        sx={isActive('/admin/payment/list') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
                                        onClick={() => navigate('/admin/payment/list')}
                                        startIcon={<ReceiptIcon fontSize="small" />}
                                    >
                                        Ver Pagos
                                    </Button>
                                    <Button
                                        color="inherit"
                                        variant={isActive('/admin/reports') ? 'contained' : 'text'}
                                        sx={isActive('/admin/reports') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
                                        onClick={() => navigate('/admin/reports')}
                                        startIcon={<AssessmentIcon fontSize="small" />}
                                    >
                                        Reportes
                                    </Button>
                                </>
                            )}
                            {!isAdmin && (
                                <Button 
                                    color="inherit"
                                    variant={isActive('/client') ? 'contained' : 'text'}
                                    sx={isActive('/client') ? { backgroundColor: '#ffffff', color: '#000000' } : {}}
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
                    )}
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <List sx={{ width: 250 }}>
                    {auth.isAdmin() ? (
                        <>
                            <ListItem
                                button
                                selected={isActive('/admin/invoice/create')}
                                onClick={() => { navigate('/admin/invoice/create'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><AddCircleIcon /></ListItemIcon>
                                <ListItemText primary="Crear Factura" />
                            </ListItem>
                            <ListItem
                                button
                                selected={isActive('/admin/user/create')}
                                onClick={() => { navigate('/admin/user/create'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><PersonAddIcon /></ListItemIcon>
                                <ListItemText primary="Crear Usuario" />
                            </ListItem>
                            <ListItem
                                button
                                selected={isActive('/admin/user/list')}
                                onClick={() => { navigate('/admin/user/list'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><PeopleIcon /></ListItemIcon>
                                <ListItemText primary="Ver Usuarios" />
                            </ListItem>
                            <ListItem
                                button
                                selected={isActive('/admin/payment/register')}
                                onClick={() => { navigate('/admin/payment/register'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><PaymentIcon /></ListItemIcon>
                                <ListItemText primary="Registrar Pago" />
                            </ListItem>
                            <ListItem
                                button
                                selected={isActive('/admin/payment/list')}
                                onClick={() => { navigate('/admin/payment/list'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><ReceiptIcon /></ListItemIcon>
                                <ListItemText primary="Ver Pagos" />
                            </ListItem>
                            <ListItem
                                button
                                selected={isActive('/admin/reports')}
                                onClick={() => { navigate('/admin/reports'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><AssessmentIcon /></ListItemIcon>
                                <ListItemText primary="Reportes" />
                            </ListItem>
                            <ListItem
                                button
                                selected={isActive('/admin')}
                                onClick={() => { navigate('/admin'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><ReceiptIcon /></ListItemIcon>
                                <ListItemText primary="Ver Facturas" />
                            </ListItem>
                        </>
                    ) : (
                        <ListItem
                            button
                            selected={isActive('/client')}
                            onClick={() => { navigate('/client'); setDrawerOpen(false); }}
                        >
                            <ListItemIcon><ReceiptIcon /></ListItemIcon>
                            <ListItemText primary="Mis Facturas" />
                        </ListItem>
                    )}
                    <ListItem button onClick={handleLogout}>
                        <ListItemIcon><LogoutIcon /></ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" />
                    </ListItem>
                </List>
            </Drawer>
        </>
    );
}; 