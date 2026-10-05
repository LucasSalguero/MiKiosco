import { obtenerCuentasCorrientes } from "@/features/credit/actions/obtener-cuentas-corrientes";
import { CuentasCorrientes } from "@/features/credit/ui/CuentasCorrientes";

export const dynamic = "force-dynamic";

export default async function FiadosPage() {
  const resultado = await obtenerCuentasCorrientes();
  if (!resultado.ok) throw new Error(resultado.error);

  return (
    <main className="historial">
      <header className="historial__encabezado">
        <div>
          <p className="marca">Mi Kiosco</p>
          <h1>Cuentas corrientes</h1>
        </div>
      </header>
      <CuentasCorrientes cuentas={resultado.data} />
    </main>
  );
}
