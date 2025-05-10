import { Invoice } from '../types/invoice';

/**
 * Calcula el porcentaje de mora basado en los días de atraso
 * - 3-6 meses: 10%
 * - 6-9 meses: 20%
 * - 9-12 meses: 30%
 * - 12+ meses: 40%
 */
export function calculateLateFeePercentage(invoice: Invoice): number {
    if (invoice.paymentType === 'cash') {
        const invDate = new Date(invoice.date);
        const today = new Date();
        const days = Math.floor((today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);

        if (months < 3) return 0; // No hay mora antes de 3 meses
        if (months >= 3 && months < 6) return 10; // 10% después de 3 meses
        if (months >= 6 && months < 9) return 20; // 20% después de 6 meses
        if (months >= 9 && months < 12) return 30; // 30% después de 9 meses
        return 40; // 40% después de 12 meses
    }
    return 0;
}

/**
 * Calcula el monto de mora basado en el porcentaje y el saldo pendiente
 */
export function calculateLateFeeAmount(invoice: Invoice): number {
    const percentage = calculateLateFeePercentage(invoice);
    if (percentage === 0 || invoice.remainingAmount <= 0) return 0;
    return (invoice.remainingAmount * percentage) / 100;
}
