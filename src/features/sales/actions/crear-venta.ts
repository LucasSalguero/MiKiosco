"use server";

import type { NuevaVenta } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";
import { guardarVenta } from "@/features/sales/lib/guardar-venta";

export async function crearVenta(
  venta: NuevaVenta,
  clienteId: string,
): Promise<Resultado<{ id: number }>> {
  return guardarVenta(venta, clienteId);
}
