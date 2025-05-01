import React, { useState, useEffect, useRef } from 'react';
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
    TextField
} from '@mui/material';
import { Invoice, Payment } from '../../types/invoice';
import { auth } from '../../services/auth';
import { invoiceService } from '../../services/invoiceService';
import { paymentService } from '../../services/paymentService';
import { v4 as uuidv4 } from 'uuid';
import { addFrequency, calculateDaysRemaining } from '../../utils/dateUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const [paymentAttachmentPreview, setPaymentAttachmentPreview] = useState<string | null>(null);
    const [invoiceAttachmentPreview, setInvoiceAttachmentPreview] = useState<string | null>(null);
    const isAdmin = auth.getCurrentUser()?.role === 'admin';
    const pdfRef = useRef<HTMLDivElement>(null);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);

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
        if (invoiceAttachmentPreview) {
            editedInvoice.attachment = invoiceAttachmentPreview;
        }
        await invoiceService.updateInvoice(editedInvoice);
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

    const handleConfirmStatusChange = async () => {
        const { newStatus } = confirmDialog;
        setSelectedStatus(newStatus);
        
        // Actualizar el estado en el almacenamiento
        const updatedInvoice = { ...invoice, status: newStatus as 'paid' | 'cancelled' };
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
            setPaymentAttachmentPreview(URL.createObjectURL(file));
        }
    };

    // Función para registrar el pago de la siguiente cuota
    const registerPayment = async () => {
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
            remainingAmount: invoice.remainingAmount - amount,
            status: installmentNumber >= plan.totalInstallments ? 'paid' : statusForPayment
        };
        await invoiceService.updateInvoice(updatedInvoice);
        if (onPaymentRegistered) onPaymentRegistered(updatedInvoice);
        if (onStatusChange) onStatusChange();
        setPaymentDialog({ open: false });
    };

    const handleExportPDF = async () => {
        if (!pdfRef.current || !invoice) return;
        const el = pdfRef.current;
        // Guardar estilos originales
        const origMaxHeight = el.style.maxHeight;
        const origOverflow = el.style.overflowY;
        // Expandir totalmente
        el.style.maxHeight = 'none';
        el.style.overflowY = 'visible';
        // Dejar aplicar estilo
        await new Promise(resolve => setTimeout(resolve, 100));
        // Capturar
        const canvas = await html2canvas(el);
        // Revertir estilos
        el.style.maxHeight = origMaxHeight;
        el.style.overflowY = origOverflow;
        // Generar PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`factura_${invoice.invoiceNumber}.pdf`);
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
              {isAdmin && (
                isEditing ? (
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="primary" onClick={handleSaveEdit}>Guardar</Button>
                    <Button variant="outlined" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  </Stack>
                ) : (
                  <Button variant="outlined" onClick={() => setIsEditing(true)}>Editar</Button>
                )
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
                        {(selectedStatus==='pending'||selectedStatus==='delayed'||selectedStatus==='on_time') && (
                          <MenuItem value={selectedStatus} disabled>{getStatusLabel(selectedStatus)}</MenuItem>
                        )}
                        <MenuItem value="paid">Pagada</MenuItem>
                        <MenuItem value="cancelled">Cancelada</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip label={getStatusLabel(invoice.status)} color={getStatusColor(invoice.status)} />
                  )}
                  <Typography><strong>Cliente:</strong> {invoice.clientName}</Typography>
                  <Typography><strong>Fecha:</strong> {new Date(invoice.date).toLocaleDateString()}</Typography>
                  {invoice.address && <Typography><strong>Dirección:</strong> {invoice.address}</Typography>}
                  {invoice.cedula && <Typography><strong>Cédula:</strong> {invoice.cedula}</Typography>}
                  {invoice.phone && <Typography><strong>Teléfono:</strong> {invoice.phone}</Typography>}
                  <Typography><strong>Total:</strong> RD$ {invoice.total.toFixed(2)}</Typography>
                  <Typography><strong>Pendiente:</strong> RD$ {invoice.remainingAmount.toFixed(2)}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                {invoice.attachment && (
                  <Paper variant="outlined" sx={{ p:1, textAlign:'center' }}>
                    <Box component="img" src={invoice.attachment} alt="Factura" sx={{ maxWidth:'100%', maxHeight:200, cursor:'zoom-in' }} onClick={() => setImageDialogOpen(true)} />
                  </Paper>
                )}
              </Grid>
            </Grid>
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
              Una vez cambiado el estado, no podrá volver a pendiente.
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
            <Box
              component="img"
              src={invoice?.attachment!}
              alt="Factura Ampliada"
              sx={{ width: '100%', height: 'auto', cursor: 'zoom-out' }}
              onClick={() => setImageDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
        </>
    );
}; 