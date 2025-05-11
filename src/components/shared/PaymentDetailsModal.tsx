import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Modal,
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    Grid,
    Stack,
    Chip,
    Select,
    MenuItem,
    FormControl,
    SelectChangeEvent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    TextField,
    InputAdornment,
    Snackbar,
    IconButton
} from '@mui/material';
import { Invoice, Payment, InvoiceStatus } from '../../types/invoice';
import { invoiceService, paymentService } from '../../services';
import { auth } from '../../services/auth';
import { v4 as uuidv4 } from 'uuid';
import { addFrequency, calculateDaysRemaining } from '../../utils/dateUtils';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { computeInvoiceStatus, InvoiceStatusResult } from '../../utils/statusUtils';
import { calculateLateFeePercentage, calculateLateFeeAmount } from '../../utils/lateFeeUtils';

const formatPhone = (value: string = ''): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
        return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return value;
};

interface PaymentDetailsModalProps {
    open: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    isAdmin?: boolean;
    onStatusChange?: () => void;
    onPaymentRegistered?: (invoice: Invoice) => void;
}

// Helpers para formatear cédula y teléfono visualmente
const formatCedula = (value: string = ''): string => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11
        ? `${digits.slice(0,3)}-${digits.slice(3,10)}-${digits.slice(10)}`
        : value;
};

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
    open,
    onClose,
    invoice,
    isAdmin = false,
    onStatusChange,
    onPaymentRegistered
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus>('on_time');
    const [statusInfo, setStatusInfo] = useState<InvoiceStatusResult>({ status: 'on_time' });
    const [lateFee, setLateFee] = useState<number>(0);
    const [lateFeeAmount, setLateFeeAmount] = useState<number>(0);
    const [isLateFeeCalculated, setIsLateFeeCalculated] = useState<boolean>(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        currentStatus: InvoiceStatus;
        newStatus: InvoiceStatus;
    }>({
        open: false,
        currentStatus: 'on_time' as InvoiceStatus,
        newStatus: 'paid' as InvoiceStatus
    });
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [paymentDialog, setPaymentDialog] = useState<{
        open: boolean;
        amount: number;
        installmentNumber: number;
        method: string;
        attachment: string;
    }>({
        open: false,
        amount: 0,
        installmentNumber: 0,
        method: '',
        attachment: ''
    });

    const handlePaymentDialogOpen = () => {
        setPaymentDialog(prev => ({
            ...prev,
            open: true,
            amount: 0,
            installmentNumber: 0,
            method: '',
            attachment: ''
        }));
    };

    const handlePaymentDialogClose = () => {
        setPaymentDialog(prev => ({
            ...prev,
            open: false,
            amount: 0,
            installmentNumber: 0,
            method: '',
            attachment: ''
        }));
    };
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [invoiceSignedUrl, setInvoiceSignedUrl] = useState<string | null>(null);
    const [paymentAttachmentPreview, setPaymentAttachmentPreview] = useState<string | null>(null);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [now, setNow] = useState<Date>(new Date());
    const navigate = useNavigate();

    // When invoice changes, reset editedInvoice and invoiceSignedUrl
    useEffect(() => {
        if (invoice) {
            setEditedInvoice(invoice);
            setIsEditing(false);
            setInvoiceSignedUrl(invoice.attachment || null);
            // Recalcular status y guardar info
            const statusResult = computeInvoiceStatus(invoice);
            setSelectedStatus(statusResult.status);
            setStatusInfo(statusResult);
        }
    }, [invoice]);
    // Efecto para recalcular estado y mora cuando cambia la fecha
    useEffect(() => {
        if (invoice) {
            const statusResult = computeInvoiceStatus(invoice);
            let status = statusResult.status;
            const originalStatus = status;
            setSelectedStatus(status);
            setStatusInfo(statusResult);

            // Si ya tiene mora guardada, úsala
            if (
                typeof invoice.lateFeePercentage === 'number' &&
                typeof invoice.lateFeeAmount === 'number' &&
                (invoice.lateFeePercentage > 0 || invoice.lateFeeAmount > 0)
            ) {
                setLateFee(invoice.lateFeePercentage);
                setLateFeeAmount(invoice.lateFeeAmount);
                setIsLateFeeCalculated(true);
            } else if (invoice.paymentType === 'cash' && originalStatus === 'delayed') {
                // Solo calcular automáticamente si no tiene valores guardados
                const percentage = calculateLateFeePercentage(invoice);
                const amount = calculateLateFeeAmount(invoice);
                setLateFee(percentage);
                setLateFeeAmount(amount);
                setIsLateFeeCalculated(true);
            } else {
                setLateFee(0);
                setLateFeeAmount(0);
                setIsLateFeeCalculated(false);
            }
        }
    }, [invoice, now]);
    // Update now each minute
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (invoice?.id) {
            (async () => {
                const data = await paymentService.getPaymentsByInvoice(invoice.id);
                setPaymentHistory(data);
            })();
        }
    }, [invoice]);

    const handleSaveEdit = async () => {
        if (!editedInvoice) return;
        // Calcular el descuento
        const discount = editedInvoice.total * ((editedInvoice.discountPercentage ?? 0) / 100);
        // Sumar pagos realizados
        const pagosRealizados = (editedInvoice.payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
        // Calcular pendiente
        const pendiente = editedInvoice.total - discount - pagosRealizados;
        const updatedInvoice = {
            ...editedInvoice,
            lateFeePercentage: lateFee,
            lateFeeAmount: lateFeeAmount,
            remainingAmount: pendiente < 0 ? 0 : pendiente
        };
        await invoiceService.updateInvoice(updatedInvoice);
        if (onPaymentRegistered) onPaymentRegistered(updatedInvoice);
        setIsEditing(false);
    };

    if (!invoice) return null;

    const handleStatusChange = (event: SelectChangeEvent<InvoiceStatus>) => {
        const newStatus = event.target.value as InvoiceStatus;
        // Solo permitir cambios a "cancelled" o "paid"
        if (newStatus !== 'cancelled' && newStatus !== 'paid') {
            return;
        }
        setConfirmDialog(prev => ({
            ...prev,
            open: true,
            currentStatus: selectedStatus,
            newStatus
        }));
    };

    const handleConfirmStatusChange = async () => {
        const { newStatus } = confirmDialog;
        setSelectedStatus(newStatus);
        
        // Actualizar el estado en el almacenamiento
        const updatedInvoice = { ...invoice, status: newStatus as InvoiceStatus };
        await invoiceService.updateInvoice(updatedInvoice);

        // Notificar el cambio para actualizar la lista
        if (onStatusChange) {
            onStatusChange();
        }

        setConfirmDialog(prev => ({ ...prev, open: false }));
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
    };

    const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        const colors: { [key: string]: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" } = {
            on_time: 'success',
            paid: 'success',
            delayed: 'error',
            cancelled: 'error'
        };
        return colors[status] || 'default';
    };

    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            on_time: 'A tiempo',
            delayed: 'Retrasado',
            paid: 'Pagada',
            cancelled: 'Cancelada'
        };
        return labels[status] || status;
    };

    // Abre/cierra el diálogo de registro de pago
    const handleOpenPaymentDialog = () => setPaymentDialog({ open: true, amount: 0, installmentNumber: 0, method: '', attachment: '' });
    const handleClosePaymentDialog = () => setPaymentDialog({ open: false, amount: 0, installmentNumber: 0, method: '', attachment: '' });

    const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentAttachmentPreview(URL.createObjectURL(file));
        }
    };

    // Función para registrar el pago de la siguiente cuota
    const registerPayment = async () => {
        try {
            if (!invoice.paymentPlan) return;
            const plan = invoice.paymentPlan;
            const installmentNumber = plan.paidInstallments + 1;
            const amount = plan.installmentAmount;
            // Priorizar pago de mora
            const currentLateFee = invoice.lateFeeAmount ?? 0;
            let feePayment = 0;
            let principalPayment = amount;
            if (currentLateFee > 0) {
                if (amount >= currentLateFee) {
                    feePayment = currentLateFee;
                    principalPayment = amount - currentLateFee;
                } else {
                    feePayment = amount;
                    principalPayment = 0;
                }
            }
            const paymentDate = new Date().toISOString();
            const newPayment: Payment = {
                id: uuidv4(),
                date: paymentDate,
                amount,
                installmentNumber
            };
            // Calcular estado según si está a tiempo o retrasado
            const dueDate = new Date(plan.nextPaymentDate!);
            const today = new Date();
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const statusForPayment = diffDays < 0 ? 'delayed' : 'on_time';

            // Registrar el pago en la tabla de pagos
            await paymentService.registerPayment(invoice.id, newPayment);
            const updatedInvoice: Invoice = {
                ...invoice,
                payments: [...(invoice.payments ?? []), newPayment],
                paymentPlan: {
                    ...plan,
                    paidInstallments: installmentNumber,
                    nextPaymentDate: installmentNumber < plan.totalInstallments ? (() => {
                        return addFrequency(new Date(plan.nextPaymentDate!), plan.frequency).toISOString();
                    })() : undefined
                },
                remainingAmount: invoice.remainingAmount - principalPayment,
                lateFeeAmount: currentLateFee - feePayment,
                lateFeePercentage: (currentLateFee - feePayment) > 0 ? invoice.lateFeePercentage : 0,
                status: installmentNumber >= plan.totalInstallments ? 'paid' : statusForPayment
            };
            await invoiceService.updateInvoice(updatedInvoice);
            if (onPaymentRegistered) onPaymentRegistered(updatedInvoice);
            if (onStatusChange) onStatusChange();
            setSnackbarMessage('Pago registrado correctamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setPaymentDialog({ open: false, amount: 0, installmentNumber: 0, method: '', attachment: '' });
        } catch (error: any) {
            console.error('Error registrando pago', error);
            setSnackbarMessage(error?.message || error?.error || JSON.stringify(error));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    const handleExportPDF = () => {
        if (!invoice) return;
        const doc = new jsPDF();

        // Colores corporativos
        const pink: [number, number, number] = [227, 28, 121];
        const gray: [number, number, number] = [100, 100, 100];

        // Encabezado: Mary Kay y Directora
        doc.setFontSize(28);
        doc.setTextColor(0,0,0);
        doc.text('Mary Kay', 10, 15);
        doc.setFontSize(10);
        doc.text('Directora de Belleza independiente', 10, 21);

        // Nombre empresa y datos factura
        doc.setFontSize(16);
        doc.setTextColor(pink[0], pink[1], pink[2]);
        doc.text('Carmen Trinidad Guzmán (Wanda)', 10, 30);
        doc.setFontSize(10);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(`Factura No.`, 150, 15);
        doc.setFontSize(14);
        doc.setTextColor(pink[0], pink[1], pink[2]);
        doc.text(`#${invoice.invoiceNumber}`, 180, 15);
        doc.setFontSize(10);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString()}`, 150, 21);

        // Datos del cliente
        let y = 38;
        doc.setFontSize(11);
        doc.setTextColor(0,0,0);
        doc.text(`Nombre: ${invoice.clientName}`, 10, y); y += 6;
        doc.text(`Dirección: ${invoice.address ?? '-'}`, 10, y); y += 6;
        doc.text(`Cédula: ${formatCedula(invoice.cedula ?? '-')}`, 10, y); y += 6;
        doc.text(`Teléfono: ${formatPhone(invoice.phone ?? '-')}`, 10, y); y += 6;

        // Tabla de productos
        autoTable(doc, {
            startY: y + 2,
            head: [['CANT.', 'DESCRIPCIÓN', 'PRECIO UNITARIO', 'TOTAL']],
            body: invoice.items.map(item => [
                String(item.quantity),
                item.description,
                `RD$ ${item.unitPrice.toFixed(2)}`,
                `RD$ ${item.total.toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: pink, textColor: 255, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'right' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 },
                1: { halign: 'left', cellWidth: 80 },
                2: { halign: 'right', cellWidth: 40 },
                3: { halign: 'right', cellWidth: 40 },
            },
        });
        y = (doc as any).lastAutoTable.finalY + 6;

        // Nota
        doc.setFontSize(10);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text('NOTA: ENVIAR COMPROBANTE DE PAGO', 10, y); y += 8;

        // Subtotales y totales alineados como en la factura física
        doc.setFontSize(11);
        doc.setTextColor(0,0,0);
        const xLabel = 130;
        const xValue = 190;
        doc.text('SUB-TOTAL RD$', xLabel, y);
        doc.text(`${invoice.subtotal.toFixed(2)}`, xValue, y, { align: 'right' }); y += 6;
        // doc.text('ITBIS', xLabel, y); doc.text('0.00', xValue, y, { align: 'right' }); y += 6;
        doc.text('TOTAL RD$', xLabel, y);
        doc.text(`${invoice.total.toFixed(2)}`, xValue, y, { align: 'right' }); y += 8;
        doc.text(`Descuento: ${invoice.discountPercentage?.toFixed(2) ?? 0}%`, xLabel, y); y += 6;
        doc.text(`Pendiente: RD$ ${invoice.remainingAmount.toFixed(2)}`, xLabel, y); y += 8;
        if ((invoice.lateFeeAmount ?? 0) > 0) {
            doc.text(`Pendiente (con mora): RD$ ${(invoice.remainingAmount + (invoice.lateFeeAmount ?? 0)).toFixed(2)}`, xLabel, y); y += 8;
        }

        // Números de cuenta para transferencias y depósitos
        doc.setFontSize(12);
        doc.setTextColor(pink[0], pink[1], pink[2]);
        doc.text('Cuentas para Transferencias y Depósitos:', 10, y); y += 6;
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        doc.text('Banco Popular: 123-456789-0', 10, y); y += 5;
        doc.text('Banco Reservas: 987-654321-0', 10, y); y += 5;
        doc.text('Titular: Carmen Trinidad Guzmán', 10, y); y += 8;

        // Espacio para firma
        doc.setDrawColor(gray[0], gray[1], gray[2]);
        doc.line(10, y + 10, 80, y + 10);
        doc.text('Firma', 10, y + 15);

        doc.save(`factura_${invoice.invoiceNumber}.pdf`);
    };

    // Aplica y guarda el porcentaje y monto fijo de mora
    const applyLateFee = async () => {
        try {
            if (!invoice) return;
            const updatedInvoice = {
                ...invoice,
                lateFeePercentage: lateFee,
                lateFeeAmount: lateFeeAmount
            };
            await invoiceService.updateInvoice(updatedInvoice);
            if (onPaymentRegistered) onPaymentRegistered(updatedInvoice);
            if (onStatusChange) onStatusChange();
            setSnackbarMessage('Pago registrado correctamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setPaymentDialog({ open: false, amount: 0, installmentNumber: 0, method: '', attachment: '' });
        } catch (error: any) {
            console.error('Error registrando pago', error);
            setSnackbarMessage(error?.message || error?.error || JSON.stringify(error));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    return (
        <>
            <Modal open={open} onClose={onClose} aria-labelledby="payment-details-modal">
                <Paper ref={pdfRef} elevation={4} sx={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '90%', sm: '80%', md: 700 },
                    maxHeight: '90vh', overflowY: 'auto', p: 2
                }}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Detalles de Pago - Factura #{invoice?.invoiceNumber}</Typography>
                        {!isEditing && (
                            <Button variant="outlined" size="small" onClick={() => setIsEditing(true)}>
                                Editar
                            </Button>
                        )}
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    {/* Datos Generales */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <Typography variant="subtitle2" color="textSecondary">Estado</Typography>
                                {isAdmin ? (
                                    <FormControl fullWidth size="small">
                                        <Select value={selectedStatus} onChange={handleStatusChange}>
                                            {selectedStatus==='on_time' && (
                                                <MenuItem value={selectedStatus} disabled>{getStatusLabel(selectedStatus)}</MenuItem>
                                            )}
                                            {selectedStatus==='overdue' && (
                                                <MenuItem value={selectedStatus} disabled>{getStatusLabel(selectedStatus)}</MenuItem>
                                            )}
                                            <MenuItem value="paid">Pagada</MenuItem>
                                            <MenuItem value="cancelled">Cancelada</MenuItem>
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <>
                                        <Chip label={getStatusLabel(selectedStatus)} color={getStatusColor(selectedStatus)} />
                                    </>
                                )}
                                <Typography><strong>Cliente:</strong> {invoice.clientName}</Typography>
                                <Typography><strong>Fecha:</strong> {new Date(invoice.date).toLocaleDateString()}</Typography>
                                {isEditing ? (
                                    <>
                                        <TextField
                                            label="Dirección"
                                            fullWidth
                                            size="small"
                                            value={editedInvoice?.address || ''}
                                            onChange={e => setEditedInvoice(prev => prev && { ...prev, address: e.target.value })}
                                            sx={{ mb: 1 }}
                                        />
                                        <TextField
                                            label="Cédula"
                                            fullWidth
                                            size="small"
                                            value={editedInvoice?.cedula || ''}
                                            onChange={e => setEditedInvoice(prev => prev && { ...prev, cedula: formatCedula(e.target.value) })}
                                            sx={{ mb: 1 }}
                                            inputProps={{ maxLength: 13 }}
                                            helperText="Formato: 000-0000000-0"
                                        />
                                        <TextField
                                            label="Teléfono"
                                            fullWidth
                                            size="small"
                                            value={editedInvoice?.phone || ''}
                                            onChange={e => setEditedInvoice(prev => prev && { ...prev, phone: formatPhone(e.target.value) })}
                                            sx={{ mb: 1 }}
                                            inputProps={{ maxLength: 17 }}
                                            helperText="Formato: +1 (999) 999-9999"
                                        />
                                        <TextField
                                            label="Descuento (%)"
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={editedInvoice?.discountPercentage ?? 0}
                                            onChange={e => setEditedInvoice(prev => prev && { ...prev, discountPercentage: Number(e.target.value) })}
                                            sx={{ mb: 1 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        />
                                        <TextField
                                            label="Descuento RD$"
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={editedInvoice ? (editedInvoice.total * (editedInvoice.discountPercentage ?? 0) / 100).toFixed(2) : '0.00'}
                                            onChange={e => {
                                                const value = Number(e.target.value);
                                                setEditedInvoice(prev => prev && {
                                                    ...prev,
                                                    discountPercentage: prev.total > 0 ? (value / prev.total) * 100 : 0
                                                });
                                            }}
                                            sx={{ mb: 1 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">RD$</InputAdornment> }}
                                        />
                                        <TextField
                                            label="Mora (%)"
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={lateFee}
                                            onChange={e => {
                                                const porcentaje = Number(e.target.value);
                                                setLateFee(porcentaje);
                                                // Calcular el pendiente después de descuento y pagos
                                                const discount = editedInvoice ? editedInvoice.total * ((editedInvoice.discountPercentage ?? 0) / 100) : 0;
                                                const pagosRealizados = editedInvoice?.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
                                                const pendiente = editedInvoice ? editedInvoice.total - discount - pagosRealizados : 0;
                                                setLateFeeAmount(Number(((pendiente * porcentaje) / 100).toFixed(2)));
                                            }}
                                            sx={{ mb: 1 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        />
                                        <TextField
                                            label="Mora RD$"
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={lateFeeAmount}
                                            onChange={e => {
                                                const value = Number(e.target.value);
                                                setLateFeeAmount(value);
                                                // Calcular el pendiente después de descuento y pagos
                                                const discount = editedInvoice ? editedInvoice.total * ((editedInvoice.discountPercentage ?? 0) / 100) : 0;
                                                const pagosRealizados = editedInvoice?.payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
                                                const pendiente = editedInvoice ? editedInvoice.total - discount - pagosRealizados : 0;
                                                setLateFee(pendiente > 0 ? Number(((value / pendiente) * 100).toFixed(2)) : 0);
                                            }}
                                            sx={{ mb: 1 }}
                                            InputProps={{ endAdornment: <InputAdornment position="end">RD$</InputAdornment> }}
                                        />
                                        <Stack direction="row" spacing={1} mt={1}>
                                            <Button variant="contained" color="primary" onClick={handleSaveEdit}>Guardar</Button>
                                            <Button variant="outlined" color="secondary" onClick={() => { setIsEditing(false); setEditedInvoice(invoice); }}>Cancelar</Button>
                                        </Stack>
                                    </>
                                ) : (
                                    <>
                                        {invoice.address && <Typography><strong>Dirección:</strong> {invoice.address}</Typography>}
                                        {invoice.cedula && <Typography><strong>Cédula:</strong> {formatCedula(invoice.cedula)}</Typography>}
                                        {invoice.phone && <Typography><strong>Teléfono:</strong> {formatPhone(invoice.phone)}</Typography>}
                                    </>
                                )}
                                <Typography><strong>Total:</strong> RD$ {invoice.total.toFixed(2)}</Typography>
                                <Typography><strong>Descuento:</strong> {invoice.discountPercentage?.toFixed(2) ?? 0}%</Typography>
                                <Typography><strong>Pendiente:</strong> RD$ {invoice.remainingAmount.toFixed(2)}</Typography>
                                {(invoice.lateFeeAmount ?? 0) > 0 && (
                                    <Typography sx={{ mt: 0.5 }}><strong>Pendiente (con mora):</strong> RD$ {(invoice.remainingAmount + (invoice.lateFeeAmount ?? 0)).toFixed(2)}</Typography>
                                )}
                                {/* Mostrar mora automáticamente si es contado y está retrasada */}
                                {invoice.paymentType === 'cash' && invoice.status === 'delayed' && (
                                    <Box sx={{ display:'flex', flexDirection: 'column', gap:1, mt:1 }}>
                                        <Typography variant="subtitle2" color="error">
                                            <strong>¡Atención!</strong> Factura con mora por incumplimiento de pago
                                        </Typography>
                                        <Typography>
                                            <strong>Mora aplicada:</strong> {lateFee}% ({lateFeeAmount.toFixed(2)} RD$)
                                        </Typography>
                                        
                                    </Box>
                                )}
                                {isAdmin && (
                                    <Box sx={{ display:'flex', alignItems:'center', gap:1, mt:1 }}>
                                        <TextField
                                            label="Mora (%)"
                                            type="number"
                                            size="small"
                                            value={lateFee}
                                            onChange={e => setLateFee(Number(e.target.value))}
                                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        />
                                        <TextField
                                            label="Mora RD$"
                                            type="number"
                                            size="small"
                                            value={lateFeeAmount}
                                            onChange={e => setLateFeeAmount(Number(e.target.value))}
                                            InputProps={{ endAdornment: <InputAdornment position="end">RD$</InputAdornment> }}
                                        />
                                        <Button variant="outlined" size="small" onClick={applyLateFee}>Aplicar Mora</Button>
                                    </Box>
                                )}
                                
                                {statusInfo.daysRemaining && (
                                    <Typography>
                                        {statusInfo.daysRemaining === 1 ? 'Falta' : 'Faltan'} {statusInfo.daysRemaining} {statusInfo.daysRemaining === 1 ? 'día' : 'días'} para el próximo pago
                                    </Typography>
                                )}
                                {statusInfo.daysLate && (
                                    <Typography color="error">
                                        Retraso de {statusInfo.daysLate} {statusInfo.daysLate === 1 ? 'día' : 'días'}
                                    </Typography>
                                )}
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            {invoiceSignedUrl && (
                                <Paper variant="outlined" sx={{ p:1, textAlign:'center' }}>
                                    <Box component="img" src={invoiceSignedUrl} alt="Factura" sx={{ maxWidth:'100%', maxHeight:200, cursor:'zoom-in' }} onClick={() => setImageDialogOpen(true)} />
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>Productos</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell align="right">Cantidad</TableCell>
                                    <TableCell align="right">Precio Unit.</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoice.items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">RD$ {item.unitPrice.toFixed(2)}</TableCell>
                                        <TableCell align="right">RD$ {item.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Historial de Pagos */}
                    {paymentHistory.length > 0 && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom>Historial de Pagos</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Fecha</TableCell>
                                            <TableCell align="right">Monto</TableCell>
                                            <TableCell>Cuota N°</TableCell>
                                            <TableCell>Método</TableCell>
                                            <TableCell>Registrado por</TableCell>
                                            <TableCell>Adjunto</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paymentHistory.map((p, idx) => (
                                            <TableRow key={p.id} hover>
                                                <TableCell>{idx+1}</TableCell>
                                                <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                                                <TableCell align="right">RD$ {p.amount.toFixed(2)}</TableCell>
                                                <TableCell>{p.installmentNumber}</TableCell>
                                                <TableCell>{p.method}</TableCell>
                                                <TableCell>{p.createdByName ?? '-'}</TableCell>
                                                <TableCell>{p.attachment ? <a href={p.attachment} target="_blank" rel="noopener noreferrer">Ver</a> : '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                    {/* Acciones Finales */}
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        {invoice.paymentPlan && (
                            <Button variant="contained" onClick={() => navigate('/admin/payment/register', { state: { invoiceId: invoice.id } })}>
                                Registrar Pago
                            </Button>
                        )}
                        <Button onClick={handleExportPDF} variant="outlined">Exportar a PDF</Button>
                        <Button onClick={onClose} variant="contained" sx={{ bgcolor:'#E31C79','&:hover':{bgcolor:'#C4156A'} }}>Cerrar</Button>
                    </Stack>
                </Paper>
            </Modal>
            {/* Confirmar cambio de estado */}
            <Dialog
                open={confirmDialog.open}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="confirm-status-title"
            >
                <DialogTitle id="confirm-status-title">Confirmar cambio de estado</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Una vez cambiado el estado, no podrá volver a establecerlo como 'A tiempo'.
                    </Alert>
                    <Typography>
                        ¿Desea cambiar el estado de <strong>{getStatusLabel(confirmDialog.currentStatus)}</strong> a <strong>{getStatusLabel(confirmDialog.newStatus)}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
                    <Button onClick={handleConfirmStatusChange} variant="contained" sx={{ bgcolor: '#E31C79', '&:hover': { bgcolor: '#C4156A' } }}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Visor de imagen ampliada */}
            <Dialog
                open={imageDialogOpen}
                onClose={() => setImageDialogOpen(false)}
                maxWidth="lg"
                PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}
            >
                <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {invoiceSignedUrl && (
                        <Box
                            component="img"
                            src={invoiceSignedUrl}
                            alt="Factura Ampliada"
                            sx={{ width: '100%', height: 'auto', cursor: 'zoom-out' }}
                            onClick={() => setImageDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
            {/* Snackbar para feedback de pago */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            {/* Diálogo de registro de pago */}
            <Dialog open={paymentDialog.open} onClose={handleClosePaymentDialog} fullWidth maxWidth="sm">
                <DialogTitle>Registrar Pago</DialogTitle>
                <DialogContent>
                    {(invoice.lateFeeAmount ?? 0) > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Hay mora pendiente de RD$ {(invoice.lateFeeAmount ?? 0).toFixed(2)}. Se aplicará primero.
                        </Alert>
                    )}
                    <Typography><strong>Pendiente capital:</strong> RD$ {invoice.remainingAmount.toFixed(2)}</Typography>
                    <TextField
                        label="Monto a pagar"
                        type="number"
                        fullWidth
                        value={paymentDialog.amount}
                        onChange={e => setPaymentDialog(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        select
                        label="Método de pago"
                        fullWidth
                        value={paymentDialog.method}
                        onChange={e => setPaymentDialog(prev => ({ ...prev, method: e.target.value }))}
                        sx={{ mt: 2 }}
                    >
                        <MenuItem value="cash">Efectivo</MenuItem>
                        <MenuItem value="transfer">Transferencia</MenuItem>
                        <MenuItem value="deposit">Depósito</MenuItem>
                    </TextField>
                    <Button variant="outlined" component="label" sx={{ mt: 2 }}>
                        Adjuntar comprobante
                        <input type="file" hidden onChange={handlePaymentFileChange} />
                    </Button>
                    {paymentAttachmentPreview && (
                        <Box component="img" src={paymentAttachmentPreview} alt="Comprobante" sx={{ width: '100%', mt: 1 }} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={registerPayment} disabled={paymentDialog.amount <= 0}>Registrar</Button>
                    <Button onClick={handleClosePaymentDialog}>Cancelar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default PaymentDetailsModal;