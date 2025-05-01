import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Autocomplete,
    Grid,
    Alert
} from '@mui/material';
import { Invoice } from '../../types/invoice';
import { storage } from '../../utils/storage';
import { Navigation } from '../shared/Navigation';
import { v4 as uuidv4 } from 'uuid';
// import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { es } from 'date-fns/locale';
import type { TextFieldProps } from '@mui/material';

export const RegisterPayment: React.FC = () => {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
    const [message, setMessage] = useState({ text: '', isError: false });
    const invoices = storage.getInvoices().filter(invoice => 
        invoice.status !== 'paid' && invoice.status !== 'cancelled'
    );

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
            installmentNumber: selectedInvoice.payments ? selectedInvoice.payments.length + 1 : 1
        };

        // Actualizar la factura
        const updatedInvoice = {
            ...selectedInvoice,
            remainingAmount: selectedInvoice.remainingAmount - paymentAmount,
            payments: [...(selectedInvoice.payments || []), newPayment]
        };

        // Actualizar el estado si es necesario
        if (updatedInvoice.remainingAmount === 0) {
            updatedInvoice.status = 'paid';
        } else if (!updatedInvoice.payments || updatedInvoice.payments.length === 0) {
            // Si no hay pagos previos, mantener como pendiente
            updatedInvoice.status = 'pending';
        } else if (updatedInvoice.payments.length === 1) {
            // Si es el primer pago, cambiar a "A tiempo"
            updatedInvoice.status = 'on_time';
        }

        // Si es un pago a crédito, actualizar el plan de pago y verificar fechas
        if (updatedInvoice.paymentType === 'credit' && updatedInvoice.paymentPlan) {
            const paymentDateObj = paymentDate;
            
            // Verificar si hay una próxima fecha de pago
            if (updatedInvoice.paymentPlan.nextPaymentDate) {
                const nextPaymentDate = new Date(updatedInvoice.paymentPlan.nextPaymentDate);
                
                // Calcular días restantes para el próximo pago
                const today = new Date();
                const diffTime = nextPaymentDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Si la fecha de pago es posterior a la fecha del siguiente pago, marcar como retrasado
                if (paymentDateObj > nextPaymentDate && updatedInvoice.status !== 'paid') {
                    updatedInvoice.status = 'delayed';
                } else if (diffDays >= 0 && updatedInvoice.status === 'delayed') {
                    // Si los días restantes son positivos y estaba retrasada, cambiar a "A tiempo"
                    updatedInvoice.status = 'on_time';
                }
            }

            updatedInvoice.paymentPlan = {
                ...updatedInvoice.paymentPlan,
                paidInstallments: (updatedInvoice.paymentPlan.paidInstallments || 0) + 1,
                nextPaymentDate: calculateNextPaymentDate(updatedInvoice.paymentPlan.frequency, paymentDateObj.toISOString())
            };
        }

        try {
            storage.updateInvoice(updatedInvoice);
            setMessage({ text: 'Pago registrado exitosamente', isError: false });
            setSelectedInvoice(null);
            setAmount('');
            setPaymentDate(new Date());
        } catch (error) {
            setMessage({ text: 'Error al registrar el pago', isError: true });
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

    return (
        <>
            <Navigation title="Registrar Pago" />
            <Container maxWidth="md">
                <Paper elevation={3} sx={{ mt: 4, p: 4, bgcolor: 'background.paper' }}>
                    <Typography variant="h5" sx={{ color: '#E31C79', mb: 3 }}>
                        Registrar Pago
                    </Typography>
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
                                    disabled={!selectedInvoice || !amount || !paymentDate}
                                    sx={{ bgcolor: '#E31C79', '&:hover': { bgcolor: '#C4156A' } }}
                                >Registrar Pago</Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}; 