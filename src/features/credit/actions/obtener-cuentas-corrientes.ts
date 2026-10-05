"use server";

import prisma from "@/shared/db/client";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

export type VentaFiada = {
  id: number;
  fecha: string;
  total: number;
  cobrado: number;
  saldoPendiente: number;
  items: Array<{ id: number; nombre: string; cantidad: number; precioUnitario: number }>;
  cobros: Array<{ id: number; fecha: string; monto: number }>;
};

export type CuentaCorriente = {
  clienteNombre: string;
  saldoPendiente: number;
  ventas: VentaFiada[];
};

export async function obtenerCuentasCorrientes(): Promise<
  { ok: true; data: CuentaCorriente[] } | { ok: false; error: string }
> {
  if (!(await tieneSesionValida())) return { ok: false, error: "Ingresá el PIN para continuar." };

  try {
    const ventas = await prisma.venta.findMany({
      where: { tipoPago: "FIADO", anulada: false },
      include: {
        items: true,
        cobros: { orderBy: { fecha: "asc" } },
      },
      orderBy: { fecha: "desc" },
    });
    const cuentas = new Map<string, CuentaCorriente>();

    for (const venta of ventas) {
      const clienteNombre = venta.clienteNombre?.trim();
      if (!clienteNombre) continue;

      const cobrado = venta.cobros.reduce((suma, cobro) => suma + Number(cobro.monto), 0);
      const saldoPendiente = Math.max(0, Number((Number(venta.total) - cobrado).toFixed(2)));
      if (saldoPendiente <= 0) continue;

      const clave = clienteNombre.toLocaleLowerCase("es-AR");
      const cuenta = cuentas.get(clave) ?? { clienteNombre, saldoPendiente: 0, ventas: [] };
      cuenta.saldoPendiente = Number((cuenta.saldoPendiente + saldoPendiente).toFixed(2));
      cuenta.ventas.push({
        id: venta.id,
        fecha: venta.fecha.toISOString(),
        total: Number(venta.total),
        cobrado: Number(cobrado.toFixed(2)),
        saldoPendiente,
        items: venta.items.map((item) => ({
          id: item.id,
          nombre: item.productoNombre,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precioUnitario),
        })),
        cobros: venta.cobros.map((cobro) => ({
          id: cobro.id,
          fecha: cobro.fecha.toISOString(),
          monto: Number(cobro.monto),
        })),
      });
      cuentas.set(clave, cuenta);
    }

    return {
      ok: true,
      data: [...cuentas.values()].sort((a, b) =>
        a.clienteNombre.localeCompare(b.clienteNombre, "es-AR"),
      ),
    };
  } catch (error) {
    console.error("credit.obtenerCuentasCorrientes", error);
    return { ok: false, error: "No se pudieron cargar las cuentas corrientes." };
  }
}
