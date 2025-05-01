import React, { useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { Invoice } from '../../types/invoice';
import { invoiceService } from '../../services/invoiceService';
import { Navigation } from '../shared/Navigation';

export const AdminDashboard: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Carga inicial y recarga de facturas desde Supabase
    useEffect(() => {
        (async () => {
            const data = await invoiceService.getInvoices();
            setInvoices(data);
        })();
    }, []);

    const reloadInvoices = async () => {
        const data = await invoiceService.getInvoices();
        setInvoices(data);
    };

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