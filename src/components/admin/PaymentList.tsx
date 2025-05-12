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
  Pagination,
  CircularProgress,
} from '@mui/material';
import { Navigation } from '../shared/Navigation';
import { paymentService } from '../../services/paymentService';
import { Payment } from '../../types/invoice';
import { useQuery } from '@tanstack/react-query';

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
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Usamos React Query para obtener pagos paginados
  const { data: result, isLoading, error } = useQuery<{ data: Payment[]; count: number }, Error>({
    queryKey: ['payments', page],
    queryFn: () => paymentService.getPayments(page, pageSize),
    staleTime: 300000,
  });
  const payments = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const [filterText, setFilterText] = useState<string>('');
  const [displayCount, setDisplayCount] = useState(0);

  // Búsqueda global: si hay texto, cargamos todos los pagos para filtrar
  const { data: allPayments, isLoading: loadingAll } = useQuery<Payment[], Error>({
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

  // Animación del conteo: total global o resultados filtrados
  useEffect(() => {
    const total = filterText
      ? filteredPayments.length
      : totalCount;
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
  }, [filterText, filteredPayments.length, totalCount]);

  // Mostrar spinner si carga inicial o carga global de búsqueda
  if ((filterText ? loadingAll : isLoading)) return <CircularProgress />;
  if (error) return <div>Error al cargar pagos: {error.message}</div>;

  return (
    <>
      <Navigation title="Lista de Pagos" />
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#E31C79', mb: 1 }}>
            Pagos
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Total de pagos: {displayCount}
          </Typography>
          <TextField
            fullWidth
            label="Filtrar Pagos"
            value={filterText}
            onChange={e => { setFilterText(e.target.value); setPage(1); }}
            sx={{ mb: 2 }}
          />
          <Paper elevation={1} sx={{ p: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Factura</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Mora Pagada</TableCell>
                  <TableCell>Capital Pagado</TableCell>
                  <TableCell>Cuota N°</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Registrado por</TableCell>
                  <TableCell>Adjunto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((p: Payment, index: number) => (
                  <TableRow
                    key={p.id}
                    hover
                    sx={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f5f5f5' }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{highlightText(p.invoiceNumber ?? '-', filterText)}</TableCell>
                    <TableCell>{p.date}</TableCell>
                    <TableCell>{p.amount}</TableCell>
                    <TableCell>{p.lateFeePaid?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell>{(p.amount - (p.lateFeePaid ?? 0)).toFixed(2)}</TableCell>
                    <TableCell>{p.installmentNumber}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>{highlightText(p.createdByName ?? '-', filterText)}</TableCell>
                    <TableCell>
                      {p.attachment ? (
                        <a href={p.attachment} target="_blank" rel="noopener noreferrer">Ver</a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          </Paper>
        </Box>
      </Container>
    </>
  );
}; 