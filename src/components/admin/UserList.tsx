import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import InputAdornment from '@mui/material/InputAdornment';
import MuiAlert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { Navigation } from '../shared/Navigation';
import { userService } from '../../services/userService';
import { User } from '../../types/user';
import { auth } from '../../services/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Funciones para resaltar coincidencias en filtros
const escapeRegExp = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
const highlightText = (text: string, highlight: string): React.ReactNode => {
  if (!highlight) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
  const lower = highlight.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === lower
      ? <span key={i} style={{ backgroundColor: 'yellow' }}>{part}</span>
      : part
  );
};

// Funciones para formatear cédula y teléfono
const formatCedula = (value?: string | null): string => {
  const str = value ?? '';
  const digits = str.replace(/\D/g, '');
  return digits.length === 11
    ? `${digits.slice(0,3)}-${digits.slice(3,10)}-${digits.slice(10)}`
    : str;
};
const formatPhone = (value?: string | null): string => {
  const str = value ?? '';
  const digits = str.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  return str;
};

export const UserList: React.FC = () => {
  const currentUser = auth.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  // Paginación remota y búsqueda con React Query
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Efecto para manejar la búsqueda con debounce
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1); // Resetear a la primera página al buscar
    }, 500); // 500ms de retraso

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const { data: allUsers = [], isLoading, error } = useQuery<User[], Error>({
    queryKey: ['allUsers'],
    queryFn: () => userService.getUsers(),
    staleTime: 300000,
  });
  const queryClient = useQueryClient();
  // Filtrar localmente basado en el término de búsqueda
  const users = allUsers.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.role.toLowerCase().includes(search.toLowerCase()) ||
    user.cedula?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.toLowerCase().includes(search.toLowerCase()) ||
    user.address?.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalCount = users.length;
  // Estado de edición y Snackbar
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  if (isLoading) return <CircularProgress />;
  if (error) return <div>Error al cargar usuarios: {error.message}</div>;

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ ...user });
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  const handleCloseEdit = () => setEditUser(null);
  const handleSaveEdit = async () => {
    if (!editUser) return;
    const updated = { ...editUser, ...editForm } as User;
    if (updated.cedula) updated.cedula = updated.cedula.replace(/-/g, '');
    if (updated.phone) updated.phone = updated.phone.replace(/\D/g, '');
    await userService.updateUser(updated);
    // Invalidar caché para recargar la lista
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    setEditUser(null);
    setSnackbarMessage(`Cambios guardados correctamente para "${updated.username}"`);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation title="Lista de Usuarios" />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Container>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h5" sx={{ color: '#E31C79', mb: 1 }}>
              Usuarios
            </Typography>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total de Usuarios
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#E31C79' }}>
                  {totalCount}
                </Typography>
              </Paper>
            </Grid>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <TextField
                    label="Buscar por nombre, usuario o correo"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
            <TableContainer component={Paper} elevation={1} sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Nombre Completo</TableCell>
                    <TableCell>Correo electrónico</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Cédula</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Dirección/Referencia</TableCell>
                    {isAdmin && <TableCell align="center">Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user: User, index: number) => (
                    <TableRow 
                      key={user.id} 
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                        '&:hover': {
                          backgroundColor: 'rgba(227, 28, 121, 0.04)',
                        }
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{index + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.username, search)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.fullName, search)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.email, search)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.role, search)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(formatCedula(user.cedula ?? ''), search)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(formatPhone(user.phone ?? ''), search)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.address ?? '', search)}</TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                          <IconButton 
                            onClick={() => openEdit(user)} 
                            size="small"
                            sx={{ 
                              color: '#E31C79',
                              '&:hover': {
                                backgroundColor: 'rgba(227, 28, 121, 0.08)',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary', py: 2 }}>
              Mostrando {users.length} de {totalCount} usuarios
            </Box>
          </Box>
        </Container>
      </Box>
      {isAdmin && (
        <Dialog open={Boolean(editUser)} onClose={handleCloseEdit} fullWidth>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogContent>
            <TextField
              name="fullName"
              label="Nombre Completo"
              fullWidth
              margin="dense"
              value={editForm.fullName || ''}
              onChange={handleInputChange}
            />
            <TextField
              name="email"
              label="Correo electrónico"
              fullWidth
              margin="dense"
              value={editForm.email || ''}
              onChange={handleInputChange}
              type="email"
            />
            <TextField
              name="username"
              label="Usuario"
              fullWidth
              margin="dense"
              value={editForm.username || ''}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Rol</InputLabel>
              <Select
                name="role"
                value={editForm.role || ''}
                onChange={handleSelectChange}
                label="Rol"
              >
                <MenuItem value="client">Cliente</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="cedula"
              label="Cédula"
              fullWidth
              margin="dense"
              value={editForm.cedula || ''}
              onChange={handleInputChange}
            />
            <TextField
              name="phone"
              label="Teléfono"
              fullWidth
              margin="dense"
              value={editForm.phone || ''}
              onChange={handleInputChange}
            />
            <TextField
              name="address"
              label="Dirección/Referencia"
              fullWidth
              margin="dense"
              value={editForm.address || ''}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEdit}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Guardar</Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Snackbar de confirmación */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};
