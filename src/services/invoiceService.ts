import { supabase } from './supabase';
import { Invoice } from '../types/invoice';
import { computeInvoiceStatus } from '../utils/statusUtils';
import { calculateLateFeePercentage, calculateLateFeeAmount } from '../utils/lateFeeUtils';

export const invoiceService = {
  // Obtener todas las facturas sin paginar
  getAllInvoices: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*');
    if (error) throw error;
    return (data || []).map((d: any) => {
      const inv: Invoice = {
        id: d.id,
        invoiceNumber: d.invoice_number,
        date: d.date,
        clientId: d.client_id,
        clientName: d.client_name,
        address: d.address || undefined,
        cedula: d.cedula || undefined,
        phone: d.phone || undefined,
        attachment: d.attachment || undefined,
        items: d.items,
        subtotal: d.subtotal,
        total: d.total,
        remainingAmount: d.remaining_amount,
        status: d.status,
        discountPercentage: d.discount_percentage ?? 0,
        lateFeePercentage: d.late_fee_percentage ?? 0,
        lateFeeAmount: d.late_fee_amount ?? 0,
        paymentType: d.payment_type,
        paymentPlan: d.payment_plan,
        payments: d.payments,
        nextPaymentDue: d.next_payment_due || undefined,
      } as Invoice;
      if (inv.paymentType === 'credit') {
        inv.status = computeInvoiceStatus(inv).status;
      }
      return inv;
    });
  },

  // Obtener facturas paginadas: page (1-based) y pageSize
  getInvoices: async (page = 1, pageSize = 10): Promise<{ data: Invoice[]; count: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .range(from, to);
    if (error) throw error;
    const invoices: Invoice[] = (data || []).map((d: any) => {
      const inv: Invoice = {
        id: d.id,
        invoiceNumber: d.invoice_number,
        date: d.date,
        clientId: d.client_id,
        clientName: d.client_name,
        address: d.address || undefined,
        cedula: d.cedula || undefined,
        phone: d.phone || undefined,
        attachment: d.attachment || undefined,
        items: d.items,
        subtotal: d.subtotal,
        total: d.total,
        remainingAmount: d.remaining_amount,
        status: d.status,
        discountPercentage: d.discount_percentage ?? 0,
        lateFeePercentage: d.late_fee_percentage ?? 0,
        lateFeeAmount: d.late_fee_amount ?? 0,
        paymentType: d.payment_type,
        paymentPlan: d.payment_plan,
        payments: d.payments,
        nextPaymentDue: d.next_payment_due || undefined,
      } as Invoice;
      if (inv.paymentType === 'credit') {
        inv.status = computeInvoiceStatus(inv).status;
      }
      return inv;
    });
    return { data: invoices, count: count || 0 };
  },

  addInvoice: async (invoice: Invoice): Promise<Invoice> => {
    // Map fields a snake_case para la inserción
    const payload = {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      address: invoice.address,
      cedula: invoice.cedula,
      phone: invoice.phone,
      attachment: invoice.attachment,
      items: invoice.items,
      subtotal: invoice.subtotal,
      total: invoice.total,
      remaining_amount: invoice.remainingAmount,
      status: invoice.status,
      discount_percentage: invoice.discountPercentage ?? 0,
      late_fee_percentage: invoice.lateFeePercentage ?? 0,
      late_fee_amount: invoice.lateFeeAmount ?? 0,
      payment_type: invoice.paymentType,
      payment_plan: invoice.paymentPlan,
      next_payment_due: invoice.nextPaymentDue
    };
    const { data, error } = await supabase
      .from('invoices')
      .insert([payload])
      .select()
      .single();
    if (error || !data) throw error;
    {// Transformo a Invoice
      const d: any = data;
      return {
        id: d.id,
        invoiceNumber: d.invoice_number,
        date: d.date,
        clientId: d.client_id,
        clientName: d.client_name,
        address: d.address || undefined,
        cedula: d.cedula || undefined,
        phone: d.phone || undefined,
        attachment: d.attachment || undefined,
        items: d.items,
        subtotal: d.subtotal,
        total: d.total,
        remainingAmount: d.remaining_amount,
        status: d.status,
        discountPercentage: d.discount_percentage,
        lateFeePercentage: d.late_fee_percentage,
        lateFeeAmount: d.late_fee_amount,
        paymentType: d.payment_type,
        paymentPlan: d.payment_plan,
        payments: d.payments,
        nextPaymentDue: d.next_payment_due || undefined,
      } as Invoice;
    }
  },

  updateInvoice: async (invoice: Invoice): Promise<Invoice> => {
    // Si es contado y está retrasada, calcular mora
    if (invoice.paymentType === 'cash' && invoice.status === 'delayed') {
      const percentage = calculateLateFeePercentage(invoice);
      const amount = calculateLateFeeAmount(invoice);
      invoice.lateFeePercentage = percentage;
      invoice.lateFeeAmount = amount;
    }
    // Map fields a snake_case para la actualización
    const payload = {
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      address: invoice.address,
      cedula: invoice.cedula,
      phone: invoice.phone,
      attachment: invoice.attachment,
      items: invoice.items,
      subtotal: invoice.subtotal,
      total: invoice.total,
      remaining_amount: invoice.remainingAmount,
      status: invoice.status,
      discount_percentage: invoice.discountPercentage ?? 0,
      late_fee_percentage: invoice.lateFeePercentage ?? 0,
      late_fee_amount: invoice.lateFeeAmount ?? 0,
      payment_type: invoice.paymentType,
      payment_plan: invoice.paymentPlan,
      next_payment_due: invoice.nextPaymentDue
    };
    const { data, error } = await supabase
      .from('invoices')
      .update(payload)
      .eq('id', invoice.id)
      .select()
      .single();
    if (error || !data) throw error;
    {// Transformo a Invoice
      const d: any = data;
      return {
        id: d.id,
        invoiceNumber: d.invoice_number,
        date: d.date,
        clientId: d.client_id,
        clientName: d.client_name,
        address: d.address || undefined,
        cedula: d.cedula || undefined,
        phone: d.phone || undefined,
        attachment: d.attachment || undefined,
        items: d.items,
        subtotal: d.subtotal,
        total: d.total,
        remainingAmount: d.remaining_amount,
        status: d.status,
        discountPercentage: d.discount_percentage,
        lateFeePercentage: d.late_fee_percentage,
        lateFeeAmount: d.late_fee_amount,
        paymentType: d.payment_type,
        paymentPlan: d.payment_plan,
        payments: d.payments,
        nextPaymentDue: d.next_payment_due || undefined,
      } as Invoice;
    }
  },

  getClientInvoices: async (clientId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId);
    if (error) throw error;
    return (data || []).map((d: any) => {
      const inv: Invoice = {
        id: d.id,
        invoiceNumber: d.invoice_number,
        date: d.date,
        clientId: d.client_id,
        clientName: d.client_name,
        address: d.address || undefined,
        cedula: d.cedula || undefined,
        phone: d.phone || undefined,
        attachment: d.attachment || undefined,
        items: d.items,
        subtotal: d.subtotal,
        total: d.total,
        remainingAmount: d.remaining_amount,
        status: d.status,
        discountPercentage: d.discount_percentage ?? 0,
        lateFeePercentage: d.late_fee_percentage ?? 0,
        lateFeeAmount: d.late_fee_amount ?? 0,
        paymentType: d.payment_type,
        paymentPlan: d.payment_plan,
        payments: d.payments,
        nextPaymentDue: d.next_payment_due || undefined,
      } as Invoice;
      if (inv.paymentType === 'credit') {
        inv.status = computeInvoiceStatus(inv).status;
      }
      return inv;
    });
  },
}; 