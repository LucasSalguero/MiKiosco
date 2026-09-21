import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

type VarianteBoton = "primario" | "secundario" | "peligro";

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: VarianteBoton;
  cargando?: boolean;
  children: ReactNode;
};

const estilosPorVariante: Record<VarianteBoton, string> = {
  primario: "bg-emerald-600 text-white hover:bg-emerald-700",
  secundario: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-100",
  peligro: "bg-red-600 text-white hover:bg-red-700",
};

export function Boton({
  variant = "primario",
  cargando = false,
  children,
  className = "",
  disabled,
  ...props
}: BotonProps): ReactElement {
  const estadoDeshabilitado = disabled || cargando;

  return (
    <button
      type="button"
      disabled={estadoDeshabilitado}
      className={`min-h-[44px] rounded-xl px-4 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${estilosPorVariante[variant]} ${className}`}
      {...props}
    >
      {cargando ? "Cargando..." : children}
    </button>
  );
}
