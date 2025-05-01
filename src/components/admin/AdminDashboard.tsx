import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import { InvoiceList } from '../shared/InvoiceList';
import { storage } from '../../utils/storage';
import { Navigation } from '../shared/Navigation';

export const AdminDashboard: React.FC = () => {
    const [invoices, setInvoices] = useState(storage.getInvoices());    

    // Función para recargar las facturas
    const reloadInvoices = () => {
        setInvoices(storage.getInvoices());
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