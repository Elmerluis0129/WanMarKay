import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress, Typography, FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent, Checkbox, FormControlLabel } from '@mui/material';
import { Navigation } from '../shared/Navigation';
import { DashboardSummary } from '../shared/DashboardSummary';
import { computeInvoiceStatus } from '../../utils/statusUtils';
import { invoiceService } from '../../services/invoiceService';
import { Invoice } from '../../types/invoice';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const ReportsDashboard: React.FC = () => {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [includeAllYears, setIncludeAllYears] = useState<boolean>(false);
  const { data: invoices, isLoading, error } = useQuery<Invoice[], Error>({
    queryKey: ['invoices'],
    queryFn: () => invoiceService.getInvoices(),
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error || !invoices) return <Box sx={{ mt: 4 }}>Error al cargar reportes: {error?.message}</Box>;

  // Opciones de años disponibles
  const years = Array.from(new Set(invoices.map(inv => inv.date.substring(0,4))))
    .sort((a, b) => Number(b) - Number(a));
  // Filtrar facturas por año seleccionado
  const filteredInvoices = invoices.filter(inv => inv.date.startsWith(year));
  // Calcular estados dinámicos
  const dynamicInvoices = filteredInvoices.map(inv => ({ ...inv, status: computeInvoiceStatus(inv).status }));
  // Dynamic for all years (sin filtrar)
  const dynamicAllInvoices = invoices.map(inv => ({ ...inv, status: computeInvoiceStatus(inv).status }));

  // Agrupar por mes (01..12)
  const monthsList = Array.from({length:12}, (_,i) => (i+1).toString().padStart(2,'0'));
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const revenueByMonth: Record<string, number> = {};
  const countByMonth: Record<string, number> = {};
  const onTimeByMonth: Record<string, number> = {};
  const paidByMonth: Record<string, number> = {};
  const delayedByMonth: Record<string, number> = {};
  const paymentsByMonth: Record<string, number> = {};
  monthsList.forEach(m => {
    revenueByMonth[m] = 0;
    countByMonth[m] = 0;
    onTimeByMonth[m] = 0;
    paidByMonth[m] = 0;
    delayedByMonth[m] = 0;
    paymentsByMonth[m] = 0;
  });
  // Llenar datos
  dynamicInvoices.forEach(inv => {
    const m = inv.date.substring(5,7);
    revenueByMonth[m] += inv.total;
    countByMonth[m] += 1;
    if (inv.status === 'on_time') onTimeByMonth[m]++;
    if (inv.status === 'paid') paidByMonth[m]++;
    if (inv.status === 'delayed') delayedByMonth[m]++;
    (inv.payments || []).forEach(p => {
      const pm = p.date.substring(5,7);
      paymentsByMonth[pm] = (paymentsByMonth[pm] || 0) + 1;
    });
  });
  // Función para hallar mes de mayor/menor valor
  const maxKey = (obj: Record<string, number>) => monthsList.reduce((a,b) => obj[a] >= obj[b] ? a : b, monthsList[0]);
  const minKey = (obj: Record<string, number>) => monthsList.reduce((a,b) => obj[a] <= obj[b] ? a : b, monthsList[0]);
  const maxRevenueMonth = maxKey(revenueByMonth);
  const minRevenueMonth = minKey(revenueByMonth);
  const maxOnTimeMonth = maxKey(onTimeByMonth);
  const maxPaidMonth = maxKey(paidByMonth);
  const maxDelayedMonth = maxKey(delayedByMonth);
  const maxPaymentsMonth = maxKey(paymentsByMonth);

  // Preparar datos para gráficos
  const revenueData = monthsList.map(m => ({ month: monthNames[Number(m)-1], ventas: revenueByMonth[m] }));
  const countData = monthsList.map(m => ({ month: monthNames[Number(m)-1], facturas: countByMonth[m] }));
  const paymentsData = monthsList.map(m => ({ month: monthNames[Number(m)-1], pagos: paymentsByMonth[m] }));
  const statusData = monthsList.map(m => ({
    month: monthNames[Number(m)-1],
    'A tiempo': onTimeByMonth[m],
    'Pagadas': paidByMonth[m],
    'Retrasadas': delayedByMonth[m]
  }));

  return (
    <>
      <Navigation title="Reportes" />
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>Dashboard de Reportes</Typography>
          <Typography variant="subtitle1" gutterBottom>Reportes actuales de facturas</Typography>
          {/* Selector de año */}
          <FormControl sx={{ mb: 3, minWidth: 120 }} size="small">
            <InputLabel id="year-filter-label">Año</InputLabel>
            <Select
              labelId="year-filter-label"
              label="Año"
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          {/* Gráficos mensuales */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Ventas por mes</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toLocaleString('es-DO', { style:'currency', currency:'DOP' })} />
                <Bar dataKey="ventas" name="Ventas" fill="#E31C79" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Facturas por mes</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={countData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="facturas" name="Facturas" fill="#2196F3" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Pagos por mes</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pagos" name="Pagos" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Estado de facturas</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="A tiempo" stackId="a" name="A tiempo" fill="#4CAF50" />
                <Bar dataKey="Pagadas" stackId="a" name="Pagadas" fill="#2196F3" />
                <Bar dataKey="Retrasadas" stackId="a" name="Retrasadas" fill="#F44336" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          {/* Encabezado de resumen: año o toda la data */}
          <Typography variant="h5" component="h3" gutterBottom>
            {includeAllYears ? 'Toda la data' : `Año ${year}`}
          </Typography>
          {/* Filtro de resumen: todos los años */}
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={includeAllYears}
                onChange={e => setIncludeAllYears(e.target.checked)}
              />
            }
            label="Todos los años"
          />
          <DashboardSummary
            invoices={includeAllYears ? dynamicAllInvoices : dynamicInvoices}
          />
        </Box>
      </Container>
    </>
  );
};

export default ReportsDashboard; 