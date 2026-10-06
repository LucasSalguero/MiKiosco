import { guardarVenta } from "@/features/sales/lib/guardar-venta";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export async function POST(request: Request): Promise<Response> {
  if (!(await tieneSesionValida())) {
    return Response.json(
      { ok: false, code: "unauthorized", error: "Ingresá el PIN para continuar." },
      { status: 401 },
    );
  }

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
    typeof cuerpo.claveOperacion !== "string" ||
    !esRegistro(cuerpo.venta) ||
    typeof cuerpo.venta.fecha !== "string" ||
    !Array.isArray(cuerpo.venta.items) ||
    (cuerpo.esReintentoOffline !== undefined && typeof cuerpo.esReintentoOffline !== "boolean")
  ) {
    return Response.json(
      { ok: false, code: "validation", error: "El pedido de venta no es válido." },
      { status: 400 },
    );
  }

  const resultado = await guardarVenta(
    cuerpo.venta,
    cuerpo.claveOperacion,
    cuerpo.esReintentoOffline === true,
  );
  return Response.json(resultado, {
    status: resultado.ok ? 200 : resultado.code === "validation" ? 400 : 500,
  });
}
