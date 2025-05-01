import { User } from '../types/user';
import { Invoice } from '../types/invoice';

const USERS_KEY = 'mk_users';
const INVOICES_KEY = 'mk_invoices';

export const storage = {
    // Usuarios
    getUsers: (): User[] => {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    saveUsers: (users: User[]): void => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    addUser: (user: User): void => {
        const users = storage.getUsers();
        users.push(user);
        storage.saveUsers(users);
    },

    // Facturas
    getInvoices: (): Invoice[] => {
        const invoices = localStorage.getItem(INVOICES_KEY);
        return invoices ? JSON.parse(invoices) : [];
    },

    saveInvoices: (invoices: Invoice[]): void => {
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    },

    addInvoice: (invoice: Invoice): void => {
        const invoices = storage.getInvoices();
        invoices.push(invoice);
        storage.saveInvoices(invoices);
    },

    getClientInvoices: (clientId: string): Invoice[] => {
        return storage.getInvoices().filter(invoice => invoice.clientId === clientId);

    },

    updateInvoice: (updatedInvoice: Invoice) => {
        const invoices = storage.getInvoices();
        const index = invoices.findIndex(invoice => invoice.id === updatedInvoice.id);
        if (index !== -1) {
            invoices[index] = updatedInvoice;
            storage.saveInvoices(invoices);
        }
    }
}; 