"use server";

import type { Resultado } from "@/shared/types/resultado";
import { guardarVenta } from "@/features/sales/lib/guardar-venta";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { fallo } from "@/shared/lib/resultado";

export async function crearVenta(
  venta: unknown,
  claveOperacion: unknown,
): Promise<Resultado<{ id: number }>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  return guardarVenta(venta, claveOperacion);
}
