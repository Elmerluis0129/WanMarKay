import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress, Pagination, Alert } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { Invoice } from '../../types/invoice';
import { invoiceService } from '../../services/invoiceService';
import { Navigation } from '../shared/Navigation';
import { Loader } from '../shared/Loader';

export const AdminDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');

    const { data: invoices = [], isLoading, error, refetch } = useQuery<Invoice[], Error>({
        queryKey: ['allInvoices'],
        queryFn: () => invoiceService.getAllInvoices(),
        staleTime: 300000, // 5 minutos cacheados
    });
    
    const totalCount = invoices.length;

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <>
                <Navigation title="Gestión de facturas" />
                <Container>
                    <Alert severity="error" sx={{ mt: 4 }}>
                        Error al cargar facturas: {error.message}
                    </Alert>
                </Container>
            </>
        );
    }

    if (!invoices.length) {
        return (
            <>
                <Navigation title="Gestión de facturas" />
                <Container>
                    <Alert severity="info" sx={{ mt: 4 }}>
                        No hay facturas disponibles
                    </Alert>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navigation title="Gestión de facturas" />
            <Container>
                <Box sx={{ mt: 4 }}>
                    <InvoiceList 
                        invoices={invoices}
                        title="Gestión de Facturas"
                        totalInvoices={totalCount}
                        onInvoicesChange={refetch}
                        onSearchChange={(query) => setSearchQuery(query)}
                    />
                </Box>
            </Container>
        </>
    );
}; 
