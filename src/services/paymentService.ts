import { supabase } from './supabase';
import { userService } from './userService';
import { Payment } from '../types/invoice';
import { auth } from './auth';

export const paymentService = {
  getPaymentsByInvoice: async (invoiceId: string): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, user:users(full_name)')
      .eq('invoice_id', invoiceId);
    if (error) throw error;
    return (data || []).map((d: any) => ({
      id: d.id,
      invoiceId: d.invoice_id,
      date: d.date,
      amount: d.amount,
      installmentNumber: d.installment_number,
      method: d.method,
      createdAt: d.created_at,
      createdBy: d.created_by,
      createdByName: d.user?.full_name || '-',
      attachment: d.attachment,
      lateFeePaid: d.late_fee_paid
    }));
  },

  registerPayment: async (invoiceId: string, payment: Payment): Promise<Payment> => {
    // Calcular el siguiente número de cuota
    const { count, error: countError } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', invoiceId);
    if (countError) throw countError;
    const nextInstallment = (count || 0) + 1;
    const currentUser = auth.getCurrentUser();
    if (!currentUser) throw new Error('Usuario no autenticado');
    const payload = {
      id: payment.id,
      invoice_id: invoiceId,
      date: payment.date,
      amount: payment.amount,
      late_fee_paid: payment.lateFeePaid ?? 0,
      installment_number: nextInstallment,
      method: payment.method,
      created_at: new Date().toISOString(),
      created_by: currentUser.id,
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

  updatePayment: async (payment: Payment): Promise<Payment> => {
    const payload = {
      date: payment.date,
      amount: payment.amount,
      installment_number: payment.installmentNumber,
      method: payment.method,
      attachment: payment.attachment
    };
    const { data, error } = await supabase
      .from('payments')
      .update(payload)
      .eq('id', payment.id)
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

  getAllPayments: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, invoice:invoices(invoice_number)');
    if (error) throw error;
    const users = await userService.getUsers();
    return (data || []).map((d: any) => ({
      id: d.id,
      invoiceId: d.invoice_id,
      invoiceNumber: d.invoice?.invoice_number,
      date: d.date,
      amount: d.amount,
      lateFeePaid: d.late_fee_paid,
      installmentNumber: d.installment_number,
      method: d.method,
      createdAt: d.created_at,
      createdBy: d.created_by,
      createdByName: users.find(u => u.id === d.created_by)?.fullName,
      attachment: d.attachment
    }));
  },
}; 