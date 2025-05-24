// Servicio para obtener los vouchers/facturas desde el backend (GitHub)
export const voucherService = {
  getVouchers: async () => {
    const apiBase = process.env.REACT_APP_API_URL || '';
    const res = await fetch(`${apiBase}/api/list-vouchers`);
    if (!res.ok) throw new Error('No se pudieron obtener los vouchers');
    const data = await res.json();
    return data.vouchers;
  }
};
