export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type PaymentStatus = 'pending' | 'paid' | 'delayed' | 'cancelled' | 'on_time';
export type PaymentMethod = 'cash' | 'transfer' | 'deposit';
export type InvoiceStatus = 'paid' | 'cancelled' | 'overdue' | 'delayed' | 'on_time';

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
    invoiceId?: string;
    invoiceNumber?: string;
    date: string;
    amount: number;
    installmentNumber: number;
    method?: PaymentMethod;
    createdAt?: string;
    createdBy?: string;
    createdByName?: string;
    attachment?: string;
    lateFeePaid?: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    date: string;
    clientId?: string;
    clientName: string;
    address?: string;
    cedula?: string;
    phone?: string;
    attachment?: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    subtotal: number;
    total: number;
    remainingAmount: number;
    status: InvoiceStatus;
    discountPercentage?: number;
    lateFeePercentage?: number;
    // Monto fijo de mora en RD$
    lateFeeAmount?: number;
    paymentType: 'cash' | 'credit';
    paymentPlan?: PaymentPlan;
    payments?: Payment[];
    nextPaymentDue?: string;
    createdBy?: string;
    createdByFullName?: string;
}