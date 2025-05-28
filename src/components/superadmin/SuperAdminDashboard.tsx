import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  Alert,
  Box, 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel, 
  IconButton,
  InputAdornment, 
  InputLabel,
  MenuItem,
  Paper, 
  Select,
  SelectChangeEvent,
  Snackbar,
  Switch, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TablePagination,
  TableRow, 
  TextField,
  ToggleButton,
  ToggleButtonGroup, 
  Tooltip, 
  Typography,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import WarningAmber from '@mui/icons-material/WarningAmber';
import { Navigation } from '../shared/Navigation';
import { auth } from '../../services/auth';
import { supabase } from '../../services/supabase';
import { User, UserRole } from '../../types/user';

// Configurar dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User> & { newPassword?: string; confirmPassword?: string }>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' | 'info' 
  });
  // Estados para los diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    severity: 'warning' as 'warning' | 'error'
  });

  // Función para mostrar el diálogo de confirmación
  const showConfirmDialog = (options: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    severity?: 'warning' | 'error';
  }) => {
    setConfirmDialog({
      open: true,
      title: options.title,
      message: options.message,
      onConfirm: options.onConfirm,
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      severity: options.severity || 'warning'
    });
  };

  // Cerrar diálogo de confirmación
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  };

  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchField, setSearchField] = useState<keyof User>('username');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Asegurarse de que todos los usuarios tengan el campo isActive
      const normalizedUsers = (data || []).map(user => ({
        ...user,
        isActive: user.isActive !== false // Usar isActive directamente
      }));

      setUsers(normalizedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({
        open: true,
        message: t('error.loadingUsers'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Si es -1 (Todos) o un número válido
    setRowsPerPage(parseInt(value, 10) || -1);
    setPage(0);
  };

  const handleOpenDialog = (user: User | null = null) => {
    setShowPasswordFields(false);
    if (user) {
      // Asegurarse de que el usuario tenga la propiedad full_name
      const userWithFullName = {
        ...user,
        full_name: user.full_name || user.fullName
      };
      setFormData({
        ...userWithFullName,
        fullName: userWithFullName.full_name || userWithFullName.fullName || '',
        newPassword: '',
        confirmPassword: ''
      });
      setEditingUser(userWithFullName);
    } else {
      setFormData({
        username: '',
        fullName: '',
        email: '',
        role: 'client',
        isActive: true,
        newPassword: '',
        confirmPassword: ''
      });
      setEditingUser(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({});
    setShowPasswordFields(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleRoleChange = (e: SelectChangeEvent<UserRole>) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.value as UserRole
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validar campos requeridos
      if (!formData.username || !formData.email || !formData.role) {
        setSnackbar({
          open: true,
          message: 'Por favor complete todos los campos requeridos',
          severity: 'warning'
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setSnackbar({
          open: true,
          message: 'Por favor ingrese un correo electrónico válido',
          severity: 'warning'
        });
        return;
      }

      if (editingUser) {
        // Actualizar usuario existente
        const updateData: any = {
          username: formData.username,
          fullName: formData.fullName || '', // Usar string vacío en lugar de null
          email: formData.email, // Asegurarse de incluir el email
          role: formData.role,
          isActive: formData.isActive !== false, // Asegurar que sea booleano
        };

        // Mapear los nombres de los campos para la base de datos
        const isPasswordChange = showPasswordFields && formData.newPassword && formData.newPassword === formData.confirmPassword;
        const currentDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
        
        // Verificar si la nueva contraseña ya está en el historial
        const passwordHistory = editingUser?.passwordHistory || [];
        if (isPasswordChange && formData.newPassword && passwordHistory.includes(formData.newPassword)) {
          setSnackbar({
            open: true,
            message: '❌ Esta contraseña ya ha sido utilizada anteriormente. Por favor, elija una contraseña diferente.',
            severity: 'error'
          });
          return;
        }
        
        const dbUpdateData: any = {
          ...updateData,
          full_name: updateData.fullName, // Asegurar que se use full_name para la base de datos
          // Si se está cambiando la contraseña, incluirla en los datos a actualizar
          ...(isPasswordChange && {
            password: formData.newPassword, // En un entorno real, esto debería estar hasheado
            passwordChangedAt: currentDate, // Actualizar la fecha de cambio de contraseña
            // Actualizar el historial de contraseñas
            passwordHistory: [
              // Mantener las últimas 5 contraseñas (o el número que prefieras)
              ...(editingUser?.passwordHistory || []).slice(-4),
              editingUser?.password // Agregar la contraseña actual al historial
            ].filter(Boolean), // Filtrar valores nulos o indefinidos
            mustChangePassword: true // Forzar al usuario a cambiar la contraseña en el próximo inicio de sesión
          })
        };
        // Eliminar fullName ya que no existe en la base de datos
        delete dbUpdateData.fullName;

        // Si se está cambiando la contraseña, mostrar mensaje de éxito
        if (isPasswordChange) {
          setSnackbar({
            open: true,
            message: '✅ Contraseña actualizada correctamente',
            severity: 'success'
          });
        }

        const { data, error } = await supabase
          .from('users')
          .update(dbUpdateData)
          .eq('id', editingUser.id)
          .select();

        if (error) {
          console.error('Error al actualizar usuario:', error);
          throw new Error(error.message || 'Error al actualizar el usuario');
        }

        setSnackbar({
          open: true,
          message: '✅ Usuario actualizado correctamente',
          severity: 'success'
        });
      } else {
        // Crear nuevo usuario directamente en la tabla users
        const password = generateRandomPassword();
        const { data, error } = await supabase
          .from('users')
          .insert({
            username: formData.username,
            email: formData.email,
            full_name: formData.fullName || '',
            password: password, // En un entorno real, esto debería estar hasheado
            role: formData.role,
            isActive: true,
            passwordChangedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            passwordHistory: [] // Inicializar el historial de contraseñas vacío
          })
          .select();

        if (error) {
          console.error('Error al crear usuario:', error);
          throw new Error(error.message || 'Error al crear el usuario');
        }
        
        // Aquí podrías enviar un correo con la contraseña temporal
        console.log('Contraseña temporal generada:', password);

        setSnackbar({
          open: true,
          message: 'Usuario creado correctamente.',
          severity: 'success'
        });
      }

      // Recargar la lista de usuarios y cerrar el diálogo
      await loadUsers();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      setSnackbar({
        open: true,
        message: `❌ ${error.message || 'Error al guardar el usuario'}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    showConfirmDialog({
      title: 'Eliminar Usuario',
      message: '¿Estás seguro de que deseas eliminar permanentemente este usuario? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      severity: 'error',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

          if (error) throw error;

          setSnackbar({
            open: true,
            message: 'Usuario eliminado correctamente',
            severity: 'success'
          });
          loadUsers();
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          setSnackbar({
            open: true,
            message: 'Error al eliminar el usuario',
            severity: 'error'
          });
        }
      }
    });
  };

  const confirmToggleActive = (userId: string, newActiveState: boolean) => {
    showConfirmDialog({
      title: newActiveState ? 'Activar Usuario' : 'Desactivar Usuario',
      message: `¿Estás seguro de que deseas ${newActiveState ? 'activar' : 'desactivar'} este usuario?`,
      confirmText: newActiveState ? 'Activar' : 'Desactivar',
      severity: 'warning',
      onConfirm: async () => {
        try {
          console.log('Intentando actualizar usuario:', { userId, newActiveState });
          
          const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ 
              isActive: newActiveState
            })
            .eq('id', userId)
            .select('*')
            .single();

          if (error) throw error;
          if (!updatedUser) throw new Error('No se recibió respuesta del servidor');

          // Actualizar el estado local
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === userId 
                ? { ...user, isActive: newActiveState } 
                : user
            )
          );

          // Recargar los usuarios para asegurar consistencia
          await loadUsers();

          setSnackbar({
            open: true,
            message: newActiveState 
              ? 'Usuario activado correctamente' 
              : 'Usuario desactivado correctamente',
            severity: 'success'
          });
        } catch (error) {
          console.error('Error al actualizar el estado del usuario:', error);
          setSnackbar({
            open: true,
            message: `Error al ${newActiveState ? 'activar' : 'desactivar'} el usuario`,
            severity: 'error'
          });
        }
      }
    });
  };

  // Función para manejar el toggle del switch de activación
  const handleToggleActive = (userId: string, newActiveState: boolean) => {
    confirmToggleActive(userId, newActiveState);
  };

  // Estilos personalizados para los roles
  const getRoleStyle = (role: string) => {
    const baseStyle = {
      padding: '4px 12px',
      borderRadius: '16px',
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    };

    switch (role) {
      case 'superadmin':
        return {
          ...baseStyle,
          backgroundColor: '#4caf50',
          color: 'white',
          border: '1px solid #2e7d32'
        };
      case 'admin':
        return {
          ...baseStyle,
          backgroundColor: '#2196f3',
          color: 'white',
          border: '1px solid #0d47a1'
        };
      default: // client
        return {
          ...baseStyle,
          backgroundColor: '#9e9e9e',
          color: 'white',
          border: '1px solid #424242'
        };
    }
  };

  // Filtrar usuarios según el término de búsqueda y el filtro de estado
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      (user[searchField]?.toString().toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) || 
      (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Opciones de filas por página
  const rowsPerPageOptions = [10, 25, 50, 100, { value: -1, label: 'Todos' }];

  // Función para generar contraseña aleatoria
  const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation title="Panel de Super Administrador" />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
              Panel de Administración
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Agregar Usuario
            </Button>
          </Box>

          {/* Barra de búsqueda y filtros */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="search-field-label">Buscar por</InputLabel>
              <Select
                labelId="search-field-label"
                value={searchField}
                label="Buscar por"
                onChange={(e) => setSearchField(e.target.value as keyof User)}
              >
                <MenuItem value="username">Usuario</MenuItem>
                <MenuItem value="email">Correo</MenuItem>
                <MenuItem value="fullName">Nombre completo</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(e, newFilter) => newFilter && setStatusFilter(newFilter)}
              aria-label="Filtrar por estado"
            >
              <ToggleButton value="all" aria-label="Todos">
                <FilterListIcon sx={{ mr: 1 }} />
                Todos
              </ToggleButton>
              <ToggleButton value="active" aria-label="Activos">
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                Activos
              </ToggleButton>
              <ToggleButton value="inactive" aria-label="Inactivos">
                <BlockIcon color="error" sx={{ mr: 1 }} />
                Inactivos
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Paper 
          elevation={3} 
          sx={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            mb: 3
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow 
                  sx={{
                    backgroundColor: (theme) => theme.palette.mode === 'light' 
                      ? '#f5f5f5' 
                      : 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Nombre Completo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Correo Electrónico</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', textAlign: 'center' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', textAlign: 'center' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          No se encontraron usuarios
                        </Typography>
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          sx={{ mt: 1 }}
                        >
                          Limpiar filtros
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow 
                        key={user.id}
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: (theme) => 
                              user.isActive === false 
                                ? 'action.disabledBackground' 
                                : theme.palette.action.hover,
                          },
                          '&:last-child td': { borderBottom: 0 },
                          backgroundColor: (theme) => 
                            theme.palette.mode === 'light' 
                              ? theme.palette.background.paper 
                              : theme.palette.background.default,
                          opacity: user.isActive === false ? 0.7 : 1,
                        }}
                      >
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.fullName || user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Box 
                            sx={{
                              ...getRoleStyle(user.role),
                              display: 'inline-flex',
                              alignItems: 'center',
                              py: 0.5,
                              px: 1.5,
                              borderRadius: 1,
                              textTransform: 'capitalize'
                            }}
                          >
                            {user.role === 'superadmin' ? 'Super Administrador' : 
                             user.role === 'admin' ? 'Administrador' : 'Cliente'}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={user.isActive !== false}
                                onChange={(e) => handleToggleActive(user.id, e.target.checked)}
                                color="primary"
                              />
                            }
                            label={user.isActive ? 'Activo' : 'Inactivo'}
                            labelPlacement="start"
                            sx={{ m: 0, ml: 1 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={1}>
                            <Tooltip title="Editar">
                              <IconButton 
                                color="primary" 
                                onClick={() => handleOpenDialog(user)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteUser(user.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage === -1 ? filteredUsers.length : rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count, page }) => {
              if (rowsPerPage === -1) {
                return `${from}-${count} de ${count}`;
              }
              return `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`;
            }}
            sx={{
              '& .MuiTablePagination-toolbar': {
                justifyContent: 'flex-end',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                margin: 0,
              },
            }}
          />
        </Paper>
      </Box>

      {/* Diálogo para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nombre de usuario"
              name="username"
              autoComplete="username"
              value={formData.username || ''}
              onChange={handleInputChange}
              disabled={!!editingUser}
            />
            <TextField
              margin="dense"
              name="email"
              label="Correo Electrónico"
              type="email"
              fullWidth
              value={formData.email || ''}
              onChange={handleInputChange}
              disabled={!!editingUser}
            />
            
            {showPasswordFields && (
              <>
                <TextField
                  margin="dense"
                  name="newPassword"
                  label="Nueva Contraseña"
                  type="password"
                  fullWidth
                  value={formData.newPassword || ''}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="dense"
                  name="confirmPassword"
                  label="Confirmar Nueva Contraseña"
                  type="password"
                  fullWidth
                  value={formData.confirmPassword || ''}
                  onChange={handleInputChange}
                  error={!!(formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword)}
                  helperText={formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword 
                    ? 'Las contraseñas no coinciden' 
                    : ''}
                />
              </>
            )}
            <TextField
              margin="normal"
              fullWidth
              id="fullName"
              label="Nombre completo"
              name="fullName"
              autoComplete="name"
              value={formData.fullName || ''}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Rol</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                name="role"
                value={formData.role || 'client'}
                label="Rol"
                onChange={handleRoleChange}
              >
                <MenuItem value="superadmin">Super Administrador</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="client">Cliente</MenuItem>
              </Select>
            </FormControl>
            {editingUser && (
              <Box mt={2}>
                <Typography variant="body1">
                  Estado: 
                  <Box 
                    component="span" 
                    color={formData.isActive ? 'success.main' : 'error.main'}
                    ml={1}
                    fontWeight="medium"
                  >
                    {formData.isActive ? 'Activo' : 'Inactivo'}
                  </Box>
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.username || !formData.email || !formData.role}
          >
            {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            minWidth: '300px'
          }
        }}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-message': {
              fontWeight: 500,
            },
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
              alignItems: 'center'
            }
          }}
          iconMapping={{
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmación */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          color: confirmDialog.severity === 'error' ? 'error.main' : 'warning.main'
        }}>
          {confirmDialog.severity === 'error' ? (
            <ErrorOutline color="error" fontSize="large" />
          ) : (
            <WarningAmber color="warning" fontSize="large" />
          )}
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={closeConfirmDialog} 
            variant="outlined"
            color="inherit"
          >
            {confirmDialog.cancelText}
          </Button>
          <Button 
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirmDialog();
            }} 
            variant="contained"
            color={confirmDialog.severity === 'error' ? 'error' : 'warning'}
            autoFocus
          >
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdminDashboard;
