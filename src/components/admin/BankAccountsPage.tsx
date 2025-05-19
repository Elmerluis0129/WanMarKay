import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  FormControl,
  SelectChangeEvent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Navigation } from '../shared/Navigation';
import { useTheme } from '@mui/material/styles';

// Lista de bancos y asociaciones dominicanas (puedes agregar más si lo deseas)
const BANKS = [
  'Banco Popular',
  'Banco BHD León',
  'Banco Banreservas',
  'Banco Santa Cruz',
  'Banco Caribe',
  'Banco Promerica',
  'Banco Vimenca',
  'Banco López de Haro',
  'Banco Activo',
  'Banco Ademi',
  'Banco Lafise',
  'Banco Unión',
  'Asociación Popular de Ahorros y Préstamos',
  'Asociación Cibao',
  'Asociación La Nacional',
  'Asociación Duarte',
  'Asociación Romana',
  'Asociación Peravia',
  'Asociación Mocana',
  'Asociación Maguana',
  'Asociación Bonao',
  'Asociación Noroeste',
  'Asociación Barahona',
  'Asociación Espaillat',
  'Asociación Hato Mayor',
  'Asociación Moca',
  'Asociación San José',
  'Asociación Santiago',
  'Asociación Vega Real',
];

// Datos iniciales (puedes cargar esto de un backend en el futuro)
const INITIAL_ACCOUNTS = [
  {
    id: 1,
    name: 'CARMEN TRINIDAD GUZMÁN',
    bank: 'Banco Popular',
    accountType: 'Ahorro',
    accountNumber: '794496984',
  },
  {
    id: 2,
    name: 'CARMEN TRINIDAD GUZMÁN',
    bank: 'Banco BHD León',
    accountType: 'Ahorro',
    accountNumber: '2440491389',
  },
  {
    id: 3,
    name: 'CARMEN TRINIDAD GUZMÁN',
    bank: 'Banco Banreservas',
    accountType: 'Ahorro',
    accountNumber: '28491820013',
  },
];

// Simulación de autenticación (reemplaza por tu lógica real)
const isAdmin = () => {
  // Aquí deberías usar tu sistema de auth real
  return window.localStorage.getItem('role') === 'admin';
};

export const BankAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleEdit = (idx: number) => {
    setEditIndex(idx);
    setEditData(accounts[idx]);
    setEditDialogOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev: any) => ({ ...prev, [name!]: value }));
  };

  const handleBankChange = (e: SelectChangeEvent) => {
    setEditData((prev: any) => ({ ...prev, bank: e.target.value }));
  };

  const handleSave = () => {
    const updated = [...accounts];
    updated[editIndex!] = editData;
    setAccounts(updated);
    setEditDialogOpen(false);
    setEditIndex(null);
  };

  const handleCancel = () => {
    setEditDialogOpen(false);
    setEditIndex(null);
  };

  // Colores dinámicos según modo
  const cardBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)';
  const cardShadow = isDark
    ? (hovered: boolean) => hovered ? '0 8px 32px 0 rgba(227,28,121,0.25)' : '0 4px 16px 0 rgba(0,0,0,0.10)'
    : (hovered: boolean) => hovered ? '0 8px 32px 0 rgba(227,28,121,0.10)' : '0 4px 16px 0 rgba(0,0,0,0.08)';
  const cardBorder = isDark
    ? (hovered: boolean) => hovered ? '2px solid #E31C79' : '1.5px solid rgba(255,255,255,0.18)'
    : (hovered: boolean) => hovered ? '2px solid #E31C79' : '1.5px solid #e0e0e0';
  const textMain = isDark ? '#fff' : '#222';
  const textSubtle = isDark ? 'rgba(255,255,255,0.7)' : '#666';
  const textStrong = isDark ? '#fff' : '#222';
  const textAccount = isDark ? '#fff' : '#222';
  const textAccountLabel = '#E31C79';

  return (
    <>
      <Navigation title="Cuentas para Transferencias y Depósitos" />
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#E31C79', mb: 1, fontWeight: 700 }}>
            Transferencias y Depósitos
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 3, color: isDark ? 'rgba(255,255,255,0.8)' : '#888' }}>
            Puedes realizar transferencias o depósitos a cualquiera de las siguientes cuentas. Por favor, envía el comprobante después de tu pago.
          </Typography>
          <Paper elevation={0} sx={{ p: { xs: 1, md: 3 }, background: 'transparent' }}>
            <Grid container spacing={3}>
              {accounts.map((acc, idx) => (
                <Grid item xs={12} sm={6} md={4} key={acc.id}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 4,
                      p: 3,
                      mb: 2,
                      minHeight: 220,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: cardBg,
                      boxShadow: cardShadow(hoveredIndex === idx),
                      backdropFilter: 'blur(8px)',
                      border: cardBorder(hoveredIndex === idx),
                      transition: 'all 0.25s cubic-bezier(.4,2,.3,1)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: cardShadow(true),
                        borderColor: '#E31C79',
                        transform: 'translateY(-2px) scale(1.025)',
                        background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,1)',
                      },
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalanceIcon sx={{ fontSize: 48, color: '#E31C79', mr: 2, filter: 'drop-shadow(0 2px 8px #e31c7940)' }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textMain, letterSpacing: 0.5 }}>{acc.name}</Typography>
                        <Typography variant="body2" sx={{ color: textSubtle }}>{acc.bank}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e0e0e0', my: 1, mb: 2 }} />
                    <Typography variant="body2" sx={{ color: textSubtle, mb: 1 }}>
                      <b>Tipo de cuenta:</b> {acc.accountType}
                    </Typography>
                    <Typography variant="h6" sx={{ color: textAccount, fontWeight: 800, letterSpacing: 1, mb: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 400, color: textAccountLabel, marginRight: 6 }}>No. de cuenta:</span> {acc.accountNumber}
                    </Typography>
                    {isAdmin() && hoveredIndex === idx && (
                      <IconButton
                        size="large"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          color: '#fff',
                          background: 'linear-gradient(135deg, #E31C79 60%, #fff 100%)',
                          boxShadow: 3,
                          zIndex: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #fff 10%, #E31C79 90%)',
                            color: '#E31C79',
                            transform: 'scale(1.1)',
                          },
                        }}
                        onClick={() => handleEdit(idx)}
                        title="Editar cuenta"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      </Container>

      {/* Dialogo de edición para admin con vista previa */}
      <Dialog open={editDialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Cuenta Bancaria</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="dense"
                label="Titular"
                name="name"
                value={editData.name || ''}
                onChange={handleEditChange}
                fullWidth
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Banco</InputLabel>
                <Select
                  name="bank"
                  value={editData.bank || ''}
                  onChange={handleBankChange}
                  label="Banco"
                >
                  {BANKS.map(b => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Tipo de cuenta"
                name="accountType"
                value={editData.accountType || ''}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                margin="dense"
                label="No. de cuenta"
                name="accountNumber"
                value={editData.accountNumber || ''}
                onChange={handleEditChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#E31C79' }}>Vista previa</Typography>
              <Box
                sx={{
                  borderRadius: 4,
                  p: 3,
                  background: cardBg,
                  boxShadow: cardShadow(false),
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: cardBorder(false),
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceIcon sx={{ fontSize: 48, color: '#E31C79', mr: 2, filter: 'drop-shadow(0 2px 8px #e31c7940)' }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textMain, letterSpacing: 0.5 }}>{editData.name || 'Titular'}</Typography>
                    <Typography variant="body2" sx={{ color: textSubtle }}>{editData.bank || 'Banco'}</Typography>
                  </Box>
                </Box>
                <Box sx={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e0e0e0', my: 1, mb: 2 }} />
                <Typography variant="body2" sx={{ color: textSubtle, mb: 1 }}>
                  <b>Tipo de cuenta:</b> {editData.accountType || 'Tipo'}
                </Typography>
                <Typography variant="h6" sx={{ color: textAccount, fontWeight: 800, letterSpacing: 1, mb: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 400, color: textAccountLabel, marginRight: 6 }}>No. de cuenta:</span> {editData.accountNumber || '000000000'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CancelIcon />} onClick={handleCancel} color="secondary">Cancelar</Button>
          <Button startIcon={<SaveIcon />} onClick={handleSave} color="primary" variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 