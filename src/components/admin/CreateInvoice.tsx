import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Grid,
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
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceItem, PaymentPlan, User, PaymentMethod, InvoiceStatus, Payment } from '../../types';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { userService } from '../../services/userService';
import { auth } from '../../services/auth';
import { storageService } from '../../services/storageService';
import { Navigation } from '../shared/Navigation';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import InputMask from 'react-input-mask';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ProductAutocomplete } from '../shared/ProductAutocomplete';

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
        date: '',
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
    
    // Referencia para el campo de descripción
    const descriptionInputRef = useRef<HTMLInputElement>(null);
    
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payments, setPayments] = useState<Array<{
        amount: number;
        date: string;
        method: PaymentMethod;
        reference: string;
    }>>([]);
    const [currentPayment, setCurrentPayment] = useState({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        method: 'cash' as PaymentMethod,
        reference: ''
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
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success'|'error'|'info'>('success');

    const [invoiceNumberError, setInvoiceNumberError] = useState<string>('');

    // Función para limpiar el formulario
    const clearForm = () => {
        setFormData({
            invoiceNumber: '',
            date: new Date().toISOString().split('T')[0],
            address: '',
            cedula: '',
            phone: ''
        });
        setSelectedClient(null);
        setItems([]);
        setNewItem({
            description: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
        });
        setApplyDiscount(false);
        setDiscountType('percentage');
        setDiscountValue(0);
        setPaymentType('cash');
        setPaymentPlan({
            frequency: 'biweekly',
            totalInstallments: 1,
            installmentAmount: 0,
            startDate: new Date().toISOString().split('T')[0],
        });
        setPayments([]);
        setShowPaymentForm(false);
        setCurrentPayment({
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            method: 'cash',
            reference: ''
        });
        
        // Mostrar mensaje de confirmación
        setSnackbarMessage('Formulario limpiado correctamente');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    // Cargar la lista de clientes al montar el componente
    useEffect(() => {
        (async () => {
            try {
                const users = await userService.getUsers();
                const clients = users.filter(u => u.role === 'client');
                setAvailableClients(clients);
            } catch (err: any) {
                console.error('Error cargando clientes:', err);
            }
        })();
    }, []);

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Prevenir el envío del formulario al presionar Enter
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

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
            // Enfocar el campo de descripción después de agregar un ítem
            setTimeout(() => {
                if (descriptionInputRef.current) {
                    descriptionInputRef.current.focus();
                }
            }, 0);
        }
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setEditingItem({...items[index]});
    };

    const saveEdit = () => {
        if (editingIndex === null || !editingItem) return;
        
        const updatedItems = [...items];
        // Recalcular el total
        editingItem.total = editingItem.quantity * editingItem.unitPrice;
        updatedItems[editingIndex] = editingItem;
        
        setItems(updatedItems);
        setEditingIndex(null);
        setEditingItem(null);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditingItem(null);
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
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remaining = total - totalPaid;
        return { subtotal, discountAmt, total, totalPaid, remaining };
    };

    const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newAmount = parseFloat(e.target.value) || 0;
        const { remaining } = calculateTotal();
        
        if (newAmount > remaining) {
            // Si el monto es mayor al pendiente, mostramos un mensaje y ajustamos el valor
            setSnackbarMessage(`Monto ajustado al saldo pendiente de RD$ ${remaining.toFixed(2)}`);
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            
            // Actualizamos el monto al pendiente
            setCurrentPayment({
                ...currentPayment,
                amount: remaining
            });
        } else {
            // Si el monto es válido, lo actualizamos normalmente
            setCurrentPayment({
                ...currentPayment,
                amount: newAmount
            });
        }
    };

    const handleAddPayment = () => {
        if (currentPayment.amount <= 0) {
            setSnackbarMessage('El monto del pago debe ser mayor a 0');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        
        const { remaining } = calculateTotal();
        
        // Verificar nuevamente por si acaso (aunque ya debería estar validado)
        if (currentPayment.amount > remaining) {
            setCurrentPayment({
                ...currentPayment,
                amount: remaining
            });
            return; // No debería llegar aquí si la validación del campo está funcionando
        }
        
        setPayments([...payments, { ...currentPayment }]);
        setCurrentPayment({
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            method: 'cash',
            reference: ''
        });
        setShowPaymentForm(false);
    };

    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const saveInvoice = async () => {
        try {
            // La fecha ya viene en ISO YYYY-MM-DD desde el input nativo
            const isoDate = formData.date;
            const { subtotal, total, remaining } = calculateTotal();
            const currentUser = auth.getCurrentUser();
            const startDate = new Date(isoDate);
            let nextPaymentDate = new Date(startDate);
            
            // Calcular la próxima fecha de pago si es crédito
            if (paymentType === 'credit') {
                switch (paymentPlan.frequency) {
                    case 'weekly': nextPaymentDate.setDate(startDate.getDate() + 7); break;
                    case 'biweekly': nextPaymentDate.setDate(startDate.getDate() + 14); break;
                    case 'monthly': nextPaymentDate.setMonth(startDate.getMonth() + 1); break;
                    default: nextPaymentDate.setMonth(startDate.getMonth() + 1);
                }
            }
            
            const today = new Date();
            const diffDays = paymentType === 'credit' ? 
                Math.ceil((nextPaymentDate.getTime() - today.getTime())/(1000*60*60*24)) : 0;
                
            const initialStatus: InvoiceStatus = diffDays < 0 ? 'delayed' : 'on_time';
            const invoiceId = uuidv4();
            
            // Crear la factura primero
            const newInvoice: Invoice = {
                id: invoiceId,
                invoiceNumber: formData.invoiceNumber,
                date: isoDate,
                clientName: selectedClient!.fullName || selectedClient!.full_name || 'Cliente sin nombre',
                clientId: selectedClient!.id,
                address: formData.address || undefined,
                cedula: formData.cedula || undefined,
                phone: formData.phone || undefined,
                items, 
                subtotal, 
                total,
                remainingAmount: remaining,
                status: remaining <= 0 ? 'paid' : initialStatus,
                paymentType,
                discountPercentage: discountType === 'percentage' ? discountValue : (discountValue / total * 100),
                lateFeePercentage: 0,
                payments: [], // Inicialmente sin pagos
                ...(paymentType === 'credit' && { 
                    paymentPlan: { 
                        ...paymentPlan, 
                        paidInstallments: remaining <= 0 ? 1 : 0, 
                        startDate: startDate.toISOString(), 
                        nextPaymentDate: nextPaymentDate.toISOString() 
                    } as PaymentPlan 
                })
            };

            // 1. Guardar la factura primero
            await invoiceService.addInvoice(newInvoice);
            
            // 2. Si hay pagos, registrarlos uno por uno
            if (payments.length > 0) {
                for (const payment of payments) {
                    const paymentId = uuidv4();
                    const paymentData = {
                        id: paymentId,
                        invoiceId: invoiceId,
                        invoiceNumber: formData.invoiceNumber,
                        date: payment.date,
                        amount: payment.amount,
                        method: payment.method,
                        reference: payment.reference,
                        createdAt: new Date().toISOString(),
                        createdBy: auth.getCurrentUser()?.id || '',
                        createdByName: auth.getCurrentUser()?.fullName || 'Sistema',
                        installmentNumber: 1,
                        lateFeePaid: 0 // No aplicamos mora al crear la factura
                    };
                    
                    // Registrar el pago usando el servicio de pagos
                    await paymentService.registerPayment(invoiceId, {
                        ...paymentData,
                        method: paymentData.method as PaymentMethod,
                        createdAt: paymentData.createdAt,
                        createdBy: paymentData.createdBy,
                        createdByName: paymentData.createdByName,
                        installmentNumber: 1,
                        lateFeePaid: 0
                    });
                }
                
                // Actualizar la factura con el estado correcto
                const updatedInvoice = {
                    ...newInvoice,
                    remainingAmount: remaining,
                    status: (remaining <= 0 ? 'paid' : initialStatus) as InvoiceStatus, // Aseguramos el tipo correcto
                    payments: payments.map(p => ({
                        id: uuidv4(),
                        invoiceId,
                        invoiceNumber: formData.invoiceNumber,
                        date: p.date,
                        amount: p.amount,
                        method: p.method,
                        reference: p.reference,
                        createdAt: new Date().toISOString(),
                        createdBy: auth.getCurrentUser()?.id || '',
                        createdByName: auth.getCurrentUser()?.fullName || 'Sistema',
                        installmentNumber: 1, // Campo requerido
                        lateFeePaid: 0 // Valor por defecto
                    } as Payment)) // Aseguramos que cumpla con la interfaz Payment
                };
                
                await invoiceService.updateInvoice(updatedInvoice);
            }

            // Actualizar datos del usuario si es necesario
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

            // Mostrar mensaje de éxito específico según si hay pagos o no
            if (payments.length > 0) {
                setSnackbarMessage('¡Factura y pagos registrados exitosamente!');
            } else {
                setSnackbarMessage('¡Factura creada exitosamente!');
            }
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            
            // Resetear el formulario
            setFormData({ invoiceNumber: '', date: new Date().toISOString().split('T')[0], address: '', cedula: '', phone: '' });
            setSelectedClient(null);
            setItems([]);
            setPaymentType('cash');
            setPaymentPlan({ frequency: 'biweekly', totalInstallments: 1, installmentAmount: 0, startDate: new Date().toISOString().split('T')[0] });
            setPayments([]); // Limpiar los pagos
            setShowPaymentForm(false);
            
        } catch (error: any) {
            console.error('Error creando factura:', error);
            const msg = error?.message || JSON.stringify(error);
            setSnackbarMessage(`Error al guardar: ${msg}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.cedula) { 
                setSnackbarMessage('La cédula es obligatoria'); 
                setSnackbarSeverity('error'); 
                setSnackbarOpen(true);
                return;
            }
            if (!formData.phone) { 
                setSnackbarMessage('El teléfono es obligatorio'); 
                setSnackbarSeverity('error'); 
                setSnackbarOpen(true);
                return;
            }
            if (items.length === 0) { 
                setSnackbarMessage('Debe agregar al menos un producto'); 
                setSnackbarSeverity('error'); 
                setSnackbarOpen(true);
                return;
            }
            if (!formData.date) { 
                setSnackbarMessage('La fecha es obligatoria'); 
                setSnackbarSeverity('error'); 
                setSnackbarOpen(true);
                return;
            }
            if (!formData.invoiceNumber) { 
                setSnackbarMessage('El número de factura es obligatorio'); 
                setSnackbarSeverity('error'); 
                setSnackbarOpen(true);
                return;
            }
            if (!selectedClient) { 
                setSnackbarMessage('Por favor seleccione un cliente'); 
                setSnackbarSeverity('error'); 
                setSnackbarOpen(true);
                return;
            }
            await saveInvoice();
            // Hacer scroll al inicio del formulario después de guardar exitosamente
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } catch (error: any) {
            console.error('Error al crear factura', error);
            const msg = error?.message || JSON.stringify(error);
            setSnackbarMessage(`Error al crear factura: ${msg}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const totals = calculateTotal();

    // Validar en tiempo real si el número de factura ya existe
    useEffect(() => {
        (async () => {
            const num = formData.invoiceNumber.trim();
            if (!num) {
                setInvoiceNumberError('');
                return;
            }
            try {
                const all = await invoiceService.getAllInvoices();
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
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h5" sx={{ color: '#E31C79', mb: 3 }}>
                            Crear Nueva Factura
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3 }}>
                            Nota: Para crear una factura, el cliente debe estar registrado previamente en el sistema. 
                            Si el cliente no existe, por favor créelo primero en la sección "Crear Usuario".
                        </Alert>

                        <Box 
                            component="form" 
                            onSubmit={handleSubmit}
                            onKeyDown={(e) => {
                                // Prevenir el envío del formulario al presionar Enter
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                }
                            }}
                        >
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
                                        getOptionLabel={opt => opt.fullName || opt.full_name || 'Cliente sin nombre'}
                                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                        filterOptions={(options, { inputValue }) =>
                                            options.filter(o =>
                                                (o.fullName || o.full_name || '').toLowerCase().includes(inputValue.toLowerCase())
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
                                    inputProps={{ 
                                        lang: 'es-ES',
                                        min: '2020-01-01',
                                        max: '2100-12-31'
                                    }}
                                    error={!formData.date}
                                    helperText={!formData.date ? 'La fecha es requerida' : ''}
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

                            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                Productos
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <ProductAutocomplete
                                    value={editingIndex === null ? newItem.description : (editingItem?.description || '')}
                                    onChange={desc => {
                                        if (editingIndex === null) {
                                            setNewItem({ ...newItem, description: desc });
                                        } else {
                                            setEditingItem(prev => prev ? { ...prev, description: desc } : null);
                                        }
                                    }}
                                    label="Descripción"
                                    placeholder="Buscar producto..."
                                />
                                <TextField
                                    type="number"
                                    name="quantity"
                                    label="Cantidad"
                                    value={editingIndex === null ? newItem.quantity : (editingItem?.quantity || 0)}
                                    onFocus={e => (e.target as HTMLInputElement).select()}
                                    onChange={editingIndex === null ? 
                                        handleItemChange : 
                                        (e) => setEditingItem(prev => prev ? {...prev, quantity: Number(e.target.value)} : null)
                                    }
                                    sx={{ width: '150px' }}
                                />
                                <TextField
                                    type="number"
                                    name="unitPrice"
                                    label="Precio Unitario"
                                    value={editingIndex === null ? newItem.unitPrice : (editingItem?.unitPrice || 0)}
                                    onFocus={e => (e.target as HTMLInputElement).select()}
                                    onChange={editingIndex === null ? 
                                        handleItemChange : 
                                        (e) => setEditingItem(prev => prev ? {...prev, unitPrice: Number(e.target.value)} : null)
                                    }
                                    sx={{ width: '150px' }}
                                />
                                {editingIndex === null ? (
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
                                ) : (
                                    <>
                                        <IconButton 
                                            onClick={saveEdit}
                                            sx={{ 
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: '#388E3C',
                                                },
                                            }}
                                        >
                                            <SaveIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={cancelEdit}
                                            sx={{ 
                                                backgroundColor: '#f44336',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: '#d32f2f',
                                                },
                                            }}
                                        >
                                            <CancelIcon />
                                        </IconButton>
                                    </>
                                )}
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
                                            <TableCell>
                                                {editingIndex === index ? (
                                                    <TextField
                                                        size="small"
                                                        value={editingItem?.description || ''}
                                                        onChange={(e) => setEditingItem(prev => prev ? {...prev, description: e.target.value} : null)}
                                                    />
                                                ) : (
                                                    item.description
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {editingIndex === index ? (
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={editingItem?.quantity || 0}
                                                        onChange={(e) => setEditingItem(prev => prev ? {...prev, quantity: Number(e.target.value)} : null)}
                                                        sx={{ width: '80px' }}
                                                    />
                                                ) : (
                                                    item.quantity
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {editingIndex === index ? (
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={editingItem?.unitPrice || 0}
                                                        onChange={(e) => setEditingItem(prev => prev ? {...prev, unitPrice: Number(e.target.value)} : null)}
                                                        sx={{ width: '100px' }}
                                                    />
                                                ) : (
                                                    `RD$ ${item.unitPrice.toFixed(2)}`
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                RD$ {item.total.toFixed(2)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {editingIndex === index ? (
                                                    <>
                                                        <IconButton 
                                                            onClick={saveEdit}
                                                            color="success"
                                                            size="small"
                                                        >
                                                            <SaveIcon />
                                                        </IconButton>
                                                        <IconButton 
                                                            onClick={cancelEdit}
                                                            color="error"
                                                            size="small"
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton 
                                                            onClick={() => startEditing(index)}
                                                            color="primary"
                                                            size="small"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton 
                                                            onClick={() => removeItem(index)}
                                                            color="error"
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </>
                                                )}
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

                            {/* Sección de Pagos */}
                            <Box sx={{ mt: 4, border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">Pagos</Typography>
                                    <Button 
                                        variant="outlined" 
                                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                                        startIcon={showPaymentForm ? <CancelIcon /> : <AddIcon />}
                                        size="small"
                                    >
                                        {showPaymentForm ? 'Cancelar' : 'Agregar Pago'}
                                    </Button>
                                </Box>

                                {showPaymentForm && (
                                    <Box sx={{ mb: 3, p: 2, border: '1px dashed #e0e0e0', borderRadius: 1 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Monto"
                                                    value={currentPayment.amount || ''}
                                                    onChange={handlePaymentAmountChange}
                                                    onBlur={(e) => {
                                                        const target = e.target as HTMLInputElement;
                                                        const newAmount = parseFloat(target.value) || 0;
                                                        const { remaining } = calculateTotal();
                                                        
                                                        if (newAmount > remaining) {
                                                            setCurrentPayment({
                                                                ...currentPayment,
                                                                amount: remaining
                                                            });
                                                        }
                                                    }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">RD$</InputAdornment>,
                                                    }}
                                                    inputProps={{
                                                        min: 0,
                                                        step: '0.01',
                                                        max: calculateTotal().remaining
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    label="Fecha de Pago"
                                                    value={currentPayment.date}
                                                    onChange={(e) => setCurrentPayment({...currentPayment, date: e.target.value})}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Método</InputLabel>
                                                    <Select
                                                        value={currentPayment.method}
                                                        label="Método"
                                                        onChange={(e) => setCurrentPayment({...currentPayment, method: e.target.value as PaymentMethod})}
                                                    >
                                                        <MenuItem value="cash">Efectivo</MenuItem>
                                                        <MenuItem value="transfer">Transferencia</MenuItem>
                                                        <MenuItem value="deposit">Depósito</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    fullWidth
                                                    label="Referencia"
                                                    value={currentPayment.reference}
                                                    onChange={(e) => setCurrentPayment({...currentPayment, reference: e.target.value})}
                                                    placeholder="N° de transacción"
                                                />
                                            </Grid>
                                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                                <Button 
                                                    variant="outlined" 
                                                    onClick={() => setShowPaymentForm(false)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button 
                                                    variant="contained" 
                                                    color="primary"
                                                    onClick={handleAddPayment}
                                                >
                                                    Agregar Pago
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}

                                {payments.length > 0 && (
                                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Monto</TableCell>
                                                    <TableCell>Fecha</TableCell>
                                                    <TableCell>Método</TableCell>
                                                    <TableCell>Referencia</TableCell>
                                                    <TableCell align="right">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {payments.map((payment, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>RD$ {payment.amount.toFixed(2)}</TableCell>
                                                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            {payment.method === 'cash' ? 'Efectivo' : 
                                                             payment.method === 'transfer' ? 'Transferencia' : 'Depósito'}
                                                        </TableCell>
                                                        <TableCell>{payment.reference || 'N/A'}</TableCell>
                                                        <TableCell align="right">
                                                            <IconButton 
                                                                size="small" 
                                                                color="error"
                                                                onClick={() => removePayment(index)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                                    <Typography variant="subtitle1">Total Factura: <strong>RD$ {calculateTotal().total.toFixed(2)}</strong></Typography>
                                    <Typography variant="subtitle1">Total Pagado: <strong>RD$ {calculateTotal().totalPaid.toFixed(2)}</strong></Typography>
                                    <Typography variant="subtitle1">Saldo Pendiente: 
                                        <strong style={{ color: calculateTotal().remaining <= 0 ? 'green' : 'inherit' }}>
                                            RD$ {calculateTotal().remaining.toFixed(2)}
                                        </strong>
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={clearForm}
                                    sx={{
                                        flex: 1,
                                        color: '#E31C79',
                                        borderColor: '#E31C79',
                                        '&:hover': {
                                            borderColor: '#C4156A',
                                            backgroundColor: 'rgba(227, 28, 121, 0.04)',
                                        },
                                    }}
                                >
                                    Limpiar Factura
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={Boolean(invoiceNumberError)}
                                    sx={{
                                        flex: 1,
                                        backgroundColor: '#E31C79',
                                        '&:hover': {
                                            backgroundColor: '#C4156A',
                                        },
                                    }}
                                >
                                    {payments.length > 0 ? 'Crear Factura y Registrar Pago' : 'Crear Factura'}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
}; 