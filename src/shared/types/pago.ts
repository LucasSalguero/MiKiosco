import type { MedioPago } from "@/shared/types/venta";

export type Pago = {
  id: number;
  clienteFiadoId: number;
  ventaId: number | null;
  monto: number;
  medio: MedioPago | "DESCONOCIDO";
  fecha: string;
  anulado: boolean;
};
