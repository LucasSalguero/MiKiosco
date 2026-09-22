import type { DatosProducto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { fallo, ok } from "@/shared/lib/resultado";

export function validarDatosProducto(datos: DatosProducto): Resultado<DatosProducto> {
  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  const precio = Number(datos.precio);

  if (!nombre) {
    return fallo("El nombre del producto es obligatorio.");
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    return fallo("El precio debe ser mayor a cero.");
  }

  return ok({ nombre, precio: Number(precio.toFixed(2)) });
}
