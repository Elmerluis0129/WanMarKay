import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { Invoice } from '../../types/invoice';
import { SummaryChart } from './SummaryChart';
import { computeInvoiceStatus } from '../../utils/statusUtils';

interface DashboardSummaryProps {
  invoices: Invoice[];
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ invoices }) => {
  // Generar lista con estados dinámicos
  const dynamicInvoices = invoices.map(inv => ({ ...inv, status: computeInvoiceStatus(inv).status }));
  const totalInvoices = dynamicInvoices.length;
  const totalRevenue = dynamicInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidInvoices = dynamicInvoices.filter(inv => inv.status === 'paid').length;
  const onTimeInvoices = dynamicInvoices.filter(inv => inv.status === 'on_time').length;
  const delayedInvoices = dynamicInvoices.filter(inv => inv.status === 'delayed').length;
  // Calcular montos
  const totalPaidAmount = dynamicInvoices.reduce((sum, inv) => sum + (inv.total - inv.remainingAmount), 0);
  const totalPendingAmount = dynamicInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Facturas</Typography>
              <Typography variant="h4">{totalInvoices}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Ingresos Totales</Typography>
              <Typography variant="h4">
                {totalRevenue.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6">Pagadas</Typography>
              <Typography variant="h4">{paidInvoices}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6">A tiempo</Typography>
              <Typography variant="h4">{onTimeInvoices}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6">Retrasadas</Typography>
              <Typography variant="h4">{delayedInvoices}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Pagado</Typography>
              <Typography variant="h4">
                {totalPaidAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Pendiente</Typography>
              <Typography variant="h4">
                {totalPendingAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <SummaryChart invoices={dynamicInvoices} />
    </>
  );
}; 