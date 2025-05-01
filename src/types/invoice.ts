export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type PaymentStatus = 'pending' | 'paid' | 'delayed' | 'cancelled' | 'on_time';
export type PaymentMethod = 'cash' | 'transfer' | 'deposit';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface PaymentPlan {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    startDate: string;
    totalInstallments: number;
    installmentAmount: number;
    paidInstallments: number;
    nextPaymentDate?: string;
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
    installmentNumber: number;
    method?: 'cash' | 'transfer' | 'check';
    createdAt?: string;
    createdBy?: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    date: string;
    clientId?: string;
    clientName: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    subtotal: number;
    itbis: number;
    total: number;
    remainingAmount: number;
    status: 'pending' | 'paid' | 'delayed' | 'cancelled' | 'on_time';
    paymentType: 'cash' | 'credit';
    paymentPlan?: PaymentPlan;
    payments?: Payment[];
    nextPaymentDue?: string;
} 