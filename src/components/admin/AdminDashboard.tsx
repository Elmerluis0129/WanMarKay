import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { Invoice } from '../../types/invoice';
import { invoiceService } from '../../services/invoiceService';
import { Navigation } from '../shared/Navigation';

export const AdminDashboard: React.FC = () => {
    const { data: invoices, isLoading, error, refetch } = useQuery<Invoice[], Error>({
        queryKey: ['invoices'],
        queryFn: () => invoiceService.getInvoices(),
    });

    if (isLoading) {
        return <CircularProgress />;
    }

    if (error) {
        return <div>Error al cargar facturas: {error.message}</div>;
    }
    if (!invoices) {
        return <div>No hay facturas disponibles</div>;
    }

    const reloadInvoices = refetch;

    return (
        <>
            <Navigation title="Panel de Administrador" />
            <Container>
                <Box sx={{ mt: 4 }}>
                    <InvoiceList 
                        invoices={invoices} 
                        title="Gestión de Facturas"
                        onInvoicesChange={reloadInvoices}
                    />
                </Box>
            </Container>
        </>
    );
}; 
