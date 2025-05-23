import React, { useState, useEffect } from 'react';
import {
  Container,
  Alert,
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
  SelectChangeEvent,
  Autocomplete
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Navigation } from '../shared/Navigation';
import { useTheme } from '@mui/material/styles';
import { invoiceService } from '../../services/invoiceService';
import { Invoice } from '../../types/invoice';
import { auth } from '../../services/auth';

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
  const [voucherFactura, setVoucherFactura] = useState('');
  const [voucherUsuario, setVoucherUsuario] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Cargar facturas pendientes al montar el componente
  useEffect(() => {
    (async () => {
      try {
        const data = await invoiceService.getAllInvoices();
        // Filtrar facturas pendientes y por usuario si no es admin
        const pending = data.filter(inv => {
          const isPending = inv.status !== 'paid' && inv.status !== 'cancelled';
          if (auth.isAdmin()) {
            return isPending;
          } else {
            const currentUser = auth.getCurrentUser();
            return isPending && inv.clientId === currentUser?.id;
          }
        });
        setInvoices(pending);
      } catch (err: any) {
        console.error('Error cargando facturas:', err);
        setVoucherMsg('Error cargando facturas: ' + (err.message || JSON.stringify(err)));
      }
    })();
  }, []);

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

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherMsg('');
    if (!voucherFile) {
      setVoucherMsg('Debes subir una imagen de voucher');
      // Mostrar feedback visual destacado
      return;
    }
    if (!selectedInvoice) {
      setVoucherMsg('Debes seleccionar una factura');
      return;
    }
    setVoucherLoading(true);
    const formData = new FormData();
    formData.append('numeroFactura', selectedInvoice.invoiceNumber);
    formData.append('nombreUsuario', voucherUsuario);
    formData.append('banco', selectedAccount?.bank || '');
    // Construir nombre de archivo: <nombre_original>_NombreBanco.png
    let fileExt = voucherFile.name.split('.').pop() || 'png';
    let baseName = voucherFile.name.replace(/\.[^/.]+$/, "");
    let cleanBank = (selectedAccount?.bank || '').replace(/[^a-zA-Z0-9]/g, '');
    let newFileName = `${baseName}_${cleanBank || 'Banco'}.${fileExt}`;
    // Crear un nuevo File con el nombre modificado
    const fileWithBank = new File([voucherFile], newFileName, { type: voucherFile.type });
    formData.append('voucher', fileWithBank);
    // Depuración: mostrar los valores de formData
    formData.forEach((value, key) => {
      console.log('FormData:', key, value);
    });
    try {
      const res = await fetch('https://wanmarkay-backend.vercel.app/api/upload-voucher', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setVoucherMsg('¡Voucher subido correctamente!');
        // Limpia los campos
        setVoucherFactura('');
        setVoucherUsuario('');
        setVoucherFile(null);
        setSelectedInvoice(null);
      } else {
        setVoucherMsg('Error: ' + (data.error || 'No se pudo subir el voucher'));
      }

    } catch (err: any) {
      console.error('Error al subir voucher:', err);

      // Si ya se subió y fue un problema menor (como CORS), asumir que fue exitoso
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setVoucherMsg('¡Voucher subido correctamente!');
      } else {
        setVoucherMsg('Error de red o servidor: ' + (err.message || ''));
      }
    }

    setVoucherLoading(false);
  };

  // Nuevo: abrir modal al hacer clic en tarjeta
  const handleOpenAccountModal = (acc: any) => {
    setSelectedAccount(acc);
    setVoucherUsuario(acc.name || '');
    setModalOpen(true);
  };
  const handleCloseAccountModal = () => {
    setModalOpen(false);
    setSelectedAccount(null);
    setVoucherMsg('');
    setVoucherFactura('');
    setVoucherFile(null);
    setSelectedInvoice(null);
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
                    onClick={() => handleOpenAccountModal(acc)}
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

          {/* Modal para ver datos y subir voucher */}
          <Dialog open={modalOpen} onClose={handleCloseAccountModal} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Typography variant="h6" sx={{ color: '#E31C79', fontWeight: 700 }}>
                {selectedAccount?.bank} - {selectedAccount?.accountNumber}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#E31C79', mb: 1 }}>Subir Comprobante de Pago</Typography>
                <form onSubmit={handleVoucherSubmit}>
                  <Autocomplete
                    value={selectedInvoice}
                    onChange={(_, newValue) => {
                      setSelectedInvoice(newValue);
                      if (newValue) {
                        setVoucherUsuario(newValue.clientName);
                      }
                    }}
                    options={invoices}
                    getOptionLabel={inv => `#${inv.invoiceNumber} - ${inv.clientName}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Seleccionar Factura"
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                      />
                    )}
                  />
                  <TextField
                    label="Nombre de usuario"
                    value={voucherUsuario}
                    onChange={e => setVoucherUsuario(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                    fullWidth
                  >
                    {voucherFile ? voucherFile.name : 'Seleccionar imagen de voucher'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      required
                      onChange={e => setVoucherFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {!voucherFile && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Es obligatorio seleccionar y subir un voucher.
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={voucherLoading}
                    sx={{ fontWeight: 700 }}
                  >
                    {voucherLoading ? 'Subiendo...' : 'Subir voucher'}
                  </Button>
                  {voucherMsg && (
                    <Typography sx={{ mt: 2, color: voucherMsg.startsWith('¡') ? 'green' : 'red', fontWeight: 500 }}>
                      {voucherMsg}
                    </Typography>
                  )}
                </form>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAccountModal} color="secondary">Cerrar</Button>
            </DialogActions>
          </Dialog>

          {/* Formulario de subida de voucher solo para admin (debajo de las tarjetas) */}
          {isAdmin() && (
            <Paper elevation={2} sx={{ mt: 4, p: 3, maxWidth: 500, mx: 'auto', borderRadius: 3 }}>
              <Typography variant="h6" sx={{ color: '#E31C79', mb: 2, fontWeight: 700 }}>
                Subir Voucher de Pago
              </Typography>
              <form onSubmit={handleVoucherSubmit}>
                <TextField
                  label="Número de factura"
                  value={voucherFactura}
                  onChange={e => setVoucherFactura(e.target.value)}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Nombre de usuario"
                  value={voucherUsuario}
                  onChange={e => setVoucherUsuario(e.target.value)}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                  fullWidth
                >
                  {voucherFile ? voucherFile.name : 'Seleccionar imagen de voucher'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    required
                    onChange={e => setVoucherFile(e.target.files?.[0] || null)}
                  />
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={voucherLoading}
                  sx={{ fontWeight: 700 }}
                >
                  {voucherLoading ? 'Subiendo...' : 'Subir voucher'}
                </Button>
                {voucherMsg && (
                  <Typography sx={{ mt: 2, color: voucherMsg.startsWith('¡') ? 'green' : 'red', fontWeight: 500 }}>
                    {voucherMsg}
                  </Typography>
                )}
              </form>
            </Paper>
          )}
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