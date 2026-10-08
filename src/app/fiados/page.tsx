import { consolidarVencidasDelDia } from "@/features/fiados/actions/consolidar-vencidas-del-dia";
import { listarACobrarHoy } from "@/features/fiados/actions/listar-a-cobrar-hoy";
import { listarClientesConSaldo } from "@/features/fiados/actions/listar-clientes-con-saldo";
import { FiadosInicio } from "@/features/fiados/ui/FiadosInicio";

export const dynamic = "force-dynamic";

export default async function FiadosPage() {
  const consolidacion = await consolidarVencidasDelDia();
  if (!consolidacion.ok) throw new Error(consolidacion.error);

  const [clientes, porCobrar] = await Promise.all([listarClientesConSaldo(), listarACobrarHoy()]);
  if (!clientes.ok) throw new Error(clientes.error);
  if (!porCobrar.ok) throw new Error(porCobrar.error);

  return (
    <main className="historial">
      <header className="historial__encabezado">
        <div>
          <p className="marca">Mi Kiosco</p>
          <h1>Fiados</h1>
          <p className="historial__descripcion">
            Seguí los cobros de hoy y las cuentas pendientes de cada cliente.
          </p>
        </div>
      </header>
      <FiadosInicio clientes={clientes.data} ventasACobrarHoy={porCobrar.data} />
    </main>
  );
}
