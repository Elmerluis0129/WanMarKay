import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Autocomplete,
    Grid,
    Alert,
    MenuItem
} from '@mui/material';
import { Invoice } from '../../types/invoice';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { Navigation } from '../shared/Navigation';
import { v4 as uuidv4 } from 'uuid';
// import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { es } from 'date-fns/locale';
// import type { TextFieldProps } from '@mui/material';

// Helpers para formatear cédula y teléfono
const formatCedula = (value: string = ''): string => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 ?
        `${digits.slice(0,3)}-${digits.slice(3,10)}-${digits.slice(10)}` : value;
};

const formatPhone = (value: string = ''): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return value;
};

export const RegisterPayment: React.FC = () => {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
    const [method, setMethod] = useState<'cash'|'transfer'|'deposit'>('cash');
    const [message, setMessage] = useState({ text: '', isError: false });
    const [paymentAttachmentFile, setPaymentAttachmentFile] = useState<File | null>(null);
    const [paymentAttachmentPreview, setPaymentAttachmentPreview] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadError, setLoadError] = useState<string|null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar facturas pendientes o en curso
    useEffect(() => {
        (async () => {
            try {
                const data = await invoiceService.getInvoices();
                setInvoices(data.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled'));
            } catch (err: any) {
                console.error('Error cargando facturas:', err);
                setLoadError(err.message || JSON.stringify(err));
            }
        })();
    }, []);

    if (loadError) {
        return <Alert severity="error">Error al cargar facturas: {loadError}</Alert>;
    }

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!selectedInvoice || !amount || !paymentDate) {
            setMessage({ text: 'Por favor complete todos los campos', isError: true });
            return;
        }

        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            setMessage({ text: 'El monto debe ser un número válido mayor a 0', isError: true });
            return;
        }

        if (paymentAmount > selectedInvoice.remainingAmount) {
            setMessage({ text: 'El monto no puede ser mayor al saldo pendiente', isError: true });
            return;
        }

        // Crear el nuevo pago
        const newPayment = {
            id: uuidv4(),
            date: paymentDate.toISOString(),
            amount: paymentAmount,
            installmentNumber: selectedInvoice.payments ? selectedInvoice.payments.length + 1 : 1,
            method,
            attachment: paymentAttachmentPreview || undefined
        };

        // Registrar el pago y actualizar la factura
        try {
            setIsSubmitting(true);
            // Registrar pago pasando el id de la factura
            await paymentService.registerPayment(selectedInvoice.id, newPayment);
            const updatedInvoice = {
                ...selectedInvoice,
                remainingAmount: selectedInvoice.remainingAmount - paymentAmount,
                payments: [...(selectedInvoice.payments || []), newPayment]
            } as Invoice;
            // Actualizar estado de factura
            if (updatedInvoice.remainingAmount === 0) {
                updatedInvoice.status = 'paid';
            } else if (updatedInvoice.payments?.length === 1) {
                updatedInvoice.status = 'on_time';
            }
            // Lógica de crédito
            if (updatedInvoice.paymentType === 'credit' && updatedInvoice.paymentPlan) {
                const dateObj = paymentDate;
                if (updatedInvoice.paymentPlan.nextPaymentDate) {
                    const next = new Date(updatedInvoice.paymentPlan.nextPaymentDate);
                    if (dateObj > next && updatedInvoice.status !== 'paid') updatedInvoice.status = 'delayed';
                }
                updatedInvoice.paymentPlan = {
                    ...updatedInvoice.paymentPlan,
                    paidInstallments: (updatedInvoice.paymentPlan.paidInstallments || 0) + 1,
                    nextPaymentDate: calculateNextPaymentDate(updatedInvoice.paymentPlan.frequency, paymentDate.toISOString())
                };
            }
            await invoiceService.updateInvoice(updatedInvoice);
            setMessage({ text: 'Pago registrado exitosamente', isError: false });
            setSelectedInvoice(null);
            setAmount('');
            setPaymentDate(new Date());
        } catch (error: any) {
            console.error('Error completo:', error);
            console.error('Detalle:', error.message || error.error || JSON.stringify(error));
            setMessage({ text: error.message || JSON.stringify(error), isError: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateNextPaymentDate = (frequency: string, currentPaymentDate: string): string => {
        const date = new Date(currentPaymentDate);
        switch (frequency) {
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'biweekly':
                date.setDate(date.getDate() + 14);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            default:
                date.setMonth(date.getMonth() + 1);
        }
        return date.toISOString();
    };

    // Handler para archivo de comprobante de pago
    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentAttachmentFile(file);
            const url = URL.createObjectURL(file);
            setPaymentAttachmentPreview(url);
        }
    };

    return (
        <>
            <Navigation title="Registrar Pago" />
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ mt: 4, p: 4, bgcolor: 'background.paper' }}>
                    <Typography variant="h5" sx={{ color: '#E31C79', mb: 3 }}>
                        Registrar Pago
                    </Typography>
                    {/* Si no hay facturas disponibles, mostrar alerta y no mostrar el formulario */}
                    {invoices.length === 0 ? (
                        <Alert severity="info">Debe crear al menos una factura primero para registrar un pago.</Alert>
                    ) : (
                        <Box component="form" onSubmit={handlePaymentSubmit}>
                            <Grid container spacing={2}>
                                {/* Selector de factura */}
                                <Grid item xs={12}>
                                    <Autocomplete
                                        value={selectedInvoice}
                                        onChange={(_, newValue) => {
                                            setSelectedInvoice(newValue);
                                            setAmount('');
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
                                            />
                                        )}
                                    />
                                </Grid>
                                {selectedInvoice && (
                                    <> 
                                        {/* Datos del cliente */}
                                        <Grid item xs={12}>
                                            {selectedInvoice.address && <Typography><strong>Dirección:</strong> {selectedInvoice.address}</Typography>}
                                            {selectedInvoice.cedula && <Typography><strong>Cédula:</strong> {formatCedula(selectedInvoice.cedula)}</Typography>}
                                            {selectedInvoice.phone && <Typography><strong>Teléfono:</strong> {formatPhone(selectedInvoice.phone)}</Typography>}
                                        </Grid>
                                        {/* Montos */}
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Monto Total"
                                                value={`RD$ ${selectedInvoice.total.toFixed(2)}`}
                                                InputProps={{ readOnly: true }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Saldo Pendiente"
                                                value={`RD$ ${selectedInvoice.remainingAmount.toFixed(2)}`}
                                                InputProps={{ readOnly: true }}
                                            />
                                        </Grid>
                                        {/* Monto a pagar */}
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Monto a Pagar"
                                                type="number"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                inputProps={{ min: 0, max: selectedInvoice.remainingAmount, step: 0.01 }}
                                                required
                                            />
                                        </Grid>
                                        {/* Fecha de Pago */}
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Fecha de Pago"
                                                type="date"
                                                value={paymentDate ? paymentDate.toISOString().split('T')[0] : ''}
                                                onChange={e => setPaymentDate(new Date(e.target.value))}
                                                InputLabelProps={{ shrink: true }}
                                                required
                                            />
                                        </Grid>
                                        {/* Método de Pago */}
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Método de Pago"
                                                value={method}
                                                onChange={e => setMethod(e.target.value as 'cash'|'transfer'|'deposit')}
                                                required
                                            >
                                                <MenuItem value="cash">Efectivo</MenuItem>
                                                <MenuItem value="transfer">Transferencia</MenuItem>
                                                <MenuItem value="deposit">Depósito</MenuItem>
                                            </TextField>
                                        </Grid>
                                        {/* Subir comprobante de pago */}
                                        <Grid item xs={12} md={6}>
                                            <Button variant="contained" component="label" sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}>
                                                Subir Comprobante
                                                <input type="file" hidden accept="image/*" onChange={handleAttachmentChange} />
                                            </Button>
                                            {paymentAttachmentPreview && (
                                                <Box component="img" src={paymentAttachmentPreview} alt="Comprobante" sx={{ mt: 2, maxWidth: '100%', maxHeight: 200 }} />
                                            )}
                                        </Grid>
                                    </>
                                )}
                                {/* Mensaje */}
                                {message.text && (
                                    <Grid item xs={12}>
                                        <Alert severity={message.isError ? 'error' : 'success'}>
                                            {message.text}
                                        </Alert>
                                    </Grid>
                                )}
                                {/* Botón Registrar */}
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={!selectedInvoice || !amount || !paymentDate || isSubmitting}
                                        sx={{ bgcolor: '#E31C79', '&:hover': { bgcolor: '#C4156A' } }}
                                    >{isSubmitting ? 'Registrando...' : 'Registrar Pago'}</Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Paper>
            </Container>
        </>
    );
}; 