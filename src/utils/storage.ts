import { User } from '../types/user';
import { Invoice } from '../types/invoice';
import { v4 as uuidv4 } from 'uuid';

const USERS_KEY = 'mk_users';
const INVOICES_KEY = 'mk_invoices';

export const storage = {
    // Usuarios
    getUsers: (): User[] => {
        const data = localStorage.getItem(USERS_KEY);
        let users: any[] = data ? JSON.parse(data) : [];
        let migrated = false;
        // Migrar usuarios que aún tengan propiedad 'email' al nuevo campo 'username'
        users = users.map(u => {
            if (!u.username && u.email) {
                migrated = true;
                return {
                    id: u.id,
                    username: u.email,
                    fullName: u.fullName,
                    password: u.password,
                    role: u.role,
                } as User;
            }
            return u;
        });
        if (migrated) {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
        // Sembrar admin por defecto si no existe
        if (!users.some(u => u.role === 'admin')) {
            const defaultAdmin: User = {
                id: uuidv4(),
                username: 'admin',
                fullName: 'Administrador',
                password: 'admin123',
                role: 'admin'
            };
            users.unshift(defaultAdmin);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
        return users as User[];
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