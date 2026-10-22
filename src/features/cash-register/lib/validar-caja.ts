import { esFechaISOValida } from "@/shared/lib/fechas";
import { fallo, ok } from "@/shared/lib/resultado";
import type { TipoMovimientoCaja } from "@/shared/types/caja";
import type { Resultado } from "@/shared/types/resultado";

const MAXIMO_CENTAVOS = 999_999_999_999;
const CLAVE_OPERACION = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

/** Convierte un importe en pesos a centavos si tiene hasta 2 decimales y está en rango. */
function importeACentavos(valor: unknown, permitirCero: boolean): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  const centavos = Math.round(valor * 100);
  if (Math.abs(valor * 100 - centavos) > 1e-6) return null;
  if (centavos < 0 || (!permitirCero && centavos === 0) || centavos > MAXIMO_CENTAVOS) return null;
  return centavos;
}

export function esClaveOperacion(valor: unknown): valor is string {
  return typeof valor === "string" && CLAVE_OPERACION.test(valor);
}

export function validarMovimientoCaja(
  tipo: unknown,
  monto: unknown,
  motivo: unknown,
): Resultado<{ tipo: TipoMovimientoCaja; montoCentavos: number; motivo: string }> {
  if (tipo !== "EGRESO" && tipo !== "RETIRO" && tipo !== "INGRESO") {
    return fallo("Elegí si es un egreso, un retiro o un ingreso.", "validation");
  }
  const montoCentavos = importeACentavos(monto, false);
  if (montoCentavos === null) {
    return fallo("Ingresá un importe mayor a cero, con hasta 2 decimales.", "validation");
  }
  const motivoLimpio = typeof motivo === "string" ? motivo.trim().replace(/\s+/g, " ") : "";
  if (!motivoLimpio) return fallo("Escribí el motivo del movimiento.", "validation");
  if (motivoLimpio.length > 160) {
    return fallo("El motivo no puede superar los 160 caracteres.", "validation");
  }
  return ok({ tipo, montoCentavos, motivo: motivoLimpio });
}

export function validarCierreCaja(
  datos: unknown,
  hoy: string,
): Resultado<{
  fecha: string;
  fondoInicialCentavos: number;
  efectivoContadoCentavos: number;
  observaciones: string | null;
}> {
  if (typeof datos !== "object" || datos === null) {
    return fallo("Los datos del cierre no son válidos.", "validation");
  }
  const { fecha, fondoInicial, efectivoContado, observaciones } = datos as Record<string, unknown>;
  if (typeof fecha !== "string" || !esFechaISOValida(fecha)) {
    return fallo("La fecha del cierre no es válida.", "validation");
  }
  if (fecha > hoy) return fallo("No se puede cerrar la caja de un día futuro.", "validation");
  const fondoInicialCentavos = importeACentavos(fondoInicial, true);
  if (fondoInicialCentavos === null) {
    return fallo("Ingresá un fondo inicial válido (0 o más).", "validation");
  }
  const efectivoContadoCentavos = importeACentavos(efectivoContado, true);
  if (efectivoContadoCentavos === null) {
    return fallo("Ingresá el efectivo contado (0 o más, con hasta 2 decimales).", "validation");
  }
  if (observaciones !== undefined && observaciones !== null && typeof observaciones !== "string") {
    return fallo("Las observaciones no son válidas.", "validation");
  }
  const observacionesLimpias = typeof observaciones === "string" ? observaciones.trim() : "";
  if (observacionesLimpias.length > 500) {
    return fallo("Las observaciones no pueden superar los 500 caracteres.", "validation");
  }
  return ok({
    fecha,
    fondoInicialCentavos,
    efectivoContadoCentavos,
    observaciones: observacionesLimpias || null,
  });
}

/** Un reintento con la misma clave es válido solo si describe el mismo movimiento. */
export function resolverMovimientoIdempotente(
  existente: { tipo: TipoMovimientoCaja; montoCentavos: number; motivo: string },
  nuevo: { tipo: TipoMovimientoCaja; montoCentavos: number; motivo: string },
): "repetido" | "conflicto" {
  return existente.tipo === nuevo.tipo &&
    existente.montoCentavos === nuevo.montoCentavos &&
    existente.motivo === nuevo.motivo
    ? "repetido"
    : "conflicto";
}
