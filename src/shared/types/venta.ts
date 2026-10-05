export type VentaItem = {
  id: number;
  productoId: number | null;
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
  anulada: boolean;
  tipoPago: TipoPago;
  clienteNombre: string | null;
  saldoPendiente: number;
  items: VentaItem[];
};

export type TipoPago = "CONTADO" | "FIADO";

export type ItemNuevaVenta = {
  productoId: number | null;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type NuevaVenta = {
  fecha: string;
  items: ItemNuevaVenta[];
  tipoPago?: TipoPago;
  clienteNombre?: string;
};

export type VentaPendiente = {
  localId: string;
  venta: NuevaVenta;
  creadaEn: string;
  intentos: number;
  ultimoError?: string;
  proximoIntento?: string;
  estado?: "requiere-revision";
};

export type Carrito = ItemNuevaVenta[];
