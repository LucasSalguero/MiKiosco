export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

function partesEnZona(fecha: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA_HORARIA,
      calendar: "gregory",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(fecha)
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, parte.value]),
  );
}

export function fechaLocalISO(fecha: Date): string {
  const partes = partesEnZona(fecha);
  const año = partes.year;
  const mes = partes.month;
  const dia = partes.day;
  return `${año}-${mes}-${dia}`;
}

export function esFechaISOValida(fechaISO: string): boolean {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaISO);
  if (!coincidencia) return false;

  const [año, mes, dia] = coincidencia.slice(1).map(Number);
  if (año < 100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  const fecha = new Date(Date.UTC(año, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === año &&
    fecha.getUTCMonth() + 1 === mes &&
    fecha.getUTCDate() === dia
  );
}

function inicioDelDiaEnZona(año: number, mes: number, dia: number): Date {
  const fechaLocalComoUTC = Date.UTC(año, mes - 1, dia);
  let instante = fechaLocalComoUTC;

  for (let intento = 0; intento < 3; intento += 1) {
    const partes = partesEnZona(new Date(instante));
    const fechaFormateadaComoUTC = Date.UTC(
      Number(partes.year),
      Number(partes.month) - 1,
      Number(partes.day),
      Number(partes.hour),
      Number(partes.minute),
      Number(partes.second),
    );
    const diferencia = fechaLocalComoUTC - fechaFormateadaComoUTC;
    instante += diferencia;
    if (diferencia === 0) break;
  }

  return new Date(instante);
}

export function rangoDelDia(fechaISO: string): { desde: Date; hasta: Date } {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaISO);
  const [año, mes, dia] = coincidencia?.slice(1).map(Number) ?? [];
  if (!año || !mes || !dia) {
    const valor = new Date(fechaISO);
    return {
      desde: valor,
      hasta: new Date(valor.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  const desde = inicioDelDiaEnZona(año, mes, dia);
  const siguienteDia = new Date(Date.UTC(año, mes - 1, dia + 1));
  const hasta = inicioDelDiaEnZona(
    siguienteDia.getUTCFullYear(),
    siguienteDia.getUTCMonth() + 1,
    siguienteDia.getUTCDate(),
  );
  return { desde, hasta };
}

export function hoyISO(): string {
  return fechaLocalISO(new Date());
}
