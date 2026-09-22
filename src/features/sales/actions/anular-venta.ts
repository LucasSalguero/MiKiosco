"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

export async function anularVenta(id: number): Promise<Resultado<boolean>> {
  try { await prisma.venta.delete({ where: { id } }); return ok(true); } catch (error) { console.error("sales.anularVenta", error); return fallo("No se pudo deshacer la venta. Revisá el historial."); }
}
