import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Navigation } from '../shared/Navigation';
import { userService } from '../../services/userService';
import { User } from '../../types/user';
import InputMask from 'react-input-mask';
import { auth } from '../../services/auth';

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
  const [users, setUsers] = useState<User[]>([]);
  const [filterText, setFilterText] = useState<string>('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  // Estado para Snackbar de feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    (async () => {
      const data = await userService.getUsers();
      setUsers(data);
    })();
  }, []);

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
    // limpia guiones y no-dígitos
    if (updated.cedula) updated.cedula = updated.cedula.replace(/-/g, '');
    if (updated.phone) updated.phone = updated.phone.replace(/\D/g, '');
    await userService.updateUser(updated);
    const fresh = await userService.getUsers();
    setUsers(fresh);
    setEditUser(null);
    setSnackbarMessage(`Cambios guardados correctamente para "${updated.username}"`);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Filtrar usuarios: si texto son solo dígitos, buscar en cédula/teléfono; si no, buscar en usuario/nombre/rol/dirección
  const query = filterText.trim().toLowerCase();
  const isDigits = /^[0-9]+$/.test(query);
  const filteredUsers = users.filter(u => {
    if (!query) return true;
    if (isDigits) {
      const digits = query;
      return (
        (u.cedula?.includes(digits) ?? false) ||
        (u.phone?.includes(digits) ?? false)
      );
    }
    return [u.username, u.fullName, u.role, u.address]
      .some(field => field?.toLowerCase().includes(query));
  });

  return (
    <>
      <Navigation title="Lista de Usuarios" />
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#E31C79', mb: 2 }}>
            Usuarios
          </Typography>
          <TextField
            fullWidth
            label="Filtrar Usuarios"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Paper elevation={1} sx={{ p: 2 }}>
            <Table sx={{ tableLayout: 'auto', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>#</TableCell>
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
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{index + 1}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.username, filterText)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.fullName, filterText)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.role, filterText)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(formatCedula(user.cedula ?? ''), filterText)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(formatPhone(user.phone ?? ''), filterText)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{highlightText(user.address ?? '', filterText)}</TableCell>
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
            <InputMask
              mask="999-9999999-9"
              value={editForm.cedula || ''}
              onChange={handleInputChange}
              maskChar=""
            >
              {(maskProps: any) => (
                <TextField
                  {...maskProps}
                  name="cedula"
                  label="Cédula"
                  fullWidth
                  margin="dense"
                />
              )}
            </InputMask>
            <InputMask
              mask="+1 (999) 999-9999"
              value={editForm.phone || ''}
              onChange={handleInputChange}
              maskChar=""
            >
              {(maskProps: any) => (
                <TextField
                  {...maskProps}
                  name="phone"
                  label="Teléfono"
                  fullWidth
                  margin="dense"
                />
              )}
            </InputMask>
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
