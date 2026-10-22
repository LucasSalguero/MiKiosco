import { fallo, ok } from "@/shared/lib/resultado";
import { normalizarTexto } from "@/shared/lib/texto";
import { esCategoriaProducto } from "@/features/products/lib/validar-producto";
import type {
  CambioPrecio,
  FiltroActualizacionMasiva,
  Producto,
  RedondeoPrecio,
} from "@/shared/types/producto";
import type { Resultado } from "@/shared/types/resultado";

export const PORCENTAJE_MINIMO = -90;
export const PORCENTAJE_MAXIMO = 300;

const PASO_REDONDEO: Record<RedondeoPrecio, bigint> = {
  NINGUNO: BigInt(1),
  DIEZ: BigInt(1_000),
  CINCUENTA: BigInt(5_000),
};

/**
 * Precio nuevo en centavos: aplica el porcentaje redondeando al centavo
 * (mitades hacia arriba) y después redondea hacia arriba al múltiplo de $10 o
 * $50 si se pidió. Nunca devuelve menos que el paso de redondeo (ni 0).
 */
export function calcularPrecioNuevoCentavos(
  precioCentavos: number,
  porcentaje: number,
  redondeo: RedondeoPrecio,
): number {
  const puntosBasicos = BigInt(Math.round(porcentaje * 100));
  const precio = BigInt(precioCentavos);
  const diezMil = BigInt(10_000);
  const numerador = precio * (diezMil + puntosBasicos);
  // División entera con redondeo half-up (numerador siempre ≥ 0 con porcentaje ≥ -90).
  const conPorcentaje = (numerador * BigInt(2) + diezMil) / (diezMil * BigInt(2));
  const paso = PASO_REDONDEO[redondeo];
  const redondeado = ((conPorcentaje + paso - BigInt(1)) / paso) * paso;
  return Number(redondeado < paso ? paso : redondeado);
}

export function validarActualizacionMasiva(datos: unknown): Resultado<{
  filtro: FiltroActualizacionMasiva;
  porcentaje: number;
  redondeo: RedondeoPrecio;
}> {
  if (typeof datos !== "object" || datos === null) {
    return fallo("Los datos de la actualización no son válidos.", "validation");
  }
  const { categoria, marca, porcentaje, redondeo } = datos as Record<string, unknown>;
  if (categoria !== null && !esCategoriaProducto(categoria)) {
    return fallo("Elegí una categoría válida.", "validation");
  }
  if (marca !== null && (typeof marca !== "string" || !marca.trim())) {
    return fallo("La marca elegida no es válida.", "validation");
  }
  if (
    typeof porcentaje !== "number" ||
    !Number.isFinite(porcentaje) ||
    porcentaje === 0 ||
    porcentaje < PORCENTAJE_MINIMO ||
    porcentaje > PORCENTAJE_MAXIMO ||
    Math.abs(porcentaje * 100 - Math.round(porcentaje * 100)) > 1e-6
  ) {
    return fallo(
      `Ingresá un porcentaje entre ${PORCENTAJE_MINIMO}% y +${PORCENTAJE_MAXIMO}%, distinto de 0 y con hasta 2 decimales.`,
      "validation",
    );
  }
  if (redondeo !== "NINGUNO" && redondeo !== "DIEZ" && redondeo !== "CINCUENTA") {
    return fallo("Elegí una opción de redondeo válida.", "validation");
  }
  return ok({
    filtro: { categoria, marca: typeof marca === "string" ? marca.trim() : null },
    porcentaje,
    redondeo,
  });
}

/** Productos activos alcanzados por el filtro (la marca se compara sin tildes ni mayúsculas). */
export function filtrarParaActualizacion<
  T extends Pick<Producto, "categoria" | "marca" | "activo">,
>(productos: readonly T[], filtro: FiltroActualizacionMasiva): T[] {
  const marca = filtro.marca ? normalizarTexto(filtro.marca) : null;
  return productos.filter(
    (producto) =>
      producto.activo &&
      (filtro.categoria === null || producto.categoria === filtro.categoria) &&
      (marca === null || (producto.marca !== null && normalizarTexto(producto.marca) === marca)),
  );
}

/** Vista previa: precio actual → precio nuevo de cada producto alcanzado. */
export function previsualizarPrecios(
  productos: readonly Producto[],
  filtro: FiltroActualizacionMasiva,
  porcentaje: number,
  redondeo: RedondeoPrecio,
): CambioPrecio[] {
  return filtrarParaActualizacion(productos, filtro)
    .map((producto) => {
      const actualCentavos = Math.round(producto.precio * 100);
      return {
        id: producto.id,
        nombre: producto.nombre,
        marca: producto.marca,
        precioActual: actualCentavos / 100,
        precioNuevo: calcularPrecioNuevoCentavos(actualCentavos, porcentaje, redondeo) / 100,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"));
}
