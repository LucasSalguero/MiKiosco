export type ResumenDiario = {
  fecha: string;
  vendido: number;
  cobrado: number;
  fiadoNuevo: number;
  deudaTotal: number;
  cantidadVentas: number;
  cantidadACobrarHoy: number;
  clavesOperacion?: string[];
  cantidadCobros?: number;
};
