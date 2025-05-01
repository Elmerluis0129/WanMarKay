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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceItem, PaymentPlan } from '../../types';
import { storage } from '../../utils/storage';
import { auth } from '../../services/auth';
import { Navigation } from '../shared/Navigation';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';

export const CreateInvoice: React.FC = () => {
    const [formData, setFormData] = useState({
        clientName: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [availableClients, setAvailableClients] = useState<Array<{fullName: string}>>([]);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);

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

    // Cargar la lista de clientes al montar el componente
    useEffect(() => {
        const users = storage.getUsers().filter(user => user.role === 'client');
        setAvailableClients(users.map(user => ({
            fullName: user.fullName
        })));
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
        const itbis = subtotal * 0.18;
        return {
            subtotal,
            itbis,
            total: subtotal + itbis,
        };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (items.length === 0) {
            setMessage({ text: 'Debe agregar al menos un producto', isError: true });
            return;
        }

        if (!selectedClient) {
            setMessage({ text: 'Por favor seleccione un cliente', isError: true });
            return;
        }

        const { subtotal, itbis, total } = calculateTotal();
        const currentUser = auth.getCurrentUser();

        if (!currentUser) {
            setMessage({ text: 'Error: Usuario no autenticado', isError: true });
            return;
        }

        const startDate = new Date(paymentPlan.startDate || new Date());
        let nextPaymentDate = new Date(startDate);
        
        // Calcular próxima fecha de pago según frecuencia
        switch (paymentPlan.frequency) {
            case 'weekly':
                nextPaymentDate.setDate(startDate.getDate() + 7);
                break;
            case 'biweekly':
                nextPaymentDate.setDate(startDate.getDate() + 14);
                break;
            case 'monthly':
                nextPaymentDate.setMonth(startDate.getMonth() + 1);
                break;
            default:
                nextPaymentDate.setMonth(startDate.getMonth() + 1);
        }

        // Verificar si la fecha de pago ya pasó
        const today = new Date();
        const diffTime = nextPaymentDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const initialStatus = diffDays < 0 ? 'delayed' : 'pending';

        const newInvoice: Invoice = {
            id: uuidv4(),
            invoiceNumber: new Date().getTime().toString(),
            date: formData.date,
            clientName: selectedClient,
            items,
            subtotal,
            itbis,
            total,
            remainingAmount: total,
            status: initialStatus,
            paymentType,
            payments: [],
            ...(paymentType === 'credit' && {
                paymentPlan: {
                    ...paymentPlan,
                    paidInstallments: 0,
                    startDate: startDate.toISOString(),
                    nextPaymentDate: nextPaymentDate.toISOString(),
                } as PaymentPlan
            })
        };

        try {
            storage.addInvoice(newInvoice);
            setMessage({ text: 'Factura creada exitosamente', isError: false });
            setFormData({
                clientName: '',
                date: new Date().toISOString().split('T')[0],
            });
            setSelectedClient(null);
            setItems([]);
            setPaymentType('cash');
            setPaymentPlan({
                frequency: 'monthly',
                totalInstallments: 1,
                installmentAmount: 0,
                startDate: new Date().toISOString().split('T')[0],
            });
        } catch (error) {
            setMessage({ text: 'Error al crear la factura', isError: true });
        }
    };

    const totals = calculateTotal();

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
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <FormControl fullWidth>
                                    <Autocomplete
                                        value={selectedClient}
                                        onChange={(_, newValue) => {
                                            setSelectedClient(newValue);
                                            setFormData(prev => ({
                                                ...prev,
                                                clientName: newValue || ''
                                            }));
                                        }}
                                        options={availableClients.map(client => client.fullName)}
                                        renderInput={(params) => (
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
                                        renderOption={(props, option, { inputValue }) => {
                                            const matches = match(option, inputValue, { insideWords: true });
                                            const parts = parse(option, matches);

                                            return (
                                                <li {...props}>
                                                    <div>
                                                        {parts.map((part: { highlight: boolean; text: string }, index: number) => (
                                                            <span
                                                                key={index}
                                                                style={{
                                                                    fontWeight: part.highlight ? 700 : 400,
                                                                    color: part.highlight ? '#E31C79' : 'inherit',
                                                                }}
                                                            >
                                                                {part.text}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </li>
                                            );
                                        }}
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
                                <Typography>
                                    ITBIS (18%): RD$ {totals.itbis.toFixed(2)}
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
        </>
    );
}; 