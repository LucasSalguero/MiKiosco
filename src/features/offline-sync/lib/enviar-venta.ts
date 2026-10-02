import type { Resultado } from "@/shared/types/resultado";
import type { NuevaVenta } from "@/shared/types/venta";
import { fallo } from "@/shared/lib/resultado";

function esResultado(valor: unknown): valor is Resultado<{ id: number }> {
  if (typeof valor !== "object" || valor === null || !("ok" in valor)) return false;
  if (valor.ok === true) {
    return (
      "data" in valor &&
      typeof valor.data === "object" &&
      valor.data !== null &&
      "id" in valor.data &&
      typeof valor.data.id === "number"
    );
  }
  return (
    "error" in valor &&
    typeof valor.error === "string" &&
    "code" in valor &&
    (valor.code === "validation" ||
      valor.code === "database" ||
      valor.code === "storage" ||
      valor.code === "network" ||
      valor.code === "unauthorized" ||
      valor.code === "unknown")
  );
}

export async function enviarVenta(
  venta: NuevaVenta,
  clienteId: string,
): Promise<Resultado<{ id: number }>> {
  try {
    const respuesta = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venta, clienteId }),
      signal: AbortSignal.timeout(8000),
    });
    const cuerpo: unknown = await respuesta.json();
    if (!esResultado(cuerpo))
      return fallo("El servidor devolvió una respuesta inválida.", "database");
    if (cuerpo.ok) return cuerpo;

    if (respuesta.status >= 400 && respuesta.status < 500 && cuerpo.code === "validation") {
      return fallo(cuerpo.error, "validation");
    }
    return fallo(cuerpo.error, respuesta.status >= 500 ? "database" : cuerpo.code);
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "TimeoutError")
    ) {
      return fallo("No se pudo conectar con el servidor.", "network");
    }
    console.error("offline-sync.enviarVenta", error);
    return fallo("No se pudo procesar la respuesta del servidor.", "database");
  }
}
