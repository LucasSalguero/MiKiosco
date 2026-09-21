export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export function fechaLocalISO(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

export function rangoDelDia(fechaISO: string): { desde: Date; hasta: Date } {
  const [año, mes, dia] = fechaISO.split("-").map(Number);
  if (!año || !mes || !dia) {
    const valor = new Date(fechaISO);
    return {
      desde: valor,
      hasta: new Date(valor.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  const desde = new Date(Date.UTC(año, mes - 1, dia, 3, 0, 0, 0));
  const hasta = new Date(desde);
  hasta.setUTCDate(hasta.getUTCDate() + 1);
  return { desde, hasta };
}

export function hoyISO(): string {
  return fechaLocalISO(new Date());
}
