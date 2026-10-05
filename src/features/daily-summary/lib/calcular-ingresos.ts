export function calcularIngresosDelDia(
  ventas: Array<{ total: number; tipoPago: "CONTADO" | "FIADO" }>,
  cobros: number[],
): number {
  const ingresosEnCentavos = ventas.reduce(
    (total, venta) => total + (venta.tipoPago === "CONTADO" ? Math.round(venta.total * 100) : 0),
    0,
  );
  const cobrosEnCentavos = cobros.reduce((total, cobro) => total + Math.round(cobro * 100), 0);
  return (ingresosEnCentavos + cobrosEnCentavos) / 100;
}
