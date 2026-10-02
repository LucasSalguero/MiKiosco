import type { DatosProducto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { fallo, ok } from "@/shared/lib/resultado";

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function validarDatosProducto(datos: unknown): Resultado<DatosProducto> {
  if (!esRegistro(datos)) {
    return fallo("Los datos del producto no son válidos.", "validation");
  }
  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  const precio = Number(datos.precio);

  if (!nombre) {
    return fallo("El nombre del producto es obligatorio.");
  }

  if (!Number.isFinite(precio) || precio <= 0 || precio > Number.MAX_SAFE_INTEGER / 100) {
    return fallo("El precio debe ser mayor a cero y estar dentro del límite permitido.");
  }

  return ok({ nombre, precio: Number(precio.toFixed(2)) });
}
