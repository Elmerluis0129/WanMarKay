import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Snackbar,
  Alert as MuiAlert,
  Pagination,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
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
  const { data: result, isLoading, error } = useQuery<{ data: User[]; count: number }, Error>({
    queryKey: ['users', page, search],
    queryFn: () => userService.getUsersPaginated(page, pageSize, search),
    staleTime: 300000,
  });
  const queryClient = useQueryClient();
  const users = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
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
    <>
      <Navigation title="Lista de Usuarios" />
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#E31C79', mb: 1 }}>
            Usuarios
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              label="Buscar Usuarios"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              size="small"
              sx={{ mr: 2 }}
            />
            <Typography variant="h6">
              Total de usuarios: {totalCount}
            </Typography>
          </Box>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Table sx={{ tableLayout: 'auto', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Usuario</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Nombre Completo</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Rol</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Cédula</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Teléfono</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Dirección/Referencia</TableCell>
                  {isAdmin && <TableCell sx={{ whiteSpace: 'nowrap' }}>Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id} hover sx={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5' }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.username, search)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.fullName, search)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.role, search)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(formatCedula(user.cedula ?? ''), search)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(formatPhone(user.phone ?? ''), search)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.address ?? '', search)}</TableCell>
                    {isAdmin && (
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton onClick={() => openEdit(user)} size="small">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </Paper>
        </Box>
      </Container>
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
    </>
  );
};
