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
    Radio,
    RadioGroup,
    Autocomplete,
    Alert,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceItem, PaymentPlan, User } from '../../types';
import { userService } from '../../services/userService';
import { invoiceService } from '../../services/invoiceService';
import { auth } from '../../services/auth';
import { Navigation } from '../shared/Navigation';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import InputMask from 'react-input-mask';

export const CreateInvoice: React.FC = () => {
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        clientName: '',
        address: '',
        cedula: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
    });

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
        frequency: 'monthly',
        totalInstallments: 1,
        installmentAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
    });

    const [message, setMessage] = useState({ text: '', isError: false });

    // Estado para imagen adjunta y su preview
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

    // Estado para diálogo de confirmación si no hay imagen
    const [openNoImageDialog, setOpenNoImageDialog] = useState<boolean>(false);
    const [skipNoImageConfirm, setSkipNoImageConfirm] = useState<boolean>(false);

    // Handler para el input file
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
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
        return {
            subtotal,
            total: subtotal,
        };
    };

    const saveInvoice = async () => {
        const { subtotal } = calculateTotal();
        const total = subtotal;
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
        const initialStatus = diffDays < 0 ? 'delayed' : 'pending';
        const newInvoice: Invoice = {
            id: uuidv4(), invoiceNumber: formData.invoiceNumber, date: formData.date,
            clientName: selectedClient!.fullName,
            clientId: selectedClient!.id,
            address: formData.address || undefined, cedula: formData.cedula || undefined,
            phone: formData.phone || undefined,
            ...(attachmentPreview && { attachment: attachmentPreview }), items, subtotal, total,
            remainingAmount: total, status: initialStatus, paymentType, payments: [],
            ...(paymentType === 'credit' && { paymentPlan: { ...paymentPlan, paidInstallments: 0, startDate: startDate.toISOString(), nextPaymentDate: nextPaymentDate.toISOString() } as PaymentPlan })
        };
        await invoiceService.addInvoice(newInvoice);
        setMessage({ text: 'Factura creada exitosamente', isError: false });
        // reset form
        setFormData({ invoiceNumber:'', clientName:'', address:'', cedula:'', phone:'', date:new Date().toISOString().split('T')[0] });
        setSelectedClient(null); setItems([]); setPaymentType('cash');
        setPaymentPlan({ frequency:'monthly', totalInstallments:1, installmentAmount:0, startDate:new Date().toISOString().split('T')[0]});
        setAttachmentFile(null); setAttachmentPreview(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) { setMessage({ text:'Debe agregar al menos un producto', isError:true }); return; }
        if (!formData.invoiceNumber) { setMessage({ text:'El número de factura es obligatorio', isError:true }); return; }
        if (!selectedClient) { setMessage({ text:'Por favor seleccione un cliente', isError:true }); return; }
        if (!skipNoImageConfirm && !attachmentPreview) { setOpenNoImageDialog(true); return; }
        saveInvoice();
        setSkipNoImageConfirm(false);
    };

    const totals = calculateTotal();

    const confirmWithoutImage = () => { setSkipNoImageConfirm(true); setOpenNoImageDialog(false); };

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
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="No. Factura"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Dirección"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Cédula"
                                        name="cedula"
                                        value={formData.cedula}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <InputMask
                                        mask="+1 (999) 999-9999"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        maskChar="_"
                                    >
                                        {(maskProps: any) => (
                                            <TextField
                                                {...maskProps}
                                                fullWidth
                                                label="Teléfono"
                                                name="phone"
                                                required
                                            />
                                        )}
                                    </InputMask>
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
                                    required
                                    type="date"
                                    name="date"
                                    label="Fecha"
                                    value={formData.date}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>

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
                                    onChange={handleItemChange}
                                    sx={{ width: '150px' }}
                                />
                                <TextField
                                    type="number"
                                    name="unitPrice"
                                    label="Precio Unitario"
                                    value={newItem.unitPrice}
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
                                                <MenuItem value="daily">Diario</MenuItem>
                                                <MenuItem value="weekly">Semanal</MenuItem>
                                                <MenuItem value="biweekly">Quincenal</MenuItem>
                                                <MenuItem value="monthly">Mensual</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            type="number"
                                            name="totalInstallments"
                                            label="Número de Pagos"
                                            value={paymentPlan.totalInstallments}
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

                            {message.text && (
                                <Typography 
                                    color={message.isError ? 'error' : 'success'} 
                                    sx={{ mt: 2 }}
                                >
                                    {message.text}
                                </Typography>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
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