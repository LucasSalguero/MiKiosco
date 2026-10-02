import { guardarVenta } from "@/features/sales/lib/guardar-venta";
import type { NuevaVenta } from "@/shared/types/venta";

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export async function POST(request: Request): Promise<Response> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: "validation", error: "El pedido de venta no es válido." },
      { status: 400 },
    );
  }

  if (
    !esRegistro(cuerpo) ||
    typeof cuerpo.clienteId !== "string" ||
    !esRegistro(cuerpo.venta) ||
    typeof cuerpo.venta.fecha !== "string" ||
    !Array.isArray(cuerpo.venta.items)
  ) {
    return Response.json(
      { ok: false, code: "validation", error: "El pedido de venta no es válido." },
      { status: 400 },
    );
  }

  const resultado = await guardarVenta(cuerpo.venta as unknown as NuevaVenta, cuerpo.clienteId);
  return Response.json(resultado, {
    status: resultado.ok ? 200 : resultado.code === "validation" ? 400 : 500,
  });
}
