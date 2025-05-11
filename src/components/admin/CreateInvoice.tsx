import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    FormControlLabel,
    Checkbox,
    Radio,
    RadioGroup,
    Autocomplete,
    Alert,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Snackbar,
    Alert as MuiAlert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceItem, PaymentPlan, User } from '../../types';
import { userService } from '../../services/userService';
import { invoiceService } from '../../services/invoiceService';
import { auth } from '../../services/auth';
import { storageService } from '../../services/storageService';
import { Navigation } from '../shared/Navigation';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import InputMask from 'react-input-mask';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Helper para formatear la cédula con guiones: 000-0000000-0
const formatCedula = (value: string = ''): string => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11
        ? `${digits.slice(0,3)}-${digits.slice(3,10)}-${digits.slice(10)}`
        : value;
};

// Helper para formatear el teléfono: +1 (000) 000-0000 o (000) 000-0000
const formatPhone = (value: string = ''): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return value;
};

// Helper para formatear fecha a DD/MM/YYYY para input
const formatDateInput = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

export const CreateInvoice: React.FC = () => {
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        address: '',
        cedula: '',
        phone: ''
    });

    // Estados para descuento
    const [applyDiscount, setApplyDiscount] = useState<boolean>(false);
    const [discountType, setDiscountType] = useState<'percentage'|'amount'>('percentage');
    const [discountValue, setDiscountValue] = useState<number>(0);

    const [availableClients, setAvailableClients] = useState<User[]>([]);
    const [selectedClient, setSelectedClient] = useState<User | null>(null);

    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [newItem, setNewItem] = useState<InvoiceItem>({
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
    });

    const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
    const [paymentPlan, setPaymentPlan] = useState<Partial<PaymentPlan>>({
        frequency: 'biweekly',
        totalInstallments: 1,
        installmentAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
    });

    // Feedback con Snackbar
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success'|'error'>('success');

    // Estado para imagen adjunta y su preview
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

    // Estado para diálogo de confirmación si no hay imagen
    const [openNoImageDialog, setOpenNoImageDialog] = useState<boolean>(false);

    const [invoiceNumberError, setInvoiceNumberError] = useState<string>('');

    // Autocompletar datos de address, cédula y teléfono al cambiar cliente
    useEffect(() => {
        if (selectedClient) {
            setFormData(prev => ({
                ...prev,
                address: selectedClient.address || '',
                cedula: selectedClient.cedula || '',
                phone: selectedClient.phone || ''
            }));
        }
    }, [selectedClient]);

    // Handler para el input file
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log('🖼️ Archivo seleccionado:', file.name, file.type, file.size, file);
        }
        if (file) {
            setAttachmentFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setAttachmentPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Cargar la lista de clientes al montar el componente
    useEffect(() => {
        (async () => {
            const users = await userService.getUsers();
            const clients = users.filter(u => u.role === 'client');
            setAvailableClients(clients);
        })();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaymentType(e.target.value as 'cash' | 'credit');
    };

    const handlePaymentPlanChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        setPaymentPlan((prev: Partial<PaymentPlan>) => {
            const updated = { ...prev, [name]: value };
            if (name === 'totalInstallments' || name === 'frequency') {
                const total = calculateTotal().total;
                updated.installmentAmount = total / Number(updated.totalInstallments || 1);
            }
            return updated;
        });
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const updatedItem = {
            ...newItem,
            [name]: name === 'description' ? value : Number(value)
        };

        if (name === 'quantity' || name === 'unitPrice') {
            const quantity = name === 'quantity' ? Number(value) : Number(newItem.quantity);
            const unitPrice = name === 'unitPrice' ? Number(value) : Number(newItem.unitPrice);
            updatedItem.total = quantity * unitPrice;
        }

        setNewItem(updatedItem as InvoiceItem);
    };

    const addItem = () => {
        if (newItem.description && newItem.quantity > 0 && newItem.unitPrice > 0) {
            setItems([...items, { ...newItem }]);
            setNewItem({
                description: '',
                quantity: 1,
                unitPrice: 0,
                total: 0,
            });
        }
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        let discountAmt = 0;
        if (applyDiscount) {
            if (discountType === 'percentage') {
                discountAmt = subtotal * (discountValue / 100);
            } else {
                discountAmt = discountValue;
            }
            // No superar el subtotal
            discountAmt = Math.min(discountAmt, subtotal);
        }
        const total = subtotal - discountAmt;
        return { subtotal, discountAmt, total };
    };

    const saveInvoice = async () => {
        try {
            // La fecha ya viene en ISO YYYY-MM-DD desde el input nativo
            const isoDate = formData.date;
            // Generar ID y subir imagen si existe
            const id = uuidv4();
            let publicUrl: string | undefined;
            if (attachmentFile) {
                // Subir el archivo a Imgur y obtener la URL pública corta
                publicUrl = await storageService.uploadFacturaImage(attachmentFile);
            }
            const { subtotal, total } = calculateTotal();
            const currentUser = auth.getCurrentUser();
            const startDate = new Date(paymentPlan.startDate || new Date());
            let nextPaymentDate = new Date(startDate);
            switch (paymentPlan.frequency) {
                case 'weekly': nextPaymentDate.setDate(startDate.getDate() + 7); break;
                case 'biweekly': nextPaymentDate.setDate(startDate.getDate() + 14); break;
                case 'monthly': nextPaymentDate.setMonth(startDate.getMonth() + 1); break;
                default: nextPaymentDate.setMonth(startDate.getMonth() + 1);
            }
            const today = new Date();
            const diffDays = Math.ceil((nextPaymentDate.getTime() - today.getTime())/(1000*60*60*24));
            const initialStatus = diffDays < 0 ? 'delayed' : 'on_time';
            const newInvoice: Invoice = {
                id,
                invoiceNumber: formData.invoiceNumber,
                date: isoDate,
                clientName: selectedClient!.fullName,
                clientId: selectedClient!.id,
                address: formData.address || undefined,
                cedula: formData.cedula || undefined,
                phone: formData.phone || undefined,
                ...(publicUrl && { attachment: publicUrl }),
                items, subtotal, total,
                remainingAmount: total,
                status: initialStatus,
                paymentType,
                discountPercentage: discountType === 'percentage' ? discountValue : (discountValue / total * 100),
                lateFeePercentage: 0,
                payments: [],
                ...(paymentType === 'credit' && { paymentPlan: { ...paymentPlan, paidInstallments: 0, startDate: startDate.toISOString(), nextPaymentDate: nextPaymentDate.toISOString() } as PaymentPlan })
            };
            // Actualiza datos del usuario si alguno de sus campos estaba vacío en la base de datos
            if (selectedClient) {
                const updates: Partial<User> = {};
                if (!selectedClient.address && formData.address) updates.address = formData.address;
                if (!selectedClient.cedula && formData.cedula) {
                    updates.cedula = formData.cedula.replace(/-/g, '');
                }
                if (!selectedClient.phone && formData.phone) {
                    updates.phone = formData.phone.replace(/\D/g, '');
                }
                if (Object.keys(updates).length > 0) {
                    await userService.updateUser({ ...selectedClient, ...updates });
                }
            }
            // Debug: mostrar en consola el objeto que se insertará
            console.log('📤 Payload de nueva factura:', {
                id: newInvoice.id,
                invoice_number: newInvoice.invoiceNumber,
                date: newInvoice.date,
                client_id: newInvoice.clientId,
                client_name: newInvoice.clientName,
                address: newInvoice.address,
                cedula: newInvoice.cedula,
                phone: newInvoice.phone,
                attachment: publicUrl,
                items: newInvoice.items,
                subtotal: newInvoice.subtotal,
                total: newInvoice.total,
                remaining_amount: newInvoice.remainingAmount,
                status: newInvoice.status,
                payment_type: newInvoice.paymentType,
                payment_plan: newInvoice.paymentPlan,
                next_payment_due: newInvoice.paymentPlan?.nextPaymentDate
            });
            await invoiceService.addInvoice(newInvoice);
            setSnackbarMessage('Factura creada exitosamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            // reset form
            setFormData({ invoiceNumber:'', date:new Date().toISOString().split('T')[0], address:'', cedula:'', phone:'' });
            setSelectedClient(null); setItems([]); setPaymentType('cash');
            setPaymentPlan({ frequency:'biweekly', totalInstallments:1, installmentAmount:0, startDate:new Date().toISOString().split('T')[0]});
            setAttachmentFile(null); setAttachmentPreview(null);
        } catch (error: any) {
            console.error('Error creando factura', error);
            const msg = error?.message || JSON.stringify(error);
            setSnackbarMessage(`Error creando factura: ${msg}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.cedula) { 
                setSnackbarMessage('La cédula es obligatoria'); setSnackbarSeverity('error'); setSnackbarOpen(true);
                return;
            }
            if (!formData.phone) { 
                setSnackbarMessage('El teléfono es obligatorio'); setSnackbarSeverity('error'); setSnackbarOpen(true);
                return;
            }
            if (items.length === 0) { 
                setSnackbarMessage('Debe agregar al menos un producto'); setSnackbarSeverity('error'); setSnackbarOpen(true);
                return;
            }
            if (!formData.invoiceNumber) { 
                setSnackbarMessage('El número de factura es obligatorio'); setSnackbarSeverity('error'); setSnackbarOpen(true);
                return;
            }
            if (!selectedClient) { 
                setSnackbarMessage('Por favor seleccione un cliente'); setSnackbarSeverity('error'); setSnackbarOpen(true);
                return;
            }
            if (!attachmentPreview) {
                setOpenNoImageDialog(true);
                return;
            }
            await saveInvoice();
        } catch (error: any) {
            console.error('Error al crear factura', error);
            const msg = error?.message || JSON.stringify(error);
            setSnackbarMessage(`Error al crear factura: ${msg}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const totals = calculateTotal();

    const confirmWithoutImage = async () => {
        setOpenNoImageDialog(false);
        try {
            await saveInvoice();
        } catch (error: any) {
            console.error('Error creando factura sin imagen', error);
            const msg = error?.message || JSON.stringify(error);
            setSnackbarMessage(`Error creando factura: ${msg}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Validar en tiempo real si el número de factura ya existe
    useEffect(() => {
        (async () => {
            const num = formData.invoiceNumber.trim();
            if (!num) {
                setInvoiceNumberError('');
                return;
            }
            try {
                const all = await invoiceService.getInvoices();
                const exists = all.some(inv => inv.invoiceNumber === num);
                setInvoiceNumberError(exists ? 'Número de factura ya existe. Elija otro.' : '');
            } catch (err) {
                console.error('Error validando número de factura', err);
            }
        })();
    }, [formData.invoiceNumber]);

    return (
        <>
            <Navigation title="Crear Nueva Factura" />
            <Container maxWidth="md">
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Paper elevation={3} sx={{ p: 4, backgroundColor: '#fff' }}>
                        <Typography variant="h5" sx={{ color: '#E31C79', mb: 3 }}>
                            Crear Nueva Factura
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3 }}>
                            Nota: Para crear una factura, el cliente debe estar registrado previamente en el sistema. 
                            Si el cliente no existe, por favor créelo primero en la sección "Crear Usuario".
                        </Alert>

                        <Box component="form" onSubmit={handleSubmit}>
                            {/* Solo No. Factura, los datos del cliente se autocompletan */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="No. Factura"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        onChange={handleChange}
                                        required
                                        error={Boolean(invoiceNumberError)}
                                        helperText={invoiceNumberError}
                                        InputProps={{
                                            endAdornment: (
                                                formData.invoiceNumber.trim() && !invoiceNumberError ? (
                                                    <InputAdornment position="end">
                                                        <CheckCircleIcon color="success" />
                                                    </InputAdornment>
                                                ) : undefined
                                            )
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        value={selectedClient}
                                        onChange={(_, newValue: User | null) => setSelectedClient(newValue)}
                                        options={availableClients}
                                        getOptionLabel={opt => opt.fullName}
                                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                        filterOptions={(options, { inputValue }) =>
                                            options.filter(o =>
                                                o.fullName.toLowerCase().includes(inputValue.toLowerCase())
                                            )
                                        }
                                        renderInput={params => (
                                            <TextField
                                                {...params}
                                                label="Buscar Cliente"
                                                required
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <SearchIcon color="action" sx={{ mr: 1 }} />
                                                    )
                                                }}
                                            />
                                        )}
                                    />
                                </FormControl>
                                <TextField
                                    fullWidth
                                    required
                                    type="date"
                                    name="date"
                                    label="Fecha"
                                    value={formData.date}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ lang: 'es-ES' }}
                                />
                            </Box>

                            {/* Mostrar datos del cliente seleccionado */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Dirección/Referencia"
                                        value={formData.address}
                                        disabled
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    {selectedClient?.cedula ? (
                                        <TextField
                                            fullWidth
                                            label="Cédula"
                                            value={formatCedula(formData.cedula)}
                                            disabled
                                        />
                                    ) : (
                                        <InputMask
                                            mask="999-9999999-9"
                                            value={formData.cedula}
                                            onChange={handleChange}
                                            maskChar=""
                                        >
                                            {(maskProps: any) => (
                                                <TextField
                                                    {...maskProps}
                                                    fullWidth
                                                    name="cedula"
                                                    label="Cédula"
                                                    required
                                                />
                                            )}
                                        </InputMask>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Teléfono"
                                        value={formatPhone(formData.phone)}
                                        disabled
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        component="label"
                                        sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}
                                    >
                                        Subir Imagen de Factura
                                        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                    </Button>
                                    {attachmentPreview && (
                                        <Box
                                            component="img"
                                            src={attachmentPreview}
                                            alt="Previsualización de factura"
                                            sx={{ mt: 2, maxWidth: '100%', maxHeight: 200 }}
                                        />
                                    )}
                                </Grid>
                            </Grid>

                            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                Productos
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    name="description"
                                    label="Descripción"
                                    value={newItem.description}
                                    onChange={handleItemChange}
                                />
                                <TextField
                                    type="number"
                                    name="quantity"
                                    label="Cantidad"
                                    value={newItem.quantity}
                                    onFocus={e => (e.target as HTMLInputElement).select()}
                                    onChange={handleItemChange}
                                    sx={{ width: '150px' }}
                                />
                                <TextField
                                    type="number"
                                    name="unitPrice"
                                    label="Precio Unitario"
                                    value={newItem.unitPrice}
                                    onFocus={e => (e.target as HTMLInputElement).select()}
                                    onChange={handleItemChange}
                                    sx={{ width: '150px' }}
                                />
                                <IconButton 
                                    onClick={addItem}
                                    sx={{ 
                                        backgroundColor: '#E31C79',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: '#C4156A',
                                        },
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Descripción</TableCell>
                                            <TableCell align="right">Cantidad</TableCell>
                                            <TableCell align="right">Precio Unit.</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                            <TableCell align="center">Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell align="right">{item.quantity}</TableCell>
                                                <TableCell align="right">
                                                    RD$ {item.unitPrice.toFixed(2)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    RD$ {item.total.toFixed(2)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton 
                                                        onClick={() => removeItem(index)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Sección de Descuento */}
                            <Box sx={{ mt: 3, mb: 3 }}>
                                <Typography variant="h6">Descuento</Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={applyDiscount}
                                            onChange={e => setApplyDiscount(e.target.checked)}
                                        />
                                    }
                                    label="Aplicar descuento"
                                />
                                {applyDiscount && (
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                                        <RadioGroup
                                            row
                                            name="discountType"
                                            value={discountType}
                                            onChange={e => setDiscountType(e.target.value as 'percentage'|'amount')}
                                        >
                                            <FormControlLabel value="percentage" control={<Radio />} label="%" />
                                            <FormControlLabel value="amount" control={<Radio />} label="RD$" />
                                        </RadioGroup>
                                        <TextField
                                            type="number"
                                            label={discountType === 'percentage' ? '% de descuento' : 'Monto de descuento'}
                                            value={discountValue}
                                            onFocus={e => (e.target as HTMLInputElement).select()}
                                            onChange={e => setDiscountValue(Number(e.target.value))}
                                            sx={{ width: 150 }}
                                        />
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ mt: 4, mb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Forma de Pago
                                </Typography>
                                <RadioGroup
                                    row
                                    name="paymentType"
                                    value={paymentType}
                                    onChange={handlePaymentTypeChange}
                                >
                                    <FormControlLabel 
                                        value="cash" 
                                        control={<Radio />} 
                                        label="Contado" 
                                    />
                                    <FormControlLabel 
                                        value="credit" 
                                        control={<Radio />} 
                                        label="Crédito" 
                                    />
                                </RadioGroup>
                            </Box>

                            {paymentType === 'credit' && (
                                <Box sx={{ mt: 2, mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                        Plan de Pago
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <FormControl sx={{ minWidth: 200 }}>
                                            <InputLabel>Frecuencia de Pago</InputLabel>
                                            <Select
                                                name="frequency"
                                                value={paymentPlan.frequency}
                                                label="Frecuencia de Pago"
                                                onChange={handlePaymentPlanChange}
                                            >
                                                <MenuItem value="biweekly">Quincenal</MenuItem>
                                                <MenuItem value="monthly">Mensual</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            type="number"
                                            name="totalInstallments"
                                            label="Número de Pagos"
                                            value={paymentPlan.totalInstallments}
                                            onFocus={e => (e.target as HTMLInputElement).select()}
                                            onChange={handlePaymentPlanChange}
                                            sx={{ width: 150 }}
                                        />
                                        <TextField
                                            type="date"
                                            name="startDate"
                                            label="Fecha de Inicio"
                                            value={paymentPlan.startDate}
                                            onChange={handlePaymentPlanChange}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                            disabled
                                            label="Monto por Cuota"
                                            value={`RD$ ${(totals.total / (paymentPlan.totalInstallments || 1)).toFixed(2)}`}
                                        />
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ mt: 3, textAlign: 'right' }}>
                                <Typography>
                                    Subtotal: RD$ {totals.subtotal.toFixed(2)}
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#E31C79' }}>
                                    Total: RD$ {totals.total.toFixed(2)}
                                </Typography>
                            </Box>

                            {/* Snackbar de feedback */}
                            <Snackbar
                                open={snackbarOpen}
                                autoHideDuration={3000}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                onClose={() => setSnackbarOpen(false)}
                            >
                                <MuiAlert
                                    onClose={() => setSnackbarOpen(false)}
                                    severity={snackbarSeverity}
                                    elevation={6}
                                    variant="filled"
                                >
                                    {snackbarMessage}
                                </MuiAlert>
                            </Snackbar>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={Boolean(invoiceNumberError)}
                                sx={{
                                    mt: 3,
                                    backgroundColor: '#E31C79',
                                    '&:hover': {
                                        backgroundColor: '#C4156A',
                                    },
                                }}
                            >
                                Crear Factura
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
            <Dialog open={openNoImageDialog} onClose={() => setOpenNoImageDialog(false)}>
                <DialogTitle>¿Crear factura sin imagen?</DialogTitle>
                <DialogContent>
                    <Typography>
                        No ha subido una imagen de la factura. ¿Está seguro que desea continuar sin imagen?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNoImageDialog(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={confirmWithoutImage}>
                        Agregar después. No tengo factura física
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}; 