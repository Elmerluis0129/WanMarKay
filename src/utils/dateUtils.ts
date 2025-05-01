import { PaymentFrequency } from '../types/invoice';

/**
 * Devuelve la siguiente fecha de pago en base a la frecuencia indicada.
 * @param date Fecha de referencia
 * @param frequency Frecuencia de pago ('daily' | 'weekly' | 'biweekly' | 'monthly')
 */
export function addFrequency(date: Date, frequency: PaymentFrequency): Date {
    const result = new Date(date);
    switch (frequency) {
        case 'daily':
            result.setDate(result.getDate() + 1);
            break;
        case 'weekly':
            result.setDate(result.getDate() + 7);
            break;
        case 'biweekly':
            result.setDate(result.getDate() + 14);
            break;
        case 'monthly':
            result.setMonth(result.getMonth() + 1);
            break;
        default:
            throw new Error(`Frecuencia ${frequency} no soportada`);
    }
    return result;
}

/**
 * Calcula la cantidad de días restantes desde la fecha de referencia hasta nextDate.
 * Usa Math.ceil para redondear hacia arriba.
 * @param nextDate Fecha límite de pago
 * @param referenceDate Fecha de referencia (por defecto hoy)
 */
export function calculateDaysRemaining(nextDate: Date, referenceDate: Date = new Date()): number {
    const diffTime = nextDate.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
} 