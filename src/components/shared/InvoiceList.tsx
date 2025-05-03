import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    SelectChangeEvent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    TextField,
    InputLabel,
    Grid,
    InputAdornment
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { Invoice } from '../../types/invoice';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { invoiceService } from '../../services/invoiceService';
import { auth } from '../../services/auth';
import { computeInvoiceStatus } from '../../utils/statusUtils';

// Props para el componente InvoiceList
interface InvoiceListProps {
    invoices: Invoice[];
    title?: string;
    onInvoicesChange?: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ 
    invoices: initialInvoices,
    title = 'Facturas',
    onInvoicesChange
}) => {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    // Estado para desencadenar recálculo cada minuto
    const [now, setNow] = useState<Date>(new Date());
    // Búsqueda por número de factura o cliente
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Contador animado del total de facturas
    const [displayCount, setDisplayCount] = useState(0);
    // Efecto para actualizar 'now' cada minuto y disparar recálculo de estado
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        setInvoices(initialInvoices);
    }, [initialInvoices, now]);

    // Animar conteo del total al montar o cuando cambian las facturas
    useEffect(() => {
        const total = invoices.length;
        let current = 0;
        const duration = 1000; // ms
        const step = 50; // ms
        const increment = Math.ceil(total / (duration / step));
        const timer = setInterval(() => {
            current += increment;
            if (current >= total) {
                current = total;
                clearInterval(timer);
            }
            setDisplayCount(current);
        }, step);
        return () => clearInterval(timer);
    }, [invoices.length]);

    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    useEffect(() => {
        if (selectedInvoice) {
            const updated = initialInvoices.find((inv: Invoice) => inv.id === selectedInvoice.id) || null;
            setSelectedInvoice(updated);
        }
    }, [initialInvoices, now]);

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        currentStatus: string;
        newStatus: string;
        invoiceId: string;
    }>({
        open: false,
        currentStatus: '',
        newStatus: '',
        invoiceId: ''
    });
    const isAdmin = auth.isAdmin();

    // Filtros
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [userFilter, setUserFilter] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    // Opciones de usuarios (clientes)
    const clientOptions = Array.from(new Set(invoices.map(inv => inv.clientName)));

    // Recalcular estado dinámico basado en now
    const invoicesWithStatus = invoices.map(inv => {
        if (inv.paymentType === 'credit' && inv.paymentPlan) {
            return { ...inv, status: computeInvoiceStatus(inv) };
        }
        return inv;
    });
    // Facturas filtradas según criterios y búsqueda
    const filteredInvoices = invoicesWithStatus.filter(inv => {
        return (statusFilter === '' || inv.status === statusFilter)
            && (typeFilter === '' || inv.paymentType === typeFilter)
            && (userFilter === '' || inv.clientName === userFilter)
            && (dateFrom === '' || new Date(inv.date) >= new Date(dateFrom))
            && (dateTo === '' || new Date(inv.date) <= new Date(dateTo))
            && (searchQuery === ''
                || inv.invoiceNumber.includes(searchQuery)
                || inv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
            );
    });

    const clearFilters = () => {
        setStatusFilter(''); setTypeFilter(''); setUserFilter(''); setDateFrom(''); setDateTo('');
    };

    const handleOpenModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
    };

    const handleCloseModal = () => {
        setSelectedInvoice(null);
    };

    const handleStatusChange = (invoiceId: string, newStatus: string) => {
        if (newStatus !== 'cancelled' && newStatus !== 'paid') {
            return;
        }

        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        setConfirmDialog({
            open: true,
            currentStatus: invoice.status,
            newStatus,
            invoiceId
        });
    };

    const handleConfirmStatusChange = async () => {
        const { invoiceId, newStatus } = confirmDialog;
        
        const inv = invoices.find(i => i.id === invoiceId);
        if (inv) {
            const updatedInv = { ...inv, status: newStatus as 'paid' | 'cancelled' };
            await invoiceService.updateInvoice(updatedInv);
            setInvoices(invoices.map(i => i.id === invoiceId ? updatedInv : i));
            if (onInvoicesChange) onInvoicesChange();
        }

        setConfirmDialog(prev => ({ ...prev, open: false }));
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
    };

    // Colorea estados: 'pending', 'on_time', 'paid', 'delayed', 'cancelled'
    const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        switch (status) {
            case 'pending': return 'warning';
            case 'on_time': return 'success';
            case 'paid': return 'primary';   // pagada en azul
            case 'delayed': return 'error';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            pending: 'Pendiente',
            paid: 'Pagada',
            delayed: 'Retrasada',
            cancelled: 'Cancelada',
            on_time: 'A tiempo'
        };
        return labels[status] || status;
    };

    // Handler tras registrar un pago: actualiza la lista y el invoice seleccionado
    const handlePaymentRegistered = (updatedInvoice: Invoice) => {
        const updatedInvoices = invoices.map(inv =>
            inv.id === updatedInvoice.id ? updatedInvoice : inv
        );
        setInvoices(updatedInvoices);
        setSelectedInvoice(updatedInvoice);
        if (onInvoicesChange) {
            onInvoicesChange();
        }
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ color: '#E31C79', mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
                Total de facturas: {displayCount}
            </Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Campo de búsqueda */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Buscar factura/cliente"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id="filter-status-label">Estado</InputLabel>
                            <Select
                                labelId="filter-status-label"
                                label="Estado"
                                value={statusFilter}
                                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="pending">Pendiente</MenuItem>
                                <MenuItem value="on_time">A tiempo</MenuItem>
                                <MenuItem value="paid">Pagada</MenuItem>
                                <MenuItem value="delayed">Retrasada</MenuItem>
                                <MenuItem value="cancelled">Cancelada</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id="filter-type-label">Tipo</InputLabel>
                            <Select
                                labelId="filter-type-label"
                                label="Tipo"
                                value={typeFilter}
                                onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="cash">Contado</MenuItem>
                                <MenuItem value="credit">Crédito</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id="filter-user-label">Usuario</InputLabel>
                            <Select
                                labelId="filter-user-label"
                                label="Usuario"
                                value={userFilter}
                                onChange={(e: SelectChangeEvent) => setUserFilter(e.target.value)}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {clientOptions.map(name => (
                                    <MenuItem key={name} value={name}>{name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField fullWidth size="small" label="Desde" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField fullWidth size="small" label="Hasta" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <Button fullWidth variant="outlined" onClick={clearFilters}>Limpiar</Button>
                    </Grid>
                </Grid>
            </Paper>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>No. Factura</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Pendiente</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredInvoices.map((invoice, index) => (
                            <TableRow 
                                key={invoice.id}
                                sx={{
                                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                                    '&:hover': {
                                        backgroundColor: 'rgba(227, 28, 121, 0.04)',
                                    }
                                }}
                            >
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{index + 1}</TableCell>
                                <TableCell>{invoice.invoiceNumber}</TableCell>
                                <TableCell>
                                    {invoice.date}
                                </TableCell>
                                <TableCell>{invoice.clientName}</TableCell>
                                <TableCell>
                                    {invoice.paymentType === 'credit' ? 'Crédito' : 'Contado'}
                                </TableCell>
                                <TableCell>
                                    {isAdmin ? (
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <Select
                                                value={invoice.status}
                                                onChange={(e: SelectChangeEvent) => handleStatusChange(invoice.id, e.target.value)}
                                                sx={{
                                                    backgroundColor: `${getStatusColor(invoice.status)}.light`,
                                                    '& .MuiSelect-select': {
                                                        py: 0.5,
                                                    }
                                                }}
                                            >
                                                {(invoice.status === 'pending' || 
                                                  invoice.status === 'delayed' || 
                                                  invoice.status === 'on_time') && (
                                                    <MenuItem value={invoice.status} disabled>
                                                        {getStatusLabel(invoice.status)}
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
                                            size="small"
                                        />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    RD$ {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell align="right">
                                    RD$ {invoice.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        onClick={() => handleOpenModal(invoice)}
                                        sx={{ color: '#E31C79' }}
                                        size="small"
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <PaymentDetailsModal
                open={selectedInvoice !== null}
                onClose={handleCloseModal}
                invoice={selectedInvoice}
                onStatusChange={onInvoicesChange}
                onPaymentRegistered={handlePaymentRegistered}
            />

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
        </Box>
    );
}; 