import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    const location = useLocation();
    const invoiceIdFromState = (location.state as any)?.invoiceId;
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
    const navigate = useNavigate();
    // Calcular mora pendiente o 0
    const pendingLateFee = selectedInvoice?.lateFeeAmount ?? 0;

    // Cargar factura(s) según si viene id o todas las pendientes
    useEffect(() => {
        (async () => {
            try {
                if (invoiceIdFromState) {
                    // Solo cargar la factura específica para disminuir egress
                    const inv = await invoiceService.getInvoiceById(invoiceIdFromState);
                    setInvoices([inv]);
                    setSelectedInvoice(inv);
                } else {
                    const data = await invoiceService.getAllInvoices();
                    const pending = data.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
                    setInvoices(pending);
                }
            } catch (err: any) {
                console.error('Error cargando facturas:', err);
                setLoadError(err.message || JSON.stringify(err));
            }
        })();
    }, [invoiceIdFromState]);

    // Preseleccionar factura si viene en el estado de navegación
    useEffect(() => {
        if (invoices.length > 0 && invoiceIdFromState) {
            const inv = invoices.find(inv => inv.id === invoiceIdFromState);
            if (inv) setSelectedInvoice(inv);
        }
    }, [invoices, invoiceIdFromState]);

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

        // Priorizar cobro de mora
        const pendingLateFee = selectedInvoice.lateFeeAmount ?? 0;
        const principalPending = selectedInvoice.remainingAmount;
        const totalPending = pendingLateFee + principalPending;
        if (paymentAmount > totalPending) {
            setMessage({ text: 'El monto no puede ser mayor al total pendiente (principal + mora)', isError: true });
            return;
        }

        // Determinar cómo se aplica el pago: primero mora, luego principal
        let feePayment = 0;
        let principalPayment = 0;
        if (paymentAmount <= pendingLateFee) {
            feePayment = paymentAmount;
        } else {
            feePayment = pendingLateFee;
            principalPayment = paymentAmount - pendingLateFee;
        }
        // Crear el nuevo pago
        const newPayment = {
            id: uuidv4(),
            date: paymentDate.toISOString(),
            amount: paymentAmount,
            lateFeePaid: feePayment,
            installmentNumber: selectedInvoice.payments ? selectedInvoice.payments.length + 1 : 1,
            method,
            attachment: paymentAttachmentPreview || undefined
        };

        // Registrar el pago y actualizar la factura
        try {
            setIsSubmitting(true);
            // Registrar pago pasando el id de la factura
            await paymentService.registerPayment(selectedInvoice.id, newPayment);
            // Calcular nuevos montos de mora y principal
            const newLateFeeRemaining = Math.max(pendingLateFee - feePayment, 0);
            const newPrincipalRemaining = Math.max(principalPending - principalPayment, 0);
            const newLateFeePercentage = principalPending > 0 ? (newLateFeeRemaining / principalPending) * 100 : 0;
            const updatedInvoice = {
                ...selectedInvoice,
                // Actualizar mora y principal pendientes
                lateFeeAmount: newLateFeeRemaining,
                lateFeePercentage: newLateFeeRemaining > 0 ? newLateFeePercentage : 0,
                remainingAmount: newPrincipalRemaining,
                payments: [...(selectedInvoice.payments || []), newPayment]
            } as Invoice;
            // Actualizar estado de factura
            if (updatedInvoice.remainingAmount === 0 && (updatedInvoice.lateFeeAmount ?? 0) === 0) {
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
            setMessage({ text: `Pago registrado: RD$ ${feePayment.toFixed(2)} a mora y RD$ ${principalPayment.toFixed(2)} al capital.`, isError: false });
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
                    {/* Botón Volver */}
                    <Grid item xs={12}>
                                    <Button
                                        variant="text"
                                        startIcon={<span role="img" aria-label="Volver">🔙</span>}
                                        fullWidth
                                        sx={{ color: '#E31C79', mt: 1, fontSize: '1.1rem' }}
                                        onClick={() => {
                                            navigate('/admin');
                                        }}
                                    >
                                        Volver
                                    </Button>
                                </Grid>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" sx={{ color: '#E31C79' }}>
                            Registrar Pago
                        </Typography>
                    </Box>
                    {selectedInvoice && (
                        <Typography variant="subtitle1" sx={{ mb: 3 }}>
                            Registrando pago para la Factura #{selectedInvoice.invoiceNumber}
                        </Typography>
                    )}
                    {/* Si no hay facturas disponibles, mostrar alerta y no mostrar el formulario */}
                    {invoices.length === 0 && !invoiceIdFromState ? (
                        <Alert severity="info">Debe crear al menos una factura primero para registrar un pago.</Alert>
                    ) : (
                        <Box component="form" onSubmit={handlePaymentSubmit}>
                            <Grid container spacing={2}>
                                {/* Selector de factura */}
                                {!invoiceIdFromState && (
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
                                )}
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
                                        {pendingLateFee > 0 && (
                                            <>
                                                <Grid item xs={12}>
                                                    <Alert severity="warning">
                                                        Hay mora pendiente de RD$ {pendingLateFee.toFixed(2)}. Se cobrará primero.
                                                    </Alert>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Mora Pendiente"
                                                        value={`RD$ ${pendingLateFee.toFixed(2)}`}
                                                        InputProps={{ readOnly: true }}
                                                    />
                                                </Grid>
                                            </>
                                        )}
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