import { listarProductosActivos } from "@/features/products/actions/listar-productos";
import { VentaRapida } from "@/features/sales/ui/VentaRapida";

export default async function HomePage() {
  const resultado = await listarProductosActivos();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Mi Kiosco</p>
        <h1 className="text-3xl font-bold text-slate-900">Venta rapida</h1>
      </header>

      {resultado.ok ? (
        <VentaRapida productos={resultado.data} />
      ) : (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900" role="alert">
          {resultado.error}
        </section>
      )}
    </main>
  );
}