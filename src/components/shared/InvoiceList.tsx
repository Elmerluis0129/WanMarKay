import React, { useState, useEffect } from 'react';
import {
    Box,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    ListItemText,
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
import { useQuery } from '@tanstack/react-query';
import { Loader } from './Loader';

// Props para el componente InvoiceList
interface InvoiceListProps {
    invoices: Invoice[];
    title?: string;
    onInvoicesChange?: () => void;
    totalInvoices?: number; // total general de facturas
    onSearchChange?: (query: string) => void;
}

// Funciones para resaltar texto en búsqueda
const escapeRegExp = (s: string): string => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
const highlightText = (text: string, highlight: string): React.ReactNode => {
  if (!highlight) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
  const lowered = highlight.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === lowered ? <span key={i} style={{ backgroundColor: 'yellow' }}>{part}</span> : part
  );
};

export const InvoiceList: React.FC<InvoiceListProps> = ({ 
    invoices: initialInvoices,
    title = 'Facturas',
    onInvoicesChange,
    totalInvoices,
    onSearchChange
}) => {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    // Estado para desencadenar recálculo cada minuto
    const [now, setNow] = useState<Date>(new Date());
    // Estados para búsqueda con debounce
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

    // Efecto para manejar la búsqueda con debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery(searchTerm);
            onSearchChange?.(searchTerm);
        }, 500); // 500ms de retraso

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, onSearchChange]);

    // Búsqueda por número de factura o cliente
    const { data: allInvoices, isLoading: loadingAll } = useQuery<Invoice[], Error>({
        queryKey: ['invoicesAll', searchQuery],
        queryFn: () => invoiceService.getAllInvoices(),
        enabled: searchQuery.length > 0,
        staleTime: 300000,
    });
    const allInvoicesWithStatus = (allInvoices || []).map(inv => ({
        ...inv,
        status: computeInvoiceStatus(inv).status
    }));

    // Contador animado del total de facturas
    const [displayCount, setDisplayCount] = useState(0);
    // Efecto para actualizar 'now' cada minuto y disparar recálculo de estado
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        // Actualizar el estado de cada factura basado en la fecha actual
        const updatedInvoices = initialInvoices.map((invoice) => ({
            ...invoice,
            status: computeInvoiceStatus(invoice).status
        }));
        setInvoices(updatedInvoices);
    }, [initialInvoices, now]);

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
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [userFilter, setUserFilter] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    
    // Eliminamos los estados de paginación ya que no los necesitaremos

    // Opciones de usuarios (clientes)
    const clientOptions = Array.from(new Set(invoices.map(inv => inv.clientName)));

    // Recalcular estado dinámico basado en now
    const invoicesWithStatus = invoices.map(inv => {
        if (inv.paymentType === 'credit' && inv.paymentPlan) {
            return { ...inv, status: computeInvoiceStatus(inv).status };
        }
        return inv;
    });
    
    const invoicesToFilter = searchQuery
        ? allInvoicesWithStatus
        : invoicesWithStatus;
        
    // Facturas filtradas según criterios y búsqueda
    const filteredInvoices = invoicesToFilter.filter(inv => {
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(inv.status);
        const matchesType = typeFilter === '' || inv.paymentType === typeFilter;
        const matchesUser = userFilter === '' || inv.clientName === userFilter;
        const matchesDateFrom = dateFrom === '' || new Date(inv.date) >= new Date(dateFrom);
        const matchesDateTo = dateTo === '' || new Date(inv.date) <= new Date(dateTo);
        const matchesSearch = searchQuery === '' ||
            inv.invoiceNumber.includes(searchQuery) ||
            inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
            
        return matchesStatus && matchesType && matchesUser && matchesDateFrom && matchesDateTo && matchesSearch;
    });
    
    // Usamos todas las facturas filtradas sin paginación
    const displayedInvoices = filteredInvoices;

    // Animar conteo basado en facturas filtradas
    useEffect(() => {
        // Mostrar siempre el conteo de facturas filtradas
        const total = filteredInvoices.length;
        let current = 0;
        const duration = 1000;
        const step = 50;
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
    }, [filteredInvoices.length]); // Solo dependemos de filteredInvoices.length

    const clearFilters = () => {
        setStatusFilter([]);
        setTypeFilter('');
        setUserFilter('');
        setDateFrom('');
        setDateTo('');
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

    // Colorea estados: 'on_time', 'paid', 'delayed', 'cancelled'
    const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        switch (status) {
            case 'on_time': return 'success';
            case 'paid': return 'primary';   // pagada en azul
            case 'delayed': return 'error';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
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

    // Mostrar spinner si búsqueda global está activa y aún carga facturas completas
    if (searchQuery.length > 0 && loadingAll) {
        return <Loader />;
    }

    return (
        <Box>
            <Typography variant="h5" sx={{ color: '#E31C79', mb: 1 }}>
                {title}
            </Typography>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total de Facturas
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#E31C79' }}>
                  {filteredInvoices.length}
                </Typography>
              </Paper>
            </Grid>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Buscar factura/cliente"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id="filter-status-label">Estado</InputLabel>
                            <Select
                                labelId="filter-status-label"
                                label="Estado"
                                multiple
                                value={statusFilter}
                                onChange={(e: SelectChangeEvent<string[]>) => {
                                    const value = e.target.value as string[];
                                    // Asegurarse de que siempre sea un array
                                    setStatusFilter(Array.isArray(value) ? value : [value]);
                                }}
                                renderValue={(selected) => {
                                    if (selected.length === 0) return 'Todos los estados';
                                    if (selected.length === 4) return 'Todos los estados';
                                    return selected.map(s => {
                                        switch(s) {
                                            case 'on_time': return 'A tiempo';
                                            case 'paid': return 'Pagada';
                                            case 'delayed': return 'Retrasada';
                                            case 'cancelled': return 'Cancelada';
                                            default: return '';
                                        }
                                    }).filter(Boolean).join(', ');
                                }}
                            >
                                <MenuItem value="on_time">
                                    <Checkbox checked={statusFilter.includes('on_time')} />
                                    <ListItemText primary="A tiempo" />
                                </MenuItem>
                                <MenuItem value="paid">
                                    <Checkbox checked={statusFilter.includes('paid')} />
                                    <ListItemText primary="Pagada" />
                                </MenuItem>
                                <MenuItem value="delayed">
                                    <Checkbox checked={statusFilter.includes('delayed')} />
                                    <ListItemText primary="Retrasada" />
                                </MenuItem>
                                <MenuItem value="cancelled">
                                    <Checkbox checked={statusFilter.includes('cancelled')} />
                                    <ListItemText primary="Cancelada" />
                                </MenuItem>
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
            <TableContainer component={Paper} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                <Table stickyHeader>
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
                        {displayedInvoices.map((invoice, index) => (
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
                                <TableCell>{highlightText(invoice.invoiceNumber, searchQuery)}</TableCell>
                                <TableCell>
                                    {invoice.date}
                                </TableCell>
                                <TableCell>{highlightText(invoice.clientName, searchQuery)}</TableCell>
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
                                                {(invoice.status === 'on_time' || 
                                                  invoice.status === 'delayed' || 
                                                  invoice.status === 'paid') && (
                                                    <MenuItem value={invoice.status} disabled>
                                                        {getStatusLabel(invoice.status)}
                                                    </MenuItem>
                                                )}
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
                                    {invoice.total.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                </TableCell>
                                <TableCell align="right">
                                    {invoice.remainingAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
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
                        {filteredInvoices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        No se encontraron facturas que coincidan con los filtros
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
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
                        Una vez cambiado el estado, no podrá volver a establecerlo como 'A tiempo'.
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