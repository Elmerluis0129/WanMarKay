import React, { useEffect, useState } from 'react';
import { Navigation } from './Navigation';
import {
    Container,
    Typography,
    Paper,
    Grid,
    Box,
    Avatar,
    Divider,
    Button,
    IconButton,
    TextField,
    Tooltip,
    CircularProgress,
    Snackbar,
    Alert,
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    Public as PublicIcon,
    Instagram as InstagramIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    PhotoCamera as PhotoCameraIcon,
    Visibility as VisibilityIcon,
    Facebook as FacebookIcon,
    WhatsApp as WhatsAppIcon,
    LinkedIn as LinkedInIcon,
    Twitter as TwitterIcon,
    YouTube as YouTubeIcon,
    Telegram as TelegramIcon,
    Pinterest as PinterestIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { aboutMeService, AboutMe } from '../../services/aboutMeService';
import { auth } from '../../services/auth';
import perfil2Image from '../../assest/perfil2.jpg';

const CONTACT_ICONS: Record<string, React.ReactNode> = {
    tel: <PhoneIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    instagram: <InstagramIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    web: <PublicIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    email: <EmailIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    direccion: <LocationIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    facebook: <FacebookIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    whatsapp: <WhatsAppIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    linkedin: <LinkedInIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    twitter: <TwitterIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    tiktok: <span role="img" aria-label="TikTok">🎵</span>,
    youtube: <YouTubeIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    telegram: <TelegramIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
    otra: <span role="img" aria-label="Otra red social">🌐</span>,
    alternativo: <span role="img" aria-label="Número alternativo">📱</span>,
    skype: <span role="img" aria-label="Skype">📞</span>,
    calendly: <span role="img" aria-label="Calendly">📅</span>,
    snapchat: <span role="img" aria-label="Snapchat">👻</span>,
    pinterest: <PinterestIcon sx={{ color: '#E31C79', fontSize: 32 }} />,
};

export const About: React.FC = () => {
    const [about, setAbout] = useState<AboutMe | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [editData, setEditData] = useState<AboutMe | null>(null);
    const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'}>({open: false, message: '', severity: 'success'});
    const isAdmin = auth.isAdmin();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const [previewCuerpoUrl, setPreviewCuerpoUrl] = useState<string | null>(null);
    const [pendingCuerpoFile, setPendingCuerpoFile] = useState<File | null>(null);
    const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await aboutMeService.getAboutMe();
                setAbout(data);
                setEditData(data);
            } catch (err: any) {
                setSnackbar({open: true, message: err.message || 'Error al cargar información', severity: 'error'});
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleEdit = () => setEditMode(true);
    const handleCancel = () => {
        setEditData(about);
        setEditMode(false);
    };
    const handleSave = async () => {
        if (!editData) return;
        try {
            setLoading(true);
            let updates = { ...editData };
            // Si hay una nueva imagen de logo, conviértela a base64 y guárdala
            if (pendingLogoFile) {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    updates.logo_url = ev.target?.result as string;
                    // Si también hay imagen de perfil o cuerpo, procesa aquí igual que antes
                    // (puedes anidar los FileReader si es necesario)
                    // Finalmente:
                    const updated = await aboutMeService.updateAboutMe(editData.id, updates);
                    setAbout(updated);
                    setEditData(updated);
                    setEditMode(false);
                    setPendingLogoFile(null);
                    setPreviewLogoUrl(null);
                    setPendingImageFile(null);
                    setPreviewUrl(null);
                    setPendingCuerpoFile(null);
                    setPreviewCuerpoUrl(null);
                    setSnackbar({open: true, message: 'Información actualizada', severity: 'success'});
                    setLoading(false);
                };
                reader.readAsDataURL(pendingLogoFile);
                return;
            }
            // Si hay una nueva imagen, conviértela a base64 y guárdala
            if (pendingImageFile) {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    updates.imagen_url = ev.target?.result as string;
                    // Si también hay imagen cuerpo completo
                    if (pendingCuerpoFile) {
                        const reader2 = new FileReader();
                        reader2.onload = async (ev2) => {
                            updates.imagen_cuerpo_completo_url = ev2.target?.result as string;
                            const updated = await aboutMeService.updateAboutMe(editData.id, updates);
                            setAbout(updated);
                            setEditData(updated);
                            setEditMode(false);
                            setPendingImageFile(null);
                            setPreviewUrl(null);
                            setPendingCuerpoFile(null);
                            setPreviewCuerpoUrl(null);
                            setSnackbar({open: true, message: 'Información actualizada', severity: 'success'});
                            setLoading(false);
                        };
                        reader2.readAsDataURL(pendingCuerpoFile);
                        return;
                    }
                    const updated = await aboutMeService.updateAboutMe(editData.id, updates);
                    setAbout(updated);
                    setEditData(updated);
                    setEditMode(false);
                    setPendingImageFile(null);
                    setPreviewUrl(null);
                    setPendingCuerpoFile(null);
                    setPreviewCuerpoUrl(null);
                    setSnackbar({open: true, message: 'Información actualizada', severity: 'success'});
                };
                reader.readAsDataURL(pendingImageFile);
                return;
            }
            // Si solo hay imagen cuerpo completo
            if (pendingCuerpoFile) {
                const reader2 = new FileReader();
                reader2.onload = async (ev2) => {
                    updates.imagen_cuerpo_completo_url = ev2.target?.result as string;
                    const updated = await aboutMeService.updateAboutMe(editData.id, updates);
                    setAbout(updated);
                    setEditData(updated);
                    setEditMode(false);
                    setPendingCuerpoFile(null);
                    setPreviewCuerpoUrl(null);
                    setSnackbar({open: true, message: 'Información actualizada', severity: 'success'});
                    setLoading(false);
                };
                reader2.readAsDataURL(pendingCuerpoFile);
                return;
            }
            const updated = await aboutMeService.updateAboutMe(editData.id, updates);
            setAbout(updated);
            setEditData(updated);
            setEditMode(false);
            setPendingImageFile(null);
            setPreviewUrl(null);
            setPendingCuerpoFile(null);
            setPreviewCuerpoUrl(null);
            setSnackbar({open: true, message: 'Información actualizada', severity: 'success'});
        } catch (err: any) {
            setSnackbar({open: true, message: err.message || 'Error al guardar', severity: 'error'});
        } finally {
            setLoading(false);
        }
    };
    // Cambiar imagen: previsualización local y guardar el archivo para convertirlo a base64 al guardar
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editData) {
            setPendingImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    // Cambiar imagen cuerpo completo: previsualización local y guardar el archivo para convertirlo a base64 al guardar
    const handleCuerpoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editData) {
            setPendingCuerpoFile(file);
            setPreviewCuerpoUrl(URL.createObjectURL(file));
        }
    };
    // Editar contactos
    const handleContactChange = (idx: number, value: string) => {
        if (!editData) return;
        const newContacts = [...editData.contactos];
        newContacts[idx].valor = value;
        setEditData({ ...editData, contactos: newContacts });
    };
    const handleContactTypeChange = (idx: number, tipo: string) => {
        if (!editData) return;
        const newContacts = [...editData.contactos];
        newContacts[idx].tipo = tipo;
        setEditData({ ...editData, contactos: newContacts });
    };
    const handleAddContact = () => {
        if (!editData) return;
        setEditData({ ...editData, contactos: [...editData.contactos, { tipo: 'tel', valor: '' }] });
    };
    const handleDeleteContact = (idx: number) => {
        if (!editData) return;
        const newContacts = editData.contactos.filter((_: any, i: number) => i !== idx);
        setEditData({ ...editData, contactos: newContacts });
    };
    // Editar campos generales
    const handleFieldChange = (field: keyof AboutMe, value: string) => {
        if (!editData) return;
        setEditData({ ...editData, [field]: value });
    };
    // Handler para cambiar el logo grande
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingLogoFile(file);
            setPreviewLogoUrl(URL.createObjectURL(file));
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
    }
    if (!about) {
        return <Alert severity="error">No se encontró información de "Sobre Wanda".</Alert>;
    }

    return (
        <>
            <Navigation />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Botones de Vista Previa y Edición */}
                {isAdmin && !isPreviewMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                        {editMode && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<VisibilityIcon />}
                                onClick={() => setIsPreviewMode(true)}
                            >
                                Vista Previa
                            </Button>
                        )}
                        {!editMode && (
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={handleEdit}
                            >
                                Editar
                            </Button>
                        )}
                    </Box>
                )}
                {isPreviewMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<EditIcon />}
                            onClick={() => setIsPreviewMode(false)}
                        >
                            Volver a Edición
                        </Button>
                    </Box>
                )}
                {editMode && !isPreviewMode && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            sx={{ mx: 1 }}
                        >
                            Guardar
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            sx={{ mx: 1 }}
                        >
                            Cancelar
                        </Button>
                    </Box>
                )}
                {/* Logo grande y bonito */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4, position: 'relative' }}>
                    <Box
                        component="img"
                        src={previewLogoUrl || (isPreviewMode ? (editData?.logo_url || about.logo_url) : (editMode ? editData?.logo_url : about.logo_url)) || ''}
                        alt="Mary Kay Logo Grande"
                        sx={{
                            width: { xs: 120, sm: 180, md: 220 },
                            height: 'auto',
                            borderRadius: '50%',
                            boxShadow: '0 4px 32px rgba(227,28,121,0.18)',
                            border: '6px solid #E31C79',
                            background: '#fff',
                            objectFit: 'contain',
                            display: 'block',
                        }}
                    />
                    {editMode && !isPreviewMode && (
                        <IconButton component="label" sx={{ position: 'absolute', bottom: 8, right: { xs: 16, sm: 32 }, bgcolor: '#fff', boxShadow: 2 }}>
                            <PhotoCameraIcon sx={{ color: '#E31C79' }} />
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                        </IconButton>
                    )}
                </Box>
                <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, color: (theme) => theme.palette.text.primary }}>
                    <Grid container spacing={4} alignItems="stretch">
                        {/* Sección de Wanda (perfil, nombre, descripción) */}
                        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 3, position: 'relative' }}>
                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    <Avatar
                                        src={previewUrl || (isPreviewMode ? (editData?.imagen_url || about.imagen_url) : (editMode ? editData?.imagen_url : about.imagen_url))}
                                        alt={about.nombre}
                                        sx={{ width: 120, height: 120, border: '4px solid #E31C79', boxShadow: '0 2px 12px rgba(227,28,121,0.10)' }}
                                    />
                                    {editMode && !isPreviewMode && (
                                        <IconButton component="label" sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: '#fff', boxShadow: 2 }}>
                                            <PhotoCameraIcon sx={{ color: '#E31C79' }} />
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                                        </IconButton>
                                    )}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    {editMode && !isPreviewMode ? (
                                        <TextField
                                            label="Nombre"
                                            value={editData?.nombre || ''}
                                            onChange={e => handleFieldChange('nombre', e.target.value)}
                                            fullWidth
                                            sx={{ mb: 2 }}
                                        />
                                    ) : (
                                        <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ fontWeight: 700 }}>
                                            {isPreviewMode ? (editData?.nombre || about.nombre) : about.nombre}
                                        </Typography>
                                    )}
                                    {editMode && !isPreviewMode ? (
                                        <TextField
                                            label="Título"
                                            value={editData?.titulo || ''}
                                            onChange={e => handleFieldChange('titulo', e.target.value)}
                                            fullWidth
                                            sx={{ mb: 2 }}
                                        />
                                    ) : (
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            {isPreviewMode ? (editData?.titulo || about.titulo) : about.titulo}
                                        </Typography>
                                    )}
                                    {editMode && !isPreviewMode ? (
                                        <TextField
                                            label="Descripción"
                                            value={editData?.descripcion || ''}
                                            onChange={e => handleFieldChange('descripcion', e.target.value)}
                                            fullWidth
                                            multiline
                                            minRows={4}
                                            sx={{ mb: 2 }}
                                        />
                                    ) : (
                                        <Typography variant="body1" paragraph sx={{ textAlign: 'justify', color: 'inherit' }}>
                                            {isPreviewMode ? (editData?.descripcion || about.descripcion) : about.descripcion}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                        {/* Sección de Mary Kay + Imagen cuerpo completo */}
                        <Grid item xs={12} md={6}>
                            <Grid container spacing={0} alignItems="center">
                                {/* Sobre Mary Kay */}
                                <Grid item xs={12} md={7}>
                                    <Box sx={{
                                        backgroundColor: (theme) => theme.palette.background.paper,
                                        borderRadius: 2,
                                        p: 3,
                                        height: '100%',
                                        color: (theme) => theme.palette.text.primary,
                                    }}>
                                        {editMode && !isPreviewMode ? (
                                            <TextField
                                                label="Sobre Mary Kay"
                                                value={editData?.seccion_marykay || ''}
                                                onChange={e => handleFieldChange('seccion_marykay', e.target.value)}
                                                fullWidth
                                                multiline
                                                minRows={7}
                                                sx={{ mb: 2 }}
                                                InputProps={{
                                                    style: { color: 'inherit' }
                                                }}
                                                InputLabelProps={{
                                                    style: { color: 'inherit' }
                                                }}
                                            />
                                        ) : (
                                            <>
                                                <Typography variant="h5" component="h2" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                                                    Sobre Mary Kay
                                                </Typography>
                                                <Typography variant="body1" paragraph sx={{ textAlign: 'justify', color: 'inherit' }}>
                                                    {isPreviewMode ? (editData?.seccion_marykay || about.seccion_marykay) : about.seccion_marykay}
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                </Grid>
                                {/* Imagen cuerpo completo lateral derecho */}
                                <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: { xs: 3, md: 0 } }}>
                                    <Paper elevation={4} sx={{ p: 2, borderRadius: 4, boxShadow: '0 4px 24px rgba(227,28,121,0.10)' }}>
                                        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            <img
                                                src={previewCuerpoUrl || (isPreviewMode ? (editData?.imagen_cuerpo_completo_url || about.imagen_cuerpo_completo_url) : (editMode ? editData?.imagen_cuerpo_completo_url : about.imagen_cuerpo_completo_url)) || perfil2Image}
                                                alt="Wanda cuerpo completo"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '80vh',
                                                    width: 'auto',
                                                    height: 'auto',
                                                    borderRadius: 16,
                                                    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                                                    display: 'block',
                                                    margin: '0 auto',
                                                }}
                                            />
                                            {editMode && !isPreviewMode && (
                                                <IconButton component="label" sx={{ position: 'absolute', bottom: 16, right: 16, bgcolor: '#fff' }}>
                                                    <PhotoCameraIcon sx={{ color: '#E31C79' }} />
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCuerpoImageChange} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Paper>
                {/* Sección de Contacto */}
                <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h5" component="h2" gutterBottom color="primary" align="center">
                        Información de Contacto
                    </Typography>
                    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 3 }}>
                        {editMode && !isPreviewMode ? (
                            <>
                                {editData?.contactos.map((c: any, idx: number) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Tooltip title="Tipo de contacto">
                                            <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
                                                <Select
                                                    value={c.tipo}
                                                    onChange={e => handleContactTypeChange(idx, e.target.value)}
                                                >
                                                    <MenuItem value="tel">Teléfono</MenuItem>
                                                    <MenuItem value="instagram">Instagram</MenuItem>
                                                    <MenuItem value="web">Web</MenuItem>
                                                    <MenuItem value="email">Email</MenuItem>
                                                    <MenuItem value="direccion">Dirección</MenuItem>
                                                    <MenuItem value="facebook">Facebook</MenuItem>
                                                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                                                    <MenuItem value="linkedin">LinkedIn</MenuItem>
                                                    <MenuItem value="twitter">Twitter/X</MenuItem>
                                                    <MenuItem value="tiktok">TikTok</MenuItem>
                                                    <MenuItem value="youtube">YouTube</MenuItem>
                                                    <MenuItem value="telegram">Telegram</MenuItem>
                                                    <MenuItem value="otra">Otra red social</MenuItem>
                                                    <MenuItem value="alternativo">Número alternativo</MenuItem>
                                                    <MenuItem value="skype">Skype</MenuItem>
                                                    <MenuItem value="calendly">Calendly</MenuItem>
                                                    <MenuItem value="snapchat">Snapchat</MenuItem>
                                                    <MenuItem value="pinterest">Pinterest</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Tooltip>
                                        <TextField
                                            value={c.valor}
                                            onChange={e => handleContactChange(idx, e.target.value)}
                                            fullWidth
                                            sx={{ mr: 1 }}
                                        />
                                        <Tooltip title="Eliminar contacto">
                                            <IconButton onClick={() => handleDeleteContact(idx)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ))}
                                <Button startIcon={<AddIcon />} onClick={handleAddContact} sx={{ mt: 1 }}>
                                    Agregar contacto
                                </Button>
                            </>
                        ) : (
                            (isPreviewMode ? (editData?.contactos || about.contactos) : about.contactos).map((c: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.3 + idx * 0.12 }}
                                    style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}
                                >
                                    <Box
                                        sx={{
                                            background: '#fff',
                                            borderRadius: '50%',
                                            width: 56,
                                            height: 56,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            mr: 2,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'scale(1.12)',
                                                boxShadow: '0 4px 16px rgba(227,28,121,0.15)'
                                            }
                                        }}
                                    >
                                        {CONTACT_ICONS[c.tipo] || <PublicIcon sx={{ color: '#E31C79', fontSize: 32 }} />}
                                    </Box>
                                    <Box
                                        sx={{
                                            background: '#EF5DA8',
                                            borderRadius: 99,
                                            px: 3,
                                            py: 1.2,
                                            flex: 1
                                        }}
                                    >
                                        <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 400 }}>
                                            {c.tipo === 'web' ? (
                                                <a href={`https://${c.valor.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>{c.valor}</a>
                                            ) : c.valor}
                                        </Typography>
                                    </Box>
                                </motion.div>
                            ))
                        )}
                    </Box>
                </Grid>
            </Container>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default About; 