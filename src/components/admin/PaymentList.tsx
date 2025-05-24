import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  InputAdornment,
  Grid,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { Navigation } from '../shared/Navigation';
import { paymentService } from '../../services/paymentService';
import { Payment, Invoice } from '../../types/invoice';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '../shared/Loader';
import { useLocation } from 'react-router-dom';
import { PaymentDetailsModal } from '../shared/PaymentDetailsModal';
import { invoiceService } from '../../services/invoiceService';

// Funciones para resaltar coincidencias en filtros
const escapeRegExp = (s: string): string => s.replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&');
const highlightText = (text: string, highlight: string): React.ReactNode => {
  if (!highlight) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
  const lowerHighlight = highlight.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === lowerHighlight ?
      <span key={i} style={{ backgroundColor: 'yellow' }}>{part}</span> :
      part
  );
};

export const PaymentList: React.FC = () => {
  const location = useLocation();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Usamos React Query para obtener todos los pagos
  const { data: payments = [], isLoading, error, refetch } = useQuery<Payment[], Error>({
    queryKey: ['allPayments'],
    queryFn: () => paymentService.getAllPayments(),
    staleTime: 300000,
  });
  
  const totalCount = payments.length;
  // Estados para búsqueda con debounce
  const initialFilter = location.state?.search || '';
  const [filterText, setFilterText] = useState<string>(initialFilter);
  const [searchTerm, setSearchTerm] = useState<string>(initialFilter);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilterText(searchTerm);
    }, 500); // 500ms de retraso

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Lista a filtrar
  const paymentsToFilter = payments;

  const filteredPayments = paymentsToFilter.filter(p =>
    (p.invoiceNumber ?? '').toLowerCase().includes(filterText.toLowerCase()) ||
    (p.createdByName ?? '').toLowerCase().includes(filterText.toLowerCase())
  );

  useEffect(() => {
    // Si cambia el location.state.search, actualiza el filtro
    if (location.state?.search) {
      setFilterText(location.state.search);
    }
  }, [location.state?.search]);

  // Función para manejar el clic en el botón de ver detalles
  const handleViewDetails = async (payment: Payment) => {
    try {
      if (!payment.invoiceId) {
        console.error('No se encontró el ID de la factura');
        return;
      }
      const invoice = await invoiceService.getInvoiceById(payment.invoiceId);
      setSelectedPayment(payment);
      setSelectedInvoice(invoice);
      setModalOpen(true);
    } catch (error) {
      console.error('Error al cargar la factura:', error);
    }
  };

  // Mostrar spinner si carga inicial o carga global de búsqueda
  if (isLoading) {
    return <Loader />;
  }
  if (error) return <div>Error al cargar pagos: {error.message}</div>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation title="Lista de Pagos" />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Container>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h5" sx={{ color: '#E31C79', mb: 1 }}>
              Pagos
            </Typography>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total de Pagos
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#E31C79' }}>
                  {filterText ? filteredPayments.length : totalCount}
                </Typography>
              </Paper>
            </Grid>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <TextField
                    label="Buscar por referencia o cliente"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 2, width: 300 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <TableContainer component={Paper} elevation={1} sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Factura</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Mora Pagada</TableCell>
                    <TableCell align="right">Capital Pagado</TableCell>
                    <TableCell>Cuota N°</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Registrado por</TableCell>
                    <TableCell>Adjunto</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.map((p: Payment, index: number) => (
                    <TableRow
                      key={p.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
                        '&:hover': {
                          backgroundColor: 'rgba(227, 28, 121, 0.04)',
                        }
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{index + 1}</TableCell>
                      <TableCell>{highlightText(p.invoiceNumber ?? '-', filterText)}</TableCell>
                      <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        {p.amount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                      </TableCell>
                      <TableCell align="right">
                        {(p.lateFeePaid ?? 0).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                      </TableCell>
                      <TableCell align="right">
                        {(p.amount - (p.lateFeePaid ?? 0)).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                      </TableCell>
                      <TableCell>{p.installmentNumber}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>{highlightText(p.createdByName ?? '-', filterText)}</TableCell>
                      <TableCell>
                        {p.attachment ? (
                          <a 
                            href={p.attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#E31C79', textDecoration: 'none' }}
                          >
                            Ver
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(p)}
                          title="Ver detalles"
                          sx={{ 
                            color: '#E31C79',
                            '&:hover': {
                              backgroundColor: 'rgba(227, 28, 121, 0.08)',
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, textAlign: 'center', color: 'text.secondary', py: 2 }}>
              Mostrando {filteredPayments.length} de {totalCount} pagos
            </Box>
          </Box>
        </Container>
      </Box>

      {selectedInvoice && (
        <PaymentDetailsModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedInvoice(null);
            setSelectedPayment(null);
          }}
          invoice={selectedInvoice}
          onPaymentRegistered={() => {
            refetch();
          }}
        />
      )}
    </Box>
  );
};