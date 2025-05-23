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
  Pagination,
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
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // Usamos React Query para obtener pagos paginados
  const { data: result, isLoading, error, refetch } = useQuery<{ data: Payment[]; count: number }, Error>({
    queryKey: ['payments', page],
    queryFn: () => paymentService.getPayments(page, pageSize),
    staleTime: 300000,
  });
  const payments = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  // Inicializar el filtro con el número de factura si viene en el estado
  const initialFilter = location.state?.search || '';
  const [filterText, setFilterText] = useState<string>(initialFilter);

  // Búsqueda global: si hay texto, cargamos todos los pagos para filtrar
  const { data: allPayments, isLoading: loadingAll, refetch: refetchAll } = useQuery<Payment[], Error>({
    queryKey: ['paymentsAll'],
    queryFn: () => paymentService.getAllPayments(),
    enabled: filterText.length > 0,
    staleTime: 300000,
  });
  // Lista a filtrar depende de si hay búsqueda global
  const paymentsToFilter = filterText ? (allPayments || []) : payments;

  const filteredPayments = paymentsToFilter.filter(p =>
    (p.invoiceNumber ?? '').toLowerCase().includes(filterText.toLowerCase()) ||
    (p.createdByName ?? '').toLowerCase().includes(filterText.toLowerCase())
  );

  useEffect(() => {
    // Si cambia el location.state.search, actualiza el filtro
    if (location.state?.search) {
      setFilterText(location.state.search);
      setPage(1);
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
  if (filterText ? loadingAll : isLoading) {
    return <Loader />;
  }
  if (error) return <div>Error al cargar pagos: {error.message}</div>;

  return (
    <>
      <Navigation title="Lista de Pagos" />
      <Container>
        <Box sx={{ mt: 4 }}>
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
                  fullWidth
                  size="small"
                  label="Buscar factura/registrado por"
                  value={filterText}
                  onChange={e => { setFilterText(e.target.value); setPage(1); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper} elevation={1}>
            <Table>
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
                      RD$ {p.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
                      RD$ {(p.lateFeePaid ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
                      RD$ {(p.amount - (p.lateFeePaid ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {/* Paginación solo si no hay búsqueda global */}
          {!filterText && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      </Container>

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
            if (filterText) {
              refetchAll();
            } else {
              refetch();
            }
          }}
        />
      )}
    </>
  );
}; 