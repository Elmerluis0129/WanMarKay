import { Invoice, InvoiceStatus } from '../types/invoice';
import { calculateDaysRemaining } from './dateUtils';

export interface InvoiceStatusResult {
  status: InvoiceStatus;
  daysRemaining?: number;
  daysLate?: number;
}

/**
 * Retorna el estado dinámico de la factura:
 * 'paid' si está totalmente pagada,
 * 'on_time' si se han hecho al menos los pagos esperados,
 * 'delayed' si faltan pagos para la fecha actual,
 * 'pending' si aún no inicia la primera cuota.
 */
export function computeInvoiceStatus(invoice: Invoice): InvoiceStatusResult {
  // Para pagos al contado: pending hasta 3 meses, luego delayed si no se pagó (no hay pagos para cash)
  if (invoice.paymentType === 'cash') {
    // Convertir la fecha de la factura a Date
    const invDate = new Date(invoice.date);
    const today = new Date();
    const days = Math.floor((today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
    // Si se ha pagado, está pagada
    if (invoice.remainingAmount <= 0) {
      return { status: 'paid' };
    }
    // Si pasaron 3 meses (aprox 90 días) y no se ha pagado, está retrasada
    if (days >= 90) {
      return { status: 'delayed', daysLate: calculateDaysRemaining(today, invDate) };
    }
    // Si se ha pagado parcialmente (se debe menos que el total) y no han pasado 3 meses, está a tiempo
    if (invoice.remainingAmount < invoice.total) {
      return { status: 'on_time', daysRemaining: calculateDaysRemaining(today, invDate) };
    }
    // Si se ha registrado un pago, está a tiempo
    if (invoice.payments && invoice.payments.length > 0) {
      return { status: 'on_time', daysRemaining: calculateDaysRemaining(today, invDate) };
    }
    // Antes de 3 meses o si no ha pasado el plazo, sigue pendiente
    return {
      status: 'on_time',
      daysRemaining: calculateDaysRemaining(today, invDate)
    };
  }
  // Si es crédito y tiene plan de pago
  if (invoice.paymentType === 'credit' && invoice.paymentPlan) {
    const plan = invoice.paymentPlan;
    if (invoice.remainingAmount <= 0) {
      return { status: 'paid' };
    }
    if (plan.nextPaymentDate) {
      const nextPayment = new Date(plan.nextPaymentDate);
      const today = new Date();
      const pagosRegistrados = invoice.payments?.length || 0;
      // Antes: Solo 'pending' si NO hay ningún pago registrado y falta para el primer pago
      // Ahora: Siempre 'on_time' si falta para el próximo pago
      if (nextPayment > today) {
        return {
          status: 'on_time',
          daysRemaining: calculateDaysRemaining(nextPayment, today)
        };
      }
      // Si la próxima cuota ya llegó o pasó y no se ha registrado el pago correspondiente, está retrasada
      if (nextPayment <= today) {
        return {
          status: 'delayed',
          daysLate: calculateDaysRemaining(today, nextPayment)
        };
      }
    }
    // Lógica original para cuotas vencidas
    const startDate = new Date(plan.startDate);
    const today = new Date();
    const days = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let periodDays: number;
    switch (plan.frequency) {
      case 'monthly':
        periodDays = 30;
        break;
      case 'biweekly':
        periodDays = 14;
        break;
      default:
        periodDays = Infinity;
    }
    if (days < periodDays) {
      return { status: 'on_time', daysRemaining: calculateDaysRemaining(today, startDate) };
    }
    const dueInstallments = Math.min(
      Math.floor(days / periodDays) + 1,
      plan.totalInstallments || 0
    );
    const paidInstallments = invoice.payments?.length || 0;
    if (paidInstallments >= plan.totalInstallments!) {
      return { status: 'paid' };
    }
    if (paidInstallments >= dueInstallments) {
      return { status: 'on_time', daysRemaining: calculateDaysRemaining(today, startDate) };
    }
    return { status: 'delayed', daysLate: calculateDaysRemaining(today, startDate) };
  }
  // Totalmente pagada
  if (invoice.remainingAmount <= 0) {
    return { status: 'paid' };
  }
  // Sin plan de pago o contado => pendiente inicial
  const plan = invoice.paymentPlan;
  if (!plan) {
    return { status: 'on_time', daysRemaining: calculateDaysRemaining(new Date(), new Date(invoice.date)) };
  }
  const startDate = new Date(plan.startDate);
  const today = new Date();
  // Días transcurridos desde el inicio
  const days = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  // Determinar el periodo en días según frecuencia
  let periodDays: number;
  switch (plan.frequency) {
    case 'monthly':
      periodDays = 30;
      break;
    case 'biweekly':
      periodDays = 14;
      break;
    default:
      periodDays = Infinity;
  }
  // Si aún no comenzó la primera cuota
  if (days < periodDays) {
    return { status: 'on_time', daysRemaining: calculateDaysRemaining(today, startDate) };
  }
  // Cuotas que deberían haberse pagado hasta hoy
  const dueInstallments = Math.min(
    Math.floor(days / periodDays) + 1,
    plan.totalInstallments || 0
  );
  const paidInstallments = invoice.payments?.length || 0;
  if (paidInstallments >= plan.totalInstallments!) {
    return { status: 'paid' };
  }
  // Si pagó al menos las cuotas debidas -> a tiempo
  if (paidInstallments >= dueInstallments) {
    return { status: 'on_time', daysRemaining: calculateDaysRemaining(today, startDate) };
  }
  // Si faltan pagos -> retrasada
  return { status: 'delayed', daysLate: calculateDaysRemaining(today, startDate) };
} 