import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Container, Card, CardContent, Avatar, Stack, Divider, Chip, Tooltip, Snackbar, Alert, InputAdornment } from '@mui/material';
import { Navigation } from './Navigation';
import LogoutIcon from '@mui/icons-material/Logout';
import { auth } from '../../services/auth';
import { getLoyaltyTierForUser, loyaltyTiers } from '../../utils/loyaltyUtils';
import { useNavigate } from 'react-router-dom';

export const UserProfile: React.FC = () => {
  // Formato de cédula: 3-7-1
  const formatCedula = (cedula: string) => {
    const cleaned = cedula.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0,3)}-${cleaned.slice(3,10)}-${cleaned.slice(10)}`;
    }
    return cedula;
  };

  // Formato de teléfono RD: +1 (xxx) xxx-xxxx
  const formatPhoneRD = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const user = auth.getCurrentUser();
  const navigate = useNavigate();
  const loyaltyTier = user && user.role === 'client' ? getLoyaltyTierForUser(user) : null;
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState((user?.fullName || user?.full_name || '').split(' ')[0] || '');
  const [lastName, setLastName] = useState((user?.fullName || user?.full_name || '').split(' ').slice(1).join(' ') || '');
  const [cedula, setCedula] = useState(user?.cedula || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [editMode, setEditMode] = useState(user?.first_login === true);
  const [loading, setLoading] = useState(false);

  // Snackbar state
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Para restaurar valores si se cancela edición
  const [originalProfile, setOriginalProfile] = useState({
    email: user?.email || '',
    firstName: (user?.fullName || user?.full_name || '').split(' ')[0] || '',
    lastName: (user?.fullName || user?.full_name || '').split(' ').slice(1).join(' ') || '',
    cedula: user?.cedula || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleEdit = () => {
    setEditMode(true);
    setOriginalProfile({
      email,
      firstName,
      lastName,
      cedula,
      phone,
      address
    });
  };

  const handleCancel = () => {
    setEditMode(false);
    setEmail(originalProfile.email);
    setFirstName(originalProfile.firstName);
    setLastName(originalProfile.lastName);
    setCedula(originalProfile.cedula);
    setPhone(originalProfile.phone);
    setAddress(originalProfile.address);
  };

  const handleSave = async () => {
    if (!user?.id) {
      setSnackbarMessage('No se encontró el usuario.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    // Validar teléfono: no debe ser solo 1s
    const cleanedPhone = phone.replace(/\D/g, '');
    if (/^1+$/.test(cleanedPhone)) {
      setSnackbarMessage('El número de teléfono no es válido.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    // Validar cédula única
    const { data: cedulaExists, error: cedulaError } = await import('../../services/supabase').then(({ supabase }) =>
      supabase.from('users').select('id').eq('cedula', cedula).neq('id', user.id)
    );
    if (cedulaError) {
      setSnackbarMessage('Error al validar la cédula.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    if (cedulaExists && cedulaExists.length > 0) {
      setSnackbarMessage('La cédula ya está registrada en otro usuario.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    const full_name = `${firstName} ${lastName}`.trim();
    try {
      const { error } = await import('../../services/supabase').then(({ supabase }) =>
        supabase.from('users').update({
          email,
          full_name,
          cedula,
          phone,
          address,
          last_profile_update: new Date().toISOString()
        }).eq('id', user.id)
      );
      if (error) {
        setSnackbarMessage('Error al guardar el perfil: ' + error.message);
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      } else {
        // Actualizar first_login a false
        await import('../../services/supabase').then(({ supabase }) =>
          supabase.from('users').update({ first_login: false }).eq('id', user.id)
        );
        // Obtener los datos actualizados y guardarlos en localStorage
        const { data: updatedUser, error: fetchError } = await import('../../services/supabase').then(({ supabase }) =>
          supabase.from('users').select('*').eq('id', user.id).single()
        );
        if (!fetchError && updatedUser) {
          localStorage.setItem('mk_auth', JSON.stringify({ ...updatedUser, first_login: false }));
          setUsername(updatedUser.username || '');
          setEmail(updatedUser.email || '');
          const nameParts = (updatedUser.full_name || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setCedula(updatedUser.cedula || '');
          setPhone(updatedUser.phone || '');
          setAddress(updatedUser.address || '');
        }
        setSnackbarMessage('Perfil guardado exitosamente');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        setEditMode(false); // Permitir navegación
      }
    } catch (e) {
      setSnackbarMessage('Error inesperado al guardar el perfil');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };


  const handleLogout = () => {
    // Usa el mismo handler que la navbar
    window.location.replace('/login');
    if (typeof auth.logout === 'function') auth.logout();
  };

  return (
    <>
      <Navigation title="Mi Perfil" />
      {/* HEADER MODERNO CON GRADIENTE Y AVATAR DESTACADO */}
      <Box sx={{
        width: '100%',
        minHeight: 220,
        background: 'linear-gradient(90deg, #E31C79 0%, #5F72BE 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pb: 8
      }}>
        <Box sx={{ position: 'relative', mt: 4 }}>
          <Avatar
            sx={{
              width: 110,
              height: 110,
              border: '5px solid #fff',
              boxShadow: 4,
              fontSize: 48,
              bgcolor: '#fff',
              color: '#E31C79',
              zIndex: 2
            }}
          >
            {firstName.charAt(0).toUpperCase()}
          </Avatar>
          {loyaltyTier && (
            <Tooltip title={loyaltyTier.description} arrow>
              <Chip
                label={loyaltyTier.name}
                icon={loyaltyTier.icon()}
                onClick={() => navigate('/fidelidad')}
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: -8,
                  bgcolor: loyaltyTier.color,
                  color: '#fff',
                  fontWeight: 'bold',
                  boxShadow: 3,
                  '& .MuiChip-icon': { color: '#fff' },
                  zIndex: 3
                }}
                clickable
              />
            </Tooltip>
          )}
        </Box>
        <Typography variant="h4" fontWeight="bold" color="#fff" sx={{ mt: 2, textShadow: '0 2px 8px #0002' }}>{firstName} {lastName}</Typography>
        <Typography variant="subtitle1" color="#fff9" sx={{ mb: 1 }}>{username}</Typography>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -10, mb: 4, position: 'relative', zIndex: 2 }}>
        {/* ALERTA DE PRIMER LOGIN */}
        {user?.first_login && !editMode && (
          <Alert severity="warning" sx={{ mb: 3, fontWeight: 'bold' }}>
            No puedes utilizar la plataforma hasta no actualizar tus datos.
          </Alert>
        )}
        {/* TARJETA DE NIVEL DE LEALTAD MODERNA */}
        {loyaltyTier && (
          <Card sx={{
            mb: 4,
            p: 3,
            borderRadius: 4,
            boxShadow: 6,
            bgcolor: loyaltyTier.color + '22',
            border: `2px solid ${loyaltyTier.color}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'visible'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color: loyaltyTier.color, fontSize: 32 }}>{loyaltyTier.icon()}</Box>
              <Typography variant="h6" fontWeight="bold" color={loyaltyTier.color}>{loyaltyTier.name}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>{loyaltyTier.description}</Typography>
            {/* Barra de progreso hacia el siguiente nivel */}
            <Box sx={{ width: '100%', mt: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Progreso</Typography>
                <Button size="small" variant="outlined" sx={{ ml: 1, borderColor: loyaltyTier.color, color: loyaltyTier.color }} onClick={() => navigate('/fidelidad')}>Ver Beneficios</Button>
              </Box>
              {/* Simulación de progreso: 70% hacia el siguiente nivel */}
              <Box sx={{ width: '100%', height: 10, bgcolor: '#fff', borderRadius: 5, overflow: 'hidden', boxShadow: 1 }}>
                <Box sx={{ width: '70%', height: '100%', bgcolor: loyaltyTier.color, borderRadius: 5, transition: 'width 0.6s cubic-bezier(.4,2,.6,1)' }} />
              </Box>
              <Typography variant="caption" color="text.secondary">70% hacia el siguiente nivel</Typography>
            </Box>
          </Card>
        )}

        {/* INFORMACIÓN PERSONAL EN CARDS CON ICONOS */}
        <Card sx={{ p: 3, borderRadius: 4, boxShadow: 3, mb: 4 }}>
          {!editMode ? (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#E31C79', width: 32, height: 32, fontSize: 18 }}>📧</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Correo electrónico</Typography>
                  <Typography variant="body1">{email}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#5F72BE', width: 32, height: 32, fontSize: 18 }}>🆔</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Cédula</Typography>
                  <Typography variant="body1">{formatCedula(cedula)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4CAF50', width: 32, height: 32, fontSize: 18 }}>📱</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Teléfono</Typography>
                  <Typography variant="body1">🇩🇴 {formatPhoneRD(phone)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#FF9800', width: 32, height: 32, fontSize: 18 }}>🏠</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Dirección o Referencia</Typography>
                  <Typography variant="body1">{address}</Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ mt: 3, fontWeight: 'bold' }}
                fullWidth
              >
                Cerrar Sesión
              </Button>
            </Stack>
          ) : (
            <Box component="form" noValidate autoComplete="off">
              <TextField
                fullWidth
                label="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                type="email"
              />
              <TextField
                fullWidth
                label="Nombre"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Apellido"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                label="Cédula"
                value={formatCedula(cedula)}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setCedula(val);
                }}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 13 }}
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">🆔</InputAdornment> }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                label="Teléfono"
                value={formatPhoneRD(phone)}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(val);
                }}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 16 }}
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">📱</InputAdornment> }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Dirección o Referencia"
                value={address}
                onChange={e => setAddress(e.target.value)}
                sx={{ mb: 2 }}
                multiline
                minRows={2}
              />
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    setLoading(true);
                    await handleSave();
                    setLoading(false);
                    setEditMode(false);
                  }}
                  sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}
                  fullWidth
                  disabled={loading}
                >
                  Guardar
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                  fullWidth
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </Stack>
            </Box>
          )}
        </Card>

        {/* FAB flotante para editar perfil */}
        {!editMode && (
          <Button
            variant="contained"
            color="primary"
            sx={{
              position: 'fixed',
              bottom: { xs: 24, md: 40 },
              right: { xs: 24, md: 80 },
              zIndex: 2000,
              borderRadius: '50%',
              minWidth: 0,
              width: 60,
              height: 60,
              boxShadow: 6,
              background: 'linear-gradient(135deg, #E31C79 40%, #5F72BE 100%)',
              fontSize: 28
            }}
            onClick={handleEdit}
          >
            ✏️
          </Button>
        )}


      </Container>
      {/* Snackbar para feedback visual */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3500}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserProfile; 