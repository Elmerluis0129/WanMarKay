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
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import MenuIcon from '@mui/icons-material/Menu';
import { auth } from '../../services/auth';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface NavigationProps {
    title?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ title = 'WanMarKay' }) => {
    const navigate = useNavigate();
    const isAdmin = auth.isAdmin();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await auth.logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error during logout:', error);
        }
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
                            <ListItem button onClick={() => { navigate('/admin/invoice/create'); setDrawerOpen(false); }}>
                                <ListItemIcon><AddCircleIcon /></ListItemIcon>
                                <ListItemText primary="Crear Factura" />
                            </ListItem>
                            <ListItem button onClick={() => { navigate('/admin/user/create'); setDrawerOpen(false); }}>
                                <ListItemIcon><PersonAddIcon /></ListItemIcon>
                                <ListItemText primary="Crear Usuario" />
                            </ListItem>
                            <ListItem button onClick={() => { navigate('/admin/payment/register'); setDrawerOpen(false); }}>
                                <ListItemIcon><PaymentIcon /></ListItemIcon>
                                <ListItemText primary="Registrar Pago" />
                            </ListItem>
                            <ListItem button onClick={() => { navigate('/admin'); setDrawerOpen(false); }}>
                                <ListItemIcon><ReceiptIcon /></ListItemIcon>
                                <ListItemText primary="Ver Facturas" />
                            </ListItem>
                        </>
                    ) : (
                        <ListItem button onClick={() => { navigate('/client'); setDrawerOpen(false); }}>
                            <ListItemIcon><ReceiptIcon /></ListItemIcon>
                            <ListItemText primary="Mis Facturas" />
                        </ListItem>
                    )}
                    <ListItem button onClick={() => { handleLogout(); setDrawerOpen(false); }}>
                        <ListItemIcon><LogoutIcon /></ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" />
                    </ListItem>
                </List>
            </Drawer>
        </>
    );
}; 