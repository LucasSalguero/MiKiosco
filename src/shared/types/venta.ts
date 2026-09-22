export type VentaItem = {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type Venta = {
  id: number;
  fecha: string;
  total: number;
  sincronizada: boolean;
  items: VentaItem[];
};

export type ItemNuevaVenta = {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type NuevaVenta = {
  fecha: string;
  items: ItemNuevaVenta[];
};

export type VentaPendiente = {
  localId: string;
  venta: NuevaVenta;
  creadaEn: string;
  intentos: number;
  ultimoError?: string;
};

export type Carrito = ItemNuevaVenta[];
