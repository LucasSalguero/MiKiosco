export type EstadoPago = "PAGADA" | "A_COBRAR_HOY" | "FIADA";
/** Medios que el usuario puede elegir al cobrar. */
export type MedioPago = "EFECTIVO" | "TRANSFERENCIA";
/** Medio guardado: DESCONOCIDO lo asigna solo el servidor a registros anteriores al dato. */
export type MedioPagoRegistrado = MedioPago | "DESCONOCIDO";

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
  estadoPago: EstadoPago;
  medioPago: MedioPagoRegistrado | null;
  clienteFiadoId: number | null;
  clienteNombre: string | null;
  autorizadaPor: string | null;
  saldoPendiente: number;
  items: VentaItem[];
};

export type Cliente = {
  id: number;
  nombre: string;
  telefono: string | null;
  activo: boolean;
};

export type ItemNuevaVenta = {
  productoId: number | null;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type NuevaVenta = {
  fecha: string;
  items: ItemNuevaVenta[];
  estadoPago?: EstadoPago;
  medioPago?: MedioPago;
  clienteFiadoId?: number;
  clienteNuevoNombre?: string;
  autorizadaPor?: string;
  autorizacionConfirmada?: boolean;
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

/** Venta ya validada por el servidor: puede traer DESCONOCIDO en ventas viejas de la cola offline. */
export type NuevaVentaValidada = Omit<NuevaVenta, "medioPago"> & {
  medioPago?: MedioPagoRegistrado;
};
