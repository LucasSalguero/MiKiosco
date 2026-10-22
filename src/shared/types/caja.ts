export type TipoMovimientoCaja = "EGRESO" | "RETIRO" | "INGRESO";

export type MovimientoCaja = {
  id: number;
  fecha: string;
  tipo: TipoMovimientoCaja;
  monto: number;
  motivo: string;
  anulado: boolean;
};

/** Totales del arqueo de un día, en pesos. */
export type TotalesArqueo = {
  vendido: number;
  cobrado: number;
  cobradoEfectivo: number;
  cobradoTransferencia: number;
  cobradoDesconocido: number;
  fiadoNuevo: number;
  ingresos: number;
  egresos: number;
  retiros: number;
  fondoInicial: number;
  efectivoEsperado: number;
  cantidadVentas: number;
  cantidadAnuladas: number;
  ticketPromedio: number;
};

export type EstadoDiferencia = "exacto" | "faltante" | "sobrante";

/** Foto guardada al cerrar la caja. No cambia después del cierre. */
export type CierreCaja = {
  fecha: string;
  fondoInicial: number;
  efectivoEsperado: number;
  efectivoContado: number;
  diferencia: number;
  totalVendido: number;
  totalCobrado: number;
  totalEfectivo: number;
  totalTransfer: number;
  totalDesconocido: number;
  fiadoNuevo: number;
  totalEgresos: number;
  totalRetiros: number;
  totalIngresos: number;
  cantidadVentas: number;
  observaciones: string | null;
  cerradoEn: string;
};

export type ProductoVendido = {
  clave: string;
  nombre: string;
  cantidad: number;
  importe: number;
};

export type VentasDeLaHora = {
  hora: number;
  cantidad: number;
  importe: number;
};

/** Ventas y cobros que entraron al servidor después de cerrar la caja de ese día. */
export type PosterioresAlCierre = {
  cantidadVentas: number;
  importeVentas: number;
  importeCobros: number;
};

type DetalleDelDia = {
  fecha: string;
  movimientos: MovimientoCaja[];
  topProductos: ProductoVendido[];
  ventasPorHora: VentasDeLaHora[];
};

export type ArqueoDelDia =
  | (DetalleDelDia & { cerrado: false; arqueo: TotalesArqueo; fondoSugerido: number })
  | (DetalleDelDia & { cerrado: true; cierre: CierreCaja; posteriores: PosterioresAlCierre });

export type DatosCierreCaja = {
  fecha: string;
  fondoInicial: number;
  efectivoContado: number;
  observaciones?: string;
};
