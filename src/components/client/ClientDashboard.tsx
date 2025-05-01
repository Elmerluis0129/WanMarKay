import React, { useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { invoiceService } from '../../services/invoiceService';
import { Navigation } from '../shared/Navigation';
import { auth } from '../../services/auth';
import { Invoice } from '../../types/invoice';

export const ClientDashboard: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const currentUser = auth.getCurrentUser();

    useEffect(() => {
        (async () => {
            const data = await invoiceService.getClientInvoices(currentUser!.id);
            setInvoices(data);
        })();
    }, [currentUser]);

    const userInvoices = invoices;

    return (
        <>
            <Navigation title="Mis Facturas" />
            <Container>
                <Box sx={{ mt: 4 }}>
                    <InvoiceList 
                        invoices={userInvoices} 
                        title="Mis Facturas"
                    />
                </Box>
            </Container>
        </>
    );
}; 