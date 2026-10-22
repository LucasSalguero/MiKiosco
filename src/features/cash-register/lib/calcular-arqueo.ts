import type { TipoMovimientoCaja, TotalesArqueo } from "@/shared/types/caja";
import type { EstadoPago, MedioPagoRegistrado } from "@/shared/types/venta";

export type VentaArqueo = {
  totalCentavos: number;
  estadoPago: EstadoPago;
  medioPago: MedioPagoRegistrado | null;
  anulada: boolean;
};

/** Pago de un fiado registrado en el día (sin importar cuándo fue la venta). */
export type PagoArqueo = {
  montoCentavos: number;
  medio: MedioPagoRegistrado;
  anulado: boolean;
};

export type MovimientoArqueo = {
  tipo: TipoMovimientoCaja;
  montoCentavos: number;
  anulado: boolean;
};

/** Mismos campos que TotalesArqueo, en centavos enteros (salvo las cantidades). */
export type ArqueoCentavos = TotalesArqueo;

/** División entera redondeada al centavo más cercano (mitades hacia arriba). */
function dividirRedondeando(dividendo: number, divisor: number): number {
  return divisor === 0 ? 0 : Math.floor((dividendo * 2 + divisor) / (divisor * 2));
}

/**
 * Arqueo de un día:
 * - cobrado = ventas PAGADA + pagos de fiados del día, por medio;
 * - efectivo esperado = fondo + ventas en efectivo + cobros de fiados en efectivo
 *   + ingresos − egresos − retiros.
 * Las ventas y los movimientos anulados no cuentan. Todo en centavos.
 */
export function calcularArqueo({
  ventas,
  pagos,
  movimientos,
  fondoInicialCentavos,
}: {
  ventas: readonly VentaArqueo[];
  pagos: readonly PagoArqueo[];
  movimientos: readonly MovimientoArqueo[];
  fondoInicialCentavos: number;
}): ArqueoCentavos {
  const cobradoPorMedio: Record<MedioPagoRegistrado, number> = {
    EFECTIVO: 0,
    TRANSFERENCIA: 0,
    DESCONOCIDO: 0,
  };
  let vendido = 0;
  let fiadoNuevo = 0;
  let cantidadVentas = 0;
  let cantidadAnuladas = 0;

  for (const venta of ventas) {
    if (venta.anulada) {
      cantidadAnuladas += 1;
      continue;
    }
    cantidadVentas += 1;
    vendido += venta.totalCentavos;
    if (venta.estadoPago === "PAGADA") {
      cobradoPorMedio[venta.medioPago ?? "DESCONOCIDO"] += venta.totalCentavos;
    } else {
      fiadoNuevo += venta.totalCentavos;
    }
  }

  for (const pago of pagos) {
    if (!pago.anulado) cobradoPorMedio[pago.medio] += pago.montoCentavos;
  }

  const porTipo: Record<TipoMovimientoCaja, number> = { EGRESO: 0, RETIRO: 0, INGRESO: 0 };
  for (const movimiento of movimientos) {
    if (!movimiento.anulado) porTipo[movimiento.tipo] += movimiento.montoCentavos;
  }

  return {
    vendido,
    cobrado: cobradoPorMedio.EFECTIVO + cobradoPorMedio.TRANSFERENCIA + cobradoPorMedio.DESCONOCIDO,
    cobradoEfectivo: cobradoPorMedio.EFECTIVO,
    cobradoTransferencia: cobradoPorMedio.TRANSFERENCIA,
    cobradoDesconocido: cobradoPorMedio.DESCONOCIDO,
    fiadoNuevo,
    ingresos: porTipo.INGRESO,
    egresos: porTipo.EGRESO,
    retiros: porTipo.RETIRO,
    fondoInicial: fondoInicialCentavos,
    efectivoEsperado:
      fondoInicialCentavos +
      cobradoPorMedio.EFECTIVO +
      porTipo.INGRESO -
      porTipo.EGRESO -
      porTipo.RETIRO,
    cantidadVentas,
    cantidadAnuladas,
    ticketPromedio: dividirRedondeando(vendido, cantidadVentas),
  };
}

/** Pasa a pesos los importes del arqueo; las cantidades quedan igual. */
export function arqueoAPesos(arqueo: ArqueoCentavos): TotalesArqueo {
  const aPesos = (centavos: number) => centavos / 100;
  return {
    ...arqueo,
    vendido: aPesos(arqueo.vendido),
    cobrado: aPesos(arqueo.cobrado),
    cobradoEfectivo: aPesos(arqueo.cobradoEfectivo),
    cobradoTransferencia: aPesos(arqueo.cobradoTransferencia),
    cobradoDesconocido: aPesos(arqueo.cobradoDesconocido),
    fiadoNuevo: aPesos(arqueo.fiadoNuevo),
    ingresos: aPesos(arqueo.ingresos),
    egresos: aPesos(arqueo.egresos),
    retiros: aPesos(arqueo.retiros),
    fondoInicial: aPesos(arqueo.fondoInicial),
    efectivoEsperado: aPesos(arqueo.efectivoEsperado),
    ticketPromedio: aPesos(arqueo.ticketPromedio),
  };
}
