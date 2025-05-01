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
} from '@mui/material';
import { Navigation } from '../shared/Navigation';
import { userService } from '../../services/userService';
import { User } from '../../types/user';

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

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    (async () => {
      const data = await userService.getUsers();
      setUsers(data);
    })();
  }, []);

  // Filtrar usuarios por nombre, usuario o rol
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(filterText.toLowerCase()) ||
    u.fullName.toLowerCase().includes(filterText.toLowerCase()) ||
    u.role.toLowerCase().includes(filterText.toLowerCase())
  );

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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>Rol</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{highlightText(user.username, filterText)}</TableCell>
                    <TableCell>{highlightText(user.fullName, filterText)}</TableCell>
                    <TableCell>{highlightText(user.role, filterText)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </Container>
    </>
  );
};
