import React, { useState, useEffect } from 'react';
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
    Box,
    Tooltip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { auth } from '../../services/auth';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { aboutMeService } from '../../services/aboutMeService';
import { useTheme } from '../../context/ThemeContext';

interface NavigationProps {
    title?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ title = 'WanMarKay' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = auth.isAdmin();
    const theme = useMuiTheme();
    const { mode, toggleTheme } = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isActive = (path: string) => location.pathname === path;
    const [anchorElView, setAnchorElView] = useState<null | HTMLElement>(null);
    const [anchorElRegister, setAnchorElRegister] = useState<null | HTMLElement>(null);
    const [viewMenuOpen, setViewMenuOpen] = useState(false);
    const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const handleOpenView = (event: React.MouseEvent<HTMLElement>) => setAnchorElView(event.currentTarget);
    const handleCloseView = () => setAnchorElView(null);
    const handleOpenRegister = (event: React.MouseEvent<HTMLElement>) => setAnchorElRegister(event.currentTarget);
    const handleCloseRegister = () => setAnchorElRegister(null);
    const handleViewMenuEnter = () => setViewMenuOpen(true);
    const handleViewMenuLeave = () => setViewMenuOpen(false);
    const handleRegisterMenuEnter = () => setRegisterMenuOpen(true);
    const handleRegisterMenuLeave = () => setRegisterMenuOpen(false);

    const handleLogout = () => {
        // Limpiar credenciales y forzar redirección al login
        auth.logout();
        window.location.replace('/login');
    };

    useEffect(() => {
        // Función para cargar el logo
        const fetchLogo = () => {
            aboutMeService.getAboutMe().then(data => {
                setLogoUrl(data.logo_url || null);
            });
        };

        fetchLogo(); // Carga inicial

        // Escuchar el evento custom
        window.addEventListener('logo-updated', fetchLogo);

        // Limpieza
        return () => {
            window.removeEventListener('logo-updated', fetchLogo);
        };
    }, []);

    return (
        <>
            <AppBar position="static" sx={{ mb: 3 }}>
                <Toolbar sx={{ minHeight: 64 }}>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={() => setDrawerOpen(true)}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Box
                        sx={{
                            background: '#fff',
                            borderRadius: '50%',
                            p: 0.5,
                            boxShadow: theme.shadows[2],
                            display: 'flex',
                            alignItems: 'center',
                            mr: 2,
                            cursor: 'pointer',
                            height: 48,
                            width: 48,
                            justifyContent: 'center',
                            border: '3px solid #E31C79',
                        }}
                        onClick={() => navigate('/about')}
                    >
                        <Box
                            component="img"
                            src={logoUrl || ''}
                            alt="Mary Kay Logo"
                            sx={{
                                height: 38,
                                width: 38,
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                    </Box>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {title}
                    </Typography>

                    {/* Botón de cambio de tema */}
                    <Tooltip title={mode === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}>
                        <IconButton 
                            color="inherit" 
                            onClick={toggleTheme}
                            sx={{ 
                                mr: 2,
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                        >
                            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                        </IconButton>
                    </Tooltip>

                    {!isMobile && (
                        <Stack direction="row" spacing={1}>
                            {isAdmin ? (
                                <>
                                    {/* Submenú Ver */}
                                    <Button
                                        color="inherit"
                                        endIcon={<ArrowDropDownIcon />}
                                        aria-controls={Boolean(anchorElView) ? 'menu-ver' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={Boolean(anchorElView) ? 'true' : undefined}
                                        onMouseEnter={handleOpenView}
                                        onClick={handleOpenView}
                                    >
                                        Ver
                                    </Button>
                                    <Menu
                                        id="menu-ver"
                                        anchorEl={anchorElView}
                                        open={Boolean(anchorElView)}
                                        onClose={handleCloseView}
                                        MenuListProps={{
                                            onMouseLeave: handleCloseView
                                        }}
                                    >
                                        <MenuItem onClick={() => { navigate('/admin/payment/list'); handleCloseView(); setViewMenuOpen(false); }}>Ver Pagos</MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin/user/list'); handleCloseView(); setViewMenuOpen(false); }}>Ver Usuarios</MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin'); handleCloseView(); setViewMenuOpen(false); }}>Ver Facturas</MenuItem>
                                    </Menu>
                                    {/* Submenú Registrar */}
                                    <Button
                                        color="inherit"
                                        endIcon={<ArrowDropDownIcon />}
                                        aria-controls={Boolean(anchorElRegister) ? 'menu-registrar' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={Boolean(anchorElRegister) ? 'true' : undefined}
                                        onMouseEnter={handleOpenRegister}
                                        onClick={handleOpenRegister}
                                    >
                                        Registrar
                                    </Button>
                                    <Menu
                                        id="menu-registrar"
                                        anchorEl={anchorElRegister}
                                        open={Boolean(anchorElRegister)}
                                        onClose={handleCloseRegister}
                                        MenuListProps={{
                                            onMouseLeave: handleCloseRegister
                                        }}
                                    >
                                        <MenuItem onClick={() => { navigate('/admin/user/create'); handleCloseRegister(); }}>Registrar Usuario</MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin/invoice/create'); handleCloseRegister(); }}>Registrar Factura</MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin/payment/register'); handleCloseRegister(); }}>Registrar Pago</MenuItem>
                                    </Menu>
                                    <Button
                                        color="inherit"
                                        variant={isActive('/admin/reports') ? 'contained' : 'text'}
                                        sx={isActive('/admin/reports') ? { 
                                            backgroundColor: theme.palette.background.paper, 
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.15)' 
                                                    : 'rgba(0, 0, 0, 0.08)'
                                            }
                                        } : {}}
                                        onClick={() => navigate('/admin/reports')}
                                        startIcon={<AssessmentIcon fontSize="small" />}
                                    >
                                        Reportes
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    color="inherit"
                                    variant={isActive('/client') ? 'contained' : 'text'}
                                    sx={isActive('/client') ? { 
                                        backgroundColor: theme.palette.background.paper, 
                                        color: theme.palette.text.primary,
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' 
                                                ? 'rgba(255, 255, 255, 0.15)' 
                                                : 'rgba(0, 0, 0, 0.08)'
                                        }
                                    } : {}}
                                    onClick={() => navigate('/client')}
                                    startIcon={<ReceiptIcon fontSize="small" />}
                                >
                                    Mis Facturas
                                </Button>
                            )}
                            <Button 
                                color="inherit"
                                variant={isActive('/about') ? 'contained' : 'text'}
                                sx={isActive('/about') ? { 
                                    backgroundColor: theme.palette.background.paper, 
                                    color: theme.palette.text.primary,
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.15)' 
                                            : 'rgba(0, 0, 0, 0.08)'
                                    }
                                } : {}}
                                onClick={() => navigate('/about')}
                            >
                                Sobre Wanda
                            </Button>
                            <Button 
                                color="inherit" 
                                onClick={handleLogout}
                                startIcon={<LogoutIcon />}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
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
                PaperProps={{
                    sx: {
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary
                    }
                }}
            >
                <List sx={{ width: 250 }}>
                    {isAdmin ? (
                        <>
                            {/* Submenú Ver (mobile) */}
                            <ListItem button onClick={handleOpenView}>
                                <ListItemIcon><ReceiptIcon /></ListItemIcon>
                                <ListItemText primary="Ver" />
                                <ArrowDropDownIcon />
                            </ListItem>
                            <Menu anchorEl={anchorElView} open={Boolean(anchorElView)} onClose={() => { handleCloseView(); setDrawerOpen(false); }}>
                                <MenuItem onClick={() => { navigate('/admin/payment/list'); handleCloseView(); setDrawerOpen(false); }}>Ver Pagos</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin/user/list'); handleCloseView(); setDrawerOpen(false); }}>Ver Usuarios</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin'); handleCloseView(); setDrawerOpen(false); }}>Ver Facturas</MenuItem>
                            </Menu>
                            {/* Submenú Registrar (mobile) */}
                            <ListItem button onClick={handleOpenRegister}>
                                <ListItemIcon><AddCircleIcon /></ListItemIcon>
                                <ListItemText primary="Registrar" />
                                <ArrowDropDownIcon />
                            </ListItem>
                            <Menu anchorEl={anchorElRegister} open={Boolean(anchorElRegister) && registerMenuOpen} onClose={() => { handleCloseRegister(); setDrawerOpen(false); }}>
                                <MenuItem onClick={() => { navigate('/admin/user/create'); handleCloseRegister(); setDrawerOpen(false); }}>Registrar Usuario</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin/invoice/create'); handleCloseRegister(); setDrawerOpen(false); }}>Registrar Factura</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin/payment/register'); handleCloseRegister(); setDrawerOpen(false); }}>Registrar Pago</MenuItem>
                            </Menu>
                            {/* Reportes y otros enlaces siguen igual */}
                            <ListItem
                                button
                                selected={isActive('/admin/reports')}
                                onClick={() => { navigate('/admin/reports'); setDrawerOpen(false); }}
                            >
                                <ListItemIcon><AssessmentIcon /></ListItemIcon>
                                <ListItemText primary="Reportes" />
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
                    <ListItem
                        button
                        selected={isActive('/about')}
                        onClick={() => { navigate('/about'); setDrawerOpen(false); }}
                    >
                        <ListItemText primary="Sobre Wanda" />
                    </ListItem>
                    <ListItem button onClick={handleLogout}>
                        <ListItemIcon><LogoutIcon /></ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" />
                    </ListItem>
                </List>
            </Drawer>
        </>
    );
}; 