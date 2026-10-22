import { CATEGORIAS, type CategoriaProducto, type DatosProducto } from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

import { fallo, ok } from "@/shared/lib/resultado";

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function esCategoriaProducto(valor: unknown): valor is CategoriaProducto {
  return CATEGORIAS.some((categoria) => categoria.valor === valor);
}

/** Texto opcional: vacío o ausente → null; si no es string → undefined (inválido). */
function textoOpcional(valor: unknown): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim().replace(/\s+/g, " ");
  return limpio || null;
}

export function validarDatosProducto(datos: unknown): Resultado<DatosProducto> {
  if (!esRegistro(datos)) {
    return fallo("Los datos del producto no son válidos.", "validation");
  }
  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  const precio = Number(datos.precio);

  if (!nombre) {
    return fallo("El nombre del producto es obligatorio.", "validation");
  }

  if (!Number.isFinite(precio) || precio <= 0 || precio > Number.MAX_SAFE_INTEGER / 100) {
    return fallo(
      "El precio debe ser mayor a cero y estar dentro del límite permitido.",
      "validation",
    );
  }

  const categoria = datos.categoria ?? "VARIOS";
  if (!esCategoriaProducto(categoria)) {
    return fallo("Elegí una categoría válida.", "validation");
  }

  const marca = textoOpcional(datos.marca);
  if (marca === undefined || (marca && marca.length > 80)) {
    return fallo("La marca no puede superar los 80 caracteres.", "validation");
  }

  const codigoTexto = textoOpcional(datos.codigoBarras);
  const codigoBarras = codigoTexto ? codigoTexto.replace(/\s/g, "") : codigoTexto;
  if (codigoBarras === undefined || (codigoBarras !== null && !/^\d{4,32}$/.test(codigoBarras))) {
    return fallo("El código de barras debe tener entre 4 y 32 dígitos.", "validation");
  }

  return ok({ nombre, precio: Number(precio.toFixed(2)), categoria, marca, codigoBarras });
}
