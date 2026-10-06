"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import type { Cliente } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";

export async function listarClientes(): Promise<Resultado<Cliente[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const clientes = await prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, telefono: true, activo: true },
      orderBy: { nombre: "asc" },
    });
    return ok(clientes);
  } catch (error) {
    console.error("fiados.listarClientes", error);
    return fallo("No se pudieron cargar los clientes.", "database");
  }
}
