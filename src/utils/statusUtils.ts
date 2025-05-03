import { Invoice } from '../types/invoice';

/**
 * Retorna el estado dinámico de la factura:
 * 'paid' si está totalmente pagada,
 * 'on_time' si se han hecho al menos los pagos esperados,
 * 'delayed' si faltan pagos para la fecha actual,
 * 'pending' si aún no inicia la primera cuota.
 */
export function computeInvoiceStatus(invoice: Invoice): 'paid' | 'on_time' | 'delayed' | 'pending' {
  // Para pagos al contado: pending hasta 3 meses, luego delayed si no se pagó (no hay pagos para cash)
  if (invoice.paymentType === 'cash') {
    // Convertir la fecha de la factura a Date
    const invDate = new Date(invoice.date);
    const today = new Date();
    const days = Math.floor((today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
    // Si pasaron 3 meses (aprox 90 días), está retrasada
    if (days >= 90) {
      return 'delayed';
    }
    // Antes de 3 meses, sigue pendiente
    return 'pending';
  }
  // Totalmente pagada
  if (invoice.remainingAmount <= 0) {
    return 'paid';
  }
  // Sin plan de pago o contado => pendiente inicial
  const plan = invoice.paymentPlan;
  if (!plan) {
    return 'pending';
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
    return 'pending';
  }
  // Cuotas que deberían haberse pagado hasta hoy
  const dueInstallments = Math.min(
    Math.floor(days / periodDays) + 1,
    plan.totalInstallments || 0
  );
  const paidInstallments = invoice.payments?.length || 0;
  if (paidInstallments >= plan.totalInstallments!) {
    return 'paid';
  }
  // Si pagó al menos las cuotas debidas -> a tiempo
  if (paidInstallments >= dueInstallments) {
    return 'on_time';
  }
  // Si faltan pagos -> retrasada
  return 'delayed';
} 