import type { MedioPagoRegistrado } from "@/shared/types/venta";

export type Pago = {
  id: number;
  clienteFiadoId: number;
  ventaId: number | null;
  monto: number;
  medio: MedioPagoRegistrado;
  fecha: string;
  anulado: boolean;
};
