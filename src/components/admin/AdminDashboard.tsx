import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress, Pagination, Alert } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { Invoice } from '../../types/invoice';
import { invoiceService } from '../../services/invoiceService';
import { Navigation } from '../shared/Navigation';
import { Loader } from '../shared/Loader';

export const AdminDashboard: React.FC = () => {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const pageSize = 10;

    const { data: result, isLoading, error, refetch } = useQuery<{ data: Invoice[]; count: number }, Error>({
        queryKey: ['invoices', page],
        queryFn: () => invoiceService.getInvoices(page, pageSize),
        staleTime: 300000, // 5 minutos cacheados
    });

    const invoices = result?.data || [];
    const totalCount = result?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <>
                <Navigation title="Panel de Administrador" />
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
                <Navigation title="Panel de Administrador" />
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
            <Navigation title="Panel de Administrador" />
            <Container>
                <Box sx={{ mt: 4 }}>
                    <InvoiceList 
                        invoices={invoices}
                        title="Gestión de Facturas"
                        totalInvoices={totalCount}
                        onInvoicesChange={refetch}
                        onSearchChange={(query) => setSearchQuery(query)}
                    />
                    {!searchQuery && (
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
        </>
    );
}; 
