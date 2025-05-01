import { supabase } from './supabase';
import { Payment } from '../types/invoice';

export const paymentService = {
  getPaymentsByInvoice: async (invoiceId: string): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId);
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      date: d.date,
      amount: d.amount,
      installmentNumber: d.installment_number,
      method: d.method,
      createdAt: d.created_at,
      createdBy: d.created_by,
      attachment: d.attachment
    }));
  },

  registerPayment: async (invoiceId: string, payment: Payment): Promise<Payment> => {
    const payload = {
      id: payment.id,
      invoice_id: invoiceId,
      date: payment.date,
      amount: payment.amount,
      installment_number: payment.installmentNumber,
      method: payment.method,
      created_at: payment.createdAt,
      created_by: payment.createdBy,
      attachment: payment.attachment
    };
    const { data, error } = await supabase
      .from('payments')
      .insert([payload])
      .select('*')
      .single();
    if (error || !data) throw error;
    const d: any = data;
    return {
      id: d.id,
      date: d.date,
      amount: d.amount,
      installmentNumber: d.installment_number,
      method: d.method,
      createdAt: d.created_at,
      createdBy: d.created_by,
      attachment: d.attachment
    };
  },
}; 