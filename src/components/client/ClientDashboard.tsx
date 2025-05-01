import React from 'react';
import { Container, Box } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { storage } from '../../utils/storage';
import { Navigation } from '../shared/Navigation';
import { auth } from '../../services/auth';

export const ClientDashboard: React.FC = () => {
    const currentUser = auth.getCurrentUser();
    const allInvoices = storage.getInvoices();
    const userInvoices = allInvoices.filter(invoice => 
        invoice.clientName === currentUser?.fullName
    );

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