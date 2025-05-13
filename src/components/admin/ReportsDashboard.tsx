import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress, Typography, FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent, Checkbox, FormControlLabel, TextField, FormGroup } from '@mui/material';
import { Navigation } from '../shared/Navigation';
import { DashboardSummary } from '../shared/DashboardSummary';
import { computeInvoiceStatus } from '../../utils/statusUtils';
import { invoiceService } from '../../services/invoiceService';
import { Invoice } from '../../types/invoice';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { User } from '../../types/user';
import { userService } from '../../services/userService';

export const ReportsDashboard: React.FC = () => {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({ paid: true, on_time: true, delayed: true });
  const [clientSearch, setClientSearch] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const { data: invoices = [], isLoading, error } = useQuery<Invoice[], Error>({
    queryKey: ['invoices'],
    queryFn: () => invoiceService.getAllInvoices(),
    staleTime: 300000,
  });
  const { data: clientOptions = [] } = useQuery<User[], Error, User[]>({
    queryKey: ['clientOptions', clientSearch],
    queryFn: async () => {
      const res = await userService.getUsersPaginated(1, 100, clientSearch);
      return res.data.filter(u => u.role === 'client');
    },
    staleTime: 300000
  });

  const resetFilters = () => {
    setYear(new Date().getFullYear().toString());
    setMonthFilter('all');
    setStatusFilters({ paid: true, on_time: true, delayed: true });
    setSelectedClient(null);
    setClientSearch('');
    setStartDateFilter(null);
    setEndDateFilter(null);
    setPaymentTypeFilter('all');
    setMinAmount('');
    setMaxAmount('');
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error || !invoices) return <Box sx={{ mt: 4 }}>Error al cargar reportes: {error?.message}</Box>;

  // Opciones de años disponibles
  const years = Array.from(new Set(invoices.map(inv => inv.date.substring(0,4))))
    .sort((a, b) => Number(b) - Number(a));
  // Filtrar por año (o incluir todos los años)
  const baseInvoices = year === 'all'
    ? invoices
    : invoices.filter(inv => inv.date.startsWith(year));
  // Calcular estado dinámico inicial
  const dynamicBaseInvoices = baseInvoices.map(inv => ({ ...inv, status: computeInvoiceStatus(inv).status }));
  // Aplicar filtros adicionales
  const filteredInvoices = dynamicBaseInvoices
    .filter(inv => monthFilter === 'all' || inv.date.substring(5,7) === monthFilter)
    .filter(inv => statusFilters[inv.status])
    .filter(inv => !selectedClient || inv.clientId === selectedClient.id)
    .filter(inv => !startDateFilter || new Date(inv.date) >= startDateFilter)
    .filter(inv => !endDateFilter || new Date(inv.date) <= endDateFilter)
    .filter(inv => paymentTypeFilter === 'all' || inv.paymentType === paymentTypeFilter)
    .filter(inv => minAmount === '' || inv.total >= minAmount)
    .filter(inv => maxAmount === '' || inv.total <= maxAmount);

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
  filteredInvoices.forEach(inv => {
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

  console.log('Años disponibles en facturas:', years);

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
              <MenuItem value="all">Todos</MenuItem>
              {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={resetFilters} sx={{ ml: 2, mb: 3 }}>
            Limpiar filtros
          </Button>
          {/* Filtros adicionales */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {/* Mes */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="month-filter-label">Mes</InputLabel>
              <Select
                labelId="month-filter-label"
                label="Mes"
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                {monthsList.map((m, i) => (
                  <MenuItem key={m} value={m}>{monthNames[i]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Estado */}
            <FormControl component="fieldset">
              <Typography variant="subtitle2">Estado</Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={statusFilters.on_time}
                      onChange={() => setStatusFilters(prev => ({ ...prev, on_time: !prev.on_time }))}
                    />
                  }
                  label="A tiempo"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={statusFilters.paid}
                      onChange={() => setStatusFilters(prev => ({ ...prev, paid: !prev.paid }))}
                    />
                  }
                  label="Pagadas"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={statusFilters.delayed}
                      onChange={() => setStatusFilters(prev => ({ ...prev, delayed: !prev.delayed }))}
                    />
                  }
                  label="Retrasadas"
                />
              </FormGroup>
            </FormControl>
            {/* Cliente */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 200 }}
              options={clientOptions}
              getOptionLabel={option => option.fullName}
              filterOptions={(options: User[], state: any) => options}
              onInputChange={(e, value) => setClientSearch(value)}
              onChange={(e, value) => setSelectedClient(value)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Cliente"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <SearchIcon fontSize="small" />
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderOption={(props: any, option: User, { inputValue }: { inputValue: string }) => {
                const matches = match(option.fullName, inputValue);
                const parts = parse(option.fullName, matches) as { text: string; highlight: boolean }[];
                return (
                  <li {...props}>
                    {parts.map((part, index) => (
                      <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                        {part.text}
                      </span>
                    ))}
                  </li>
                );
              }}
            />
            {/* Fecha */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Desde"
                value={startDateFilter}
                onChange={date => setStartDateFilter(date)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="Hasta"
                value={endDateFilter}
                onChange={date => setEndDateFilter(date)}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>
            {/* Tipo de pago */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="payment-type-filter-label">Tipo Pago</InputLabel>
              <Select
                labelId="payment-type-filter-label"
                label="Tipo Pago"
                value={paymentTypeFilter}
                onChange={e => setPaymentTypeFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="cash">Contado</MenuItem>
                <MenuItem value="credit">Crédito</MenuItem>
              </Select>
            </FormControl>
            {/* Rango de montos */}
            <TextField
              size="small"
              type="number"
              label="Monto min"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <TextField
              size="small"
              type="number"
              label="Monto max"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Box>
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
                <Bar dataKey="Pagadas" stackId="a" name="Pagadas" fill="#E31C79" />
                <Bar dataKey="Retrasadas" stackId="a" name="Retrasadas" fill="#FFC107" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          {/* Encabezado de resumen: año o toda la data */}
          <Typography variant="h5" component="h3" gutterBottom>
            {year === 'all' ? 'Toda la data' : `Año ${year}`}
          </Typography>
          <DashboardSummary
            invoices={filteredInvoices}
          />
        </Box>
      </Container>
    </>
  );
};

export default ReportsDashboard; 