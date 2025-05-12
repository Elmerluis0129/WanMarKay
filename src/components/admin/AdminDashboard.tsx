import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Box, CircularProgress, Pagination } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { Invoice } from '../../types/invoice';
import { invoiceService } from '../../services/invoiceService';
import { Navigation } from '../shared/Navigation';

export const AdminDashboard: React.FC = () => {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const pageSize = 10;
    // Paginación con React Query: data.data lista y data.count total
    const { data: result, isLoading, error, refetch } = useQuery<{ data: Invoice[]; count: number }, Error>({
        queryKey: ['invoices', page],
        queryFn: () => invoiceService.getInvoices(page, pageSize),
        staleTime: 300000, // 5 minutos cacheados
    });
    const invoices = result?.data || [];
    const totalCount = result?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

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
                        totalInvoices={totalCount}
                        onInvoicesChange={reloadInvoices}
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
