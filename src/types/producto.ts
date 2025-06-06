export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  codigo?: string;
  marca?: string;
  categoria?: string;
  stock?: number;
  unidad?: string;
}
