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
} from '@mui/material';
import { Navigation } from '../shared/Navigation';
import { paymentService } from '../../services/paymentService';
import { Payment } from '../../types/invoice';

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    (async () => {
      const data = await paymentService.getAllPayments();
      setPayments(data);
    })();
  }, []);

  const filteredPayments = payments.filter(p =>
    (p.invoiceNumber ?? '').toLowerCase().includes(filterText.toLowerCase()) ||
    (p.createdByName ?? '').toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <>
      <Navigation title="Lista de Pagos" />
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: '#E31C79', mb: 2 }}>
            Pagos
          </Typography>
          <TextField
            fullWidth
            label="Filtrar Pagos"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
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
                  <TableCell>Cuota N°</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Registrado por</TableCell>
                  <TableCell>Adjunto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((p: Payment, index: number) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{highlightText(p.invoiceNumber ?? '-', filterText)}</TableCell>
                    <TableCell>{p.date}</TableCell>
                    <TableCell>{p.amount}</TableCell>
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
          </Paper>
        </Box>
      </Container>
    </>
  );
}; 