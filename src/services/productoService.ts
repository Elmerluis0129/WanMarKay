import { supabase } from './supabase';
import { Producto } from '../types/producto';

export const productoService = {
  async getProductos(query?: string): Promise<Producto[]> {
    let req = supabase.from('productos').select('*');
    if (query) {
      req = req.ilike('nombre', `%${query}%`);
    }
    const { data, error } = await req;
    if (error) throw error;
    return data || [];
  },
  async getProductoById(id: string): Promise<Producto | null> {
    const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
};
