import { notFound } from "next/navigation";

import { consolidarVencidasDelDia } from "@/features/fiados/actions/consolidar-vencidas-del-dia";
import { obtenerCuentaCliente } from "@/features/fiados/actions/obtener-cuenta-cliente";
import { CuentaClienteDetalle } from "@/features/fiados/ui/CuentaClienteDetalle";

export const dynamic = "force-dynamic";

export default async function CuentaFiadosPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const id = Number(clienteId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const consolidacion = await consolidarVencidasDelDia();
  if (!consolidacion.ok) throw new Error(consolidacion.error);
  const resultado = await obtenerCuentaCliente(id);
  if (!resultado.ok) {
    if (resultado.code === "validation") notFound();
    throw new Error(resultado.error);
  }

  return <CuentaClienteDetalle cuenta={resultado.data} />;
}
