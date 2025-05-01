import React, { useState, useEffect } from 'react';
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
    TextField
} from '@mui/material';
import { Invoice, Payment } from '../../types/invoice';
import { auth } from '../../services/auth';
import { storage } from '../../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { addFrequency, calculateDaysRemaining } from '../../utils/dateUtils';

interface PaymentDetailsModalProps {
    open: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onStatusChange?: () => void; // Callback para notificar cambios
    onPaymentRegistered?: (invoice: Invoice) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
    open,
    onClose,
    invoice,
    onStatusChange,
    onPaymentRegistered
}) => {
    const [selectedStatus, setSelectedStatus] = useState<string>('pending');
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        currentStatus: string;
        newStatus: string;
    }>({
        open: false,
        currentStatus: '',
        newStatus: ''
    });
    const [paymentDialog, setPaymentDialog] = useState<{ open: boolean }>({ open: false });
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedInvoice, setEditedInvoice] = useState<Invoice | null>(null);
    const [imageDialogOpen, setImageDialogOpen] = useState<boolean>(false);
    const [paymentAttachmentFile, setPaymentAttachmentFile] = useState<File | null>(null);
    const [paymentAttachmentPreview, setPaymentAttachmentPreview] = useState<string | null>(null);
    const [invoiceAttachmentFile, setInvoiceAttachmentFile] = useState<File | null>(null);
    const [invoiceAttachmentPreview, setInvoiceAttachmentPreview] = useState<string | null>(null);
    const isAdmin = auth.getCurrentUser()?.role === 'admin';

    useEffect(() => {
        if (invoice) {
            setSelectedStatus(invoice.status);
            setEditedInvoice(invoice);
            setIsEditing(false);
            setInvoiceAttachmentPreview(invoice.attachment || null);
        }
    }, [invoice]);

    useEffect(() => {
        if (invoice) {
            setSelectedStatus(invoice.status);
        }
    }, [invoice]);

    const handleSaveEdit = () => {
        if (!editedInvoice) return;
        if (invoiceAttachmentPreview) {
            editedInvoice.attachment = invoiceAttachmentPreview;
        }
        storage.updateInvoice(editedInvoice);
        if (onPaymentRegistered) onPaymentRegistered(editedInvoice);
        setIsEditing(false);
    };

    if (!invoice) return null;

    const handleStatusChange = (event: SelectChangeEvent) => {
        const newStatus = event.target.value;
        
        // Solo permitir cambios a "cancelled" o "paid"
        if (newStatus !== 'cancelled' && newStatus !== 'paid') {
            return;
        }

        setConfirmDialog({
            open: true,
            currentStatus: selectedStatus,
            newStatus
        });
    };

    const handleConfirmStatusChange = () => {
        const { newStatus } = confirmDialog;
        setSelectedStatus(newStatus);
        
        // Actualizar el estado en el almacenamiento
        const updatedInvoice = { ...invoice, status: newStatus as 'paid' | 'cancelled' };
        storage.updateInvoice(updatedInvoice);

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
            pending: 'warning',
            paid: 'success',
            delayed: 'error',
            cancelled: 'error',
            on_time: 'success'
        };
        return colors[status] || 'default';
    };

    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'Pendiente',
            delayed: 'Retrasado',
            on_time: 'En Tiempo'
        };
        return labels[status] || status;
    };

    // Abre/cierra el diálogo de registro de pago
    const handleOpenPaymentDialog = () => setPaymentDialog({ open: true });
    const handleClosePaymentDialog = () => setPaymentDialog({ open: false });

    const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentAttachmentFile(file);
            const reader = new FileReader();
            reader.onload = () => setPaymentAttachmentPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Función para registrar el pago de la siguiente cuota
    const registerPayment = () => {
        if (!invoice.paymentPlan) return;
        const plan = invoice.paymentPlan;
        const installmentNumber = plan.paidInstallments + 1;
        const amount = plan.installmentAmount;
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

        // Construir factura actualizada
        const updatedInvoice: Invoice = {
            ...invoice,
            payments: [...(invoice.payments || []), newPayment],
            paymentPlan: {
                ...plan,
                paidInstallments: installmentNumber,
                nextPaymentDate: installmentNumber < plan.totalInstallments ? (() => {
                    return addFrequency(new Date(plan.nextPaymentDate!), plan.frequency).toISOString();
                })() : undefined
            },
            remainingAmount: invoice.remainingAmount - amount,
            status: installmentNumber >= plan.totalInstallments ? 'paid' : statusForPayment
        };
        storage.updateInvoice(updatedInvoice);
        if (onPaymentRegistered) onPaymentRegistered(updatedInvoice);
        if (onStatusChange) onStatusChange();
        setPaymentDialog({ open: false });

        // Si existe una imagen seleccionada, añadimos el attachment al pago
        if (paymentAttachmentPreview) {
            newPayment.attachment = paymentAttachmentPreview;
        }
    };

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                aria-labelledby="payment-details-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: 800,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                            Detalles de Pago - Factura #{invoice?.invoiceNumber}
                        </Typography>
                        {isAdmin && (
                            isEditing ? (
                                <Box>
                                    <Button variant="contained" color="primary" onClick={handleSaveEdit} sx={{ mr:1 }}>Guardar</Button>
                                    <Button variant="outlined" onClick={() => setIsEditing(false)}>Cancelar</Button>
                                </Box>
                            ) : (
                                <Button variant="outlined" onClick={() => setIsEditing(true)}>Editar</Button>
                            )
                        )}
                    </Box>

                    {isEditing && editedInvoice ? (
                        <Box component="form" noValidate>
                            <TextField fullWidth label="No. Factura" value={editedInvoice.invoiceNumber} onChange={e => setEditedInvoice({...editedInvoice, invoiceNumber: e.target.value})} sx={{ mb:2 }} />
                            <TextField fullWidth type="date" label="Fecha" value={editedInvoice.date} onChange={e => setEditedInvoice({...editedInvoice, date: e.target.value})} InputLabelProps={{ shrink: true }} sx={{ mb:2 }} />
                            <TextField fullWidth label="Cliente" value={editedInvoice.clientName} onChange={e => setEditedInvoice({...editedInvoice, clientName: e.target.value})} sx={{ mb:2 }} />
                            <TextField fullWidth label="Dirección" value={editedInvoice.address||''} onChange={e => setEditedInvoice({...editedInvoice, address: e.target.value||undefined})} sx={{ mb:2 }} />
                            <TextField fullWidth label="Cédula" value={editedInvoice.cedula||''} onChange={e => setEditedInvoice({...editedInvoice, cedula: e.target.value||undefined})} sx={{ mb:2 }} />
                            <TextField fullWidth label="Teléfono" value={editedInvoice.phone||''} onChange={e => setEditedInvoice({...editedInvoice, phone: e.target.value||undefined})} sx={{ mb:2 }} />
                            <Box sx={{ mb:2 }}>
                                <Button variant="contained" component="label" sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}>
                                    Subir Imagen de Factura
                                    <input type="file" hidden accept="image/*" onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setInvoiceAttachmentFile(file);
                                            const reader = new FileReader();
                                            reader.onload = () => setInvoiceAttachmentPreview(reader.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }} />
                                </Button>
                                {invoiceAttachmentPreview && (
                                    <Box component="img" src={invoiceAttachmentPreview} alt="Previsualización" sx={{ mt:2, maxWidth:'100%', maxHeight:200 }} />
                                )}
                            </Box>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="subtitle1" gutterBottom>
                                Estado: 
                                {isAdmin ? (
                                    <FormControl sx={{ ml: 2, minWidth: 120 }}>
                                        <Select
                                            value={selectedStatus}
                                            onChange={handleStatusChange}
                                            size="small"
                                        >
                                            {(selectedStatus === 'pending' || 
                                              selectedStatus === 'delayed' || 
                                              selectedStatus === 'on_time') && (
                                                <MenuItem value={selectedStatus} disabled>
                                                    {getStatusLabel(selectedStatus)}
                                                </MenuItem>
                                            )}
                                            <MenuItem value="paid">Pagada</MenuItem>
                                            <MenuItem value="cancelled">Cancelada</MenuItem>
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <Chip 
                                        label={getStatusLabel(invoice.status)}
                                        color={getStatusColor(invoice.status)}
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Typography>
                            <Typography>Cliente: {invoice.clientName}</Typography>
                            <Typography>Fecha: {invoice.date}</Typography>
                            {invoice.address && <Typography>Dirección: {invoice.address}</Typography>}
                            {invoice.cedula && <Typography>Cédula: {invoice.cedula}</Typography>}
                            {invoice.phone && <Typography>Teléfono: {invoice.phone}</Typography>}
                        </>
                    )}
                    <Typography>Monto Total: RD$ {invoice.total.toFixed(2)}</Typography>
                    <Typography>Monto Pendiente: RD$ {invoice.remainingAmount.toFixed(2)}</Typography>
                    {invoice.attachment && (
                        <Box
                            component="img"
                            src={invoice.attachment}
                            alt="Imagen Factura"
                            sx={{ mt: 2, maxWidth: '100%', maxHeight: 200, cursor: 'zoom-in' }}
                            onClick={() => setImageDialogOpen(true)}
                        />
                    )}

                    {invoice.paymentType === 'credit' && invoice.paymentPlan && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Plan de Pago</Typography>
                            <Typography>Frecuencia: {invoice.paymentPlan.frequency}</Typography>
                            <Typography>Monto por Cuota: RD$ {invoice.paymentPlan.installmentAmount.toFixed(2)}</Typography>
                            <Typography>Pagos Realizados: {invoice.paymentPlan.paidInstallments} de {invoice.paymentPlan.totalInstallments}</Typography>
                            {invoice.paymentPlan.nextPaymentDate && (
                                <>
                                    <Typography>
                                        Próximo Pago: {new Date(invoice.paymentPlan.nextPaymentDate).toLocaleDateString()}
                                    </Typography>
                                    <Typography sx={{ 
                                        color: calculateDaysRemaining(new Date(invoice.paymentPlan.nextPaymentDate!)) < 0 ? 'error.main' : 'inherit'
                                    }}>
                                        Días Restantes: {calculateDaysRemaining(new Date(invoice.paymentPlan.nextPaymentDate!))}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}

                    {isAdmin && invoice.paymentType === 'credit' && invoice.paymentPlan && invoice.paymentPlan.paidInstallments < invoice.paymentPlan.totalInstallments && (
                        <Box sx={{ mb: 2 }}>
                            <Button  
                                variant="contained"  
                                onClick={handleOpenPaymentDialog}
                                sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}
                            >
                                Registrar Pago Cuota {invoice.paymentPlan.paidInstallments + 1}
                            </Button>
                        </Box>
                    )}

                    {invoice.payments && invoice.payments.length > 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Historial de Pagos</Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Fecha</TableCell>
                                            <TableCell>No. Cuota</TableCell>
                                            <TableCell align="right">Monto</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {invoice.payments.map((payment: Payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    {new Date(payment.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{payment.installmentNumber}</TableCell>
                                                <TableCell align="right">
                                                    RD$ {payment.amount.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                        <Button onClick={onClose} variant="contained" sx={{
                            backgroundColor: '#E31C79',
                            '&:hover': {
                                backgroundColor: '#C4156A',
                            },
                        }}>
                            Cerrar
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Dialog
                open={confirmDialog.open}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"¿Confirmar cambio de estado?"}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Una vez cambiado el estado, no podrá volver a establecerlo como pendiente.
                    </Alert>
                    <Typography>
                        ¿Está seguro que desea cambiar el estado de la factura de{' '}
                        <strong>{getStatusLabel(confirmDialog.currentStatus)}</strong> a{' '}
                        <strong>{getStatusLabel(confirmDialog.newStatus)}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseConfirmDialog}
                        sx={{ color: '#666' }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmStatusChange}
                        variant="contained"
                        sx={{
                            backgroundColor: '#E31C79',
                            '&:hover': {
                                backgroundColor: '#C4156A',
                            },
                        }}
                        autoFocus
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {invoice.paymentPlan && (
                <Dialog open={paymentDialog.open} onClose={handleClosePaymentDialog}>
                    <DialogTitle>Confirmar Pago</DialogTitle>
                    <DialogContent>
                        <Typography>
                            ¿Deseas registrar el pago de la cuota {invoice.paymentPlan.paidInstallments + 1} por RD$ {invoice.paymentPlan.installmentAmount.toFixed(2)}?
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" component="label" sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}>
                                Subir Comprobante de Pago
                                <input type="file" hidden accept="image/*" onChange={handlePaymentFileChange} />
                            </Button>
                            {paymentAttachmentPreview && (
                                <Box component="img" src={paymentAttachmentPreview} alt="Comprobante" sx={{ mt: 2, maxWidth: '100%', maxHeight: 200 }} />
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClosePaymentDialog}>Cancelar</Button>
                        <Button
                            onClick={registerPayment}
                            variant="contained"
                            sx={{ backgroundColor: '#E31C79', '&:hover': { backgroundColor: '#C4156A' } }}
                        >
                            Confirmar
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Image viewer dialog */}
            <Dialog
                open={imageDialogOpen}
                onClose={() => setImageDialogOpen(false)}
                maxWidth="lg"
                PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}
            >
                <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box
                        component="img"
                        src={invoice.attachment!}
                        alt="Factura Ampliada"
                        sx={{ width: '100%', height: 'auto', cursor: 'zoom-out' }}
                        onClick={() => setImageDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}; 