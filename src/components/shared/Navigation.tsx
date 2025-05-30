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
    Menu,
    MenuItem
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InfoIcon from '@mui/icons-material/Info';
import { auth } from '../../services/auth';
import { aboutMeService } from '../../services/aboutMeService';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '../../context/ThemeContext';

interface NavigationProps {
    title?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ title = 'WanMarKay' }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = auth.isAdmin();
    const isSuperAdmin = auth.isSuperAdmin();
    
    // Logs de depuración
    console.log('Usuario actual:', auth.getCurrentUser());
    console.log('isAdmin:', isAdmin);
    console.log('isSuperAdmin:', isSuperAdmin);
    const theme = useMuiTheme();
    const { mode, toggleTheme } = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const [anchorElView, setAnchorElView] = useState<null | HTMLElement>(null);
    const [anchorElRegister, setAnchorElRegister] = useState<null | HTMLElement>(null);
    
    // Función para verificar si la ruta está activa
    const isActive = (path: string) => {
        // Si la ruta es la raíz, solo coincide exactamente
        if (path === '/') {
            return location.pathname === path;
        }
        
        // Rutas que deben coincidir exactamente
        const exactMatchPaths = [
            '/admin/reports', 
            '/client', 
            '/cuentas-bancarias', 
            '/about', 
            '/fidelidad'
        ];
        
        // Rutas que son menús desplegables y sus subrutas
        const menuPaths = {
            'register': ['/admin/user/create', '/admin/invoice/create', '/admin/payment/register'],
            'view': ['/admin/payment/list', '/admin/user/list', '/admin/invoice/list']
        };
        
        // Verificar coincidencia exacta para rutas específicas
        if (exactMatchPaths.includes(path)) {
            return location.pathname === path;
        }
        
        // Manejar rutas de menús desplegables
        if (path === '/admin/register' && menuPaths.register.some(p => location.pathname === p)) {
            return true;
        }
        
        if (path === '/admin/view' && menuPaths.view.some(p => location.pathname.startsWith(p))) {
            return true;
        }
        
        // Para otras rutas que pueden tener subrutas
        return location.pathname === path || 
               (location.pathname.startsWith(`${path}/`) && !location.pathname.startsWith(`${path}//`));
    };

    const handleOpenView = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElRegister(null);
        setAnchorElView(event.currentTarget);
    };

    const handleOpenRegister = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElView(null);
        setAnchorElRegister(event.currentTarget);
    };

    const handleCloseView = () => setAnchorElView(null);
    const handleCloseRegister = () => setAnchorElRegister(null);

    const handleLogout = () => {
        auth.logout();
        window.location.replace('/login');
    };

    useEffect(() => {
        const fetchLogo = () => {
            aboutMeService.getAboutMe().then(data => {
                setLogoUrl(data.logo_url || null);
            });
        };

        fetchLogo();
        window.addEventListener('logo-updated', fetchLogo);

        return () => {
            window.removeEventListener('logo-updated', fetchLogo);
        };
    }, []);

    return (
        <>
            <AppBar position="static" sx={{ mb: 3 }}>
                <Toolbar sx={{ minHeight: 64 }}>
                    {isMobile && (
                        <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)}>
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

                    <Tooltip title={mode === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}>
                        <IconButton 
                            color="inherit" 
                            onClick={toggleTheme}
                            sx={{ mr: 2, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                        >
                            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                        </IconButton>
                    </Tooltip>

                    {!isMobile && (
                        <Stack direction="row" spacing={1}>
                            {(isAdmin || isSuperAdmin) ? (
                                <>
                                    <Button
                                        color="inherit"
                                        endIcon={<ArrowDropDownIcon />}
                                        onMouseEnter={handleOpenRegister}
                                        onClick={handleOpenRegister}
                                        startIcon={<AddCircleIcon />}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                transform: 'translateY(-2px)'
                                            },
                                            transition: 'all 0.2s ease-in-out',
                                            mx: 0.5,
                                            px: 2,
                                            borderRadius: 2,
                                            ...(isActive('/admin/register') ? {
                                                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.08)',
                                                color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.12)'
                                                }
                                            } : {})
                                        }}
                                    >
                                        Registrar
                                    </Button>
                                    <Menu
                                        id="menu-registrar"
                                        anchorEl={anchorElRegister}
                                        open={Boolean(anchorElRegister)}
                                        onClose={handleCloseRegister}
                                        MenuListProps={{ 
                                            onMouseLeave: handleCloseRegister,
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    padding: '8px 24px',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem onClick={() => { navigate('/admin/user/create'); handleCloseRegister(); }}>
                                            <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText>Registrar Usuario</ListItemText>
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin/invoice/create'); handleCloseRegister(); }}>
                                            <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText>Registrar Factura</ListItemText>
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin/payment/register'); handleCloseRegister(); }}>
                                            <ListItemIcon><PaymentIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText>Registrar Pago</ListItemText>
                                        </MenuItem>
                                    </Menu>

                                    
                                    <Button
                                        color="inherit"
                                        variant={isActive('/admin/reports') ? 'contained' : 'text'}
                                        sx={{
                                            ...(isActive('/admin/reports') ? {
                                                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.08)',
                                                color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.12)'
                                                },
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                                transform: 'translateY(-2px)'
                                            } : {
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }),
                                            transition: 'all 0.2s ease-in-out',
                                            mx: 0.5,
                                            px: 2,
                                            borderRadius: 2
                                        }}
                                        onClick={() => navigate('/admin/reports')}
                                        startIcon={<AssessmentIcon fontSize="small" />}
                                    >
                                        Reportes
                                    </Button>

                                    {isSuperAdmin && (
                                        <Button 
                                            color="inherit"
                                            startIcon={<PersonAddIcon />}
                                            onClick={() => navigate('/superadmin')}
                                            sx={{
                                                ...(isActive('/superadmin') ? {
                                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.08)',
                                                    color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                                    fontWeight: 'bold',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.12)'
                                                    },
                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                                    transform: 'translateY(-2px)'
                                                } : {
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }),
                                                transition: 'all 0.2s ease-in-out',
                                                mx: 0.5,
                                                px: 2,
                                                borderRadius: 2
                                            }}
                                        >
                                            SuperAdmin
                                        </Button>
                                    )}

                                    <Button
                                        color="inherit"
                                        endIcon={<ArrowDropDownIcon />}
                                        onMouseEnter={handleOpenView}
                                        onClick={handleOpenView}
                                        startIcon={<ReceiptIcon />}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                transform: 'translateY(-2px)'
                                            },
                                            transition: 'all 0.2s ease-in-out',
                                            mx: 0.5,
                                            px: 2,
                                            borderRadius: 2,
                                            ...(isActive('/admin/view') ? {
                                                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.08)',
                                                color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                                fontWeight: 'bold',
                                                '&:hover': {
                                                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.12)'
                                                }
                                            } : {})
                                        }}
                                    >
                                        Ver
                                    </Button>
                                    <Menu
                                        id="menu-ver"
                                        anchorEl={anchorElView}
                                        open={Boolean(anchorElView)}
                                        onClose={handleCloseView}
                                        MenuListProps={{ onMouseLeave: handleCloseView }}
                                    >
                                        <MenuItem onClick={() => { navigate('/admin'); handleCloseView(); }}>
                                            <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText>Ver Facturas</ListItemText>
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin/payment/list'); handleCloseView(); }}>
                                            <ListItemIcon><PaymentIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText>Ver Pagos</ListItemText>
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/admin/user/list'); handleCloseView(); }}>
                                            <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText>Ver Usuarios</ListItemText>
                                        </MenuItem>
                                    </Menu>

                                    

                                </>
                                
                            ) : (
                                <Button 
                                    color="inherit"
                                    variant={isActive('/client') ? 'contained' : 'text'}
                                    onClick={() => navigate('/client')}
                                    startIcon={<ReceiptIcon fontSize="small" />}
                                    sx={{
                                        ...(isActive('/client') ? {
                                            backgroundColor: theme.palette.primary.main,
                                            color: theme.palette.primary.contrastText,
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.dark
                                            },
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                            transform: 'translateY(-2px)'
                                        } : {
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }),
                                        transition: 'all 0.2s ease-in-out',
                                        mx: 0.5,
                                        px: 2,
                                        borderRadius: 2
                                    }}
                                >
                                    Mis Facturas
                                </Button>
                            )}
                            <Button
                                color="inherit"
                                variant={isActive('/cuentas-bancarias') ? 'contained' : 'text'}
                                onClick={() => navigate('/cuentas-bancarias')}
                                startIcon={<AccountBalanceIcon />}
                                sx={{
                                    ...(isActive('/cuentas-bancarias') ? {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.08)',
                                        color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.12)'
                                        },
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                        transform: 'translateY(-2px)'
                                    } : {
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }),
                                    transition: 'all 0.2s ease-in-out',
                                    mx: 0.5,
                                    px: 2,
                                    borderRadius: 2
                                }}
                            >
                                Cuentas Bancarias
                            </Button>
                            <Button
                                color="inherit"
                                variant={isActive('/about') ? 'contained' : 'text'}
                                onClick={() => navigate('/about')}
                                startIcon={<InfoIcon />}
                                sx={{
                                    ...(isActive('/about') ? {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.08)',
                                        color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.12)'
                                        },
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                        transform: 'translateY(-2px)'
                                    } : {
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }),
                                    transition: 'all 0.2s ease-in-out',
                                    mx: 0.5,
                                    px: 2,
                                    borderRadius: 2
                                }}
                            >
                                Sobre Wanda
                            </Button>
                            <Button
                                color="inherit"
                                variant={isActive('/fidelidad') ? 'contained' : 'text'}
                                onClick={() => navigate('/fidelidad')}
                                startIcon={<LoyaltyIcon />}
                                sx={{
                                    ...(isActive('/fidelidad') ? {
                                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.08)',
                                        color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.12)'
                                        },
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                        transform: 'translateY(-2px)'
                                    } : {
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            transform: 'translateY(-2px)'
                                        }
                                    }),
                                    transition: 'all 0.2s ease-in-out',
                                    mx: 0.5,
                                    px: 2,
                                    borderRadius: 2
                                }}
                            >
                                 Programa de Fidelidad
                            </Button>
                            <Button
                                color="inherit"
                                onClick={handleLogout}
                                startIcon={<LogoutIcon />}
                                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
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
                            <ListItem button onClick={handleOpenView}>
                                <ListItemIcon><ReceiptIcon /></ListItemIcon>
                                <ListItemText primary="Ver" />
                                <ArrowDropDownIcon />
                            </ListItem>
                            <Menu
                                anchorEl={anchorElView}
                                open={Boolean(anchorElView)}
                                onClose={() => { handleCloseView(); setDrawerOpen(false); }}
                            >
                                <MenuItem onClick={() => { navigate('/admin'); handleCloseView(); setDrawerOpen(false); }}>Ver Facturas</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin/payment/list'); handleCloseView(); setDrawerOpen(false); }}>Ver Pagos</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin/user/list'); handleCloseView(); setDrawerOpen(false); }}>Ver Usuarios</MenuItem>
                            </Menu>

                            <ListItem button onClick={handleOpenRegister}>
                                <ListItemIcon><AddCircleIcon /></ListItemIcon>
                                <ListItemText primary="Registrar" />
                                <ArrowDropDownIcon />
                            </ListItem>
                            <Menu
                                anchorEl={anchorElRegister}
                                open={Boolean(anchorElRegister)}
                                onClose={() => { handleCloseRegister(); setDrawerOpen(false); }}
                            >
                                <MenuItem onClick={() => { navigate('/admin/user/create'); handleCloseRegister(); setDrawerOpen(false); }}>Registrar Usuario</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin/invoice/create'); handleCloseRegister(); setDrawerOpen(false); }}>Registrar Factura</MenuItem>
                                <MenuItem onClick={() => { navigate('/admin/payment/register'); handleCloseRegister(); setDrawerOpen(false); }}>Registrar Pago</MenuItem>
                            </Menu>

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
                    <ListItem button onClick={() => { navigate('/cuentas-bancarias'); setDrawerOpen(false); }}>
                        <ListItemText primary="Cuentas Bancarias" />
                    </ListItem>
                    <ListItem button onClick={() => { navigate('/about'); setDrawerOpen(false); }}>
                        <ListItemText primary="Sobre Wanda" />
                    </ListItem>
                    <ListItem button onClick={() => { navigate('/fidelidad'); setDrawerOpen(false); }}>
                        <ListItemIcon><LoyaltyIcon /></ListItemIcon>
                        <ListItemText primary="Programa de Fidelidad" />
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
