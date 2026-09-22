import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

type VarianteBoton = "primario" | "secundario" | "peligro";

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: VarianteBoton;
  cargando?: boolean;
  children: ReactNode;
};

const estilosPorVariante: Record<VarianteBoton, string> = {
  primario: "boton--primario",
  secundario: "boton--secundario",
  peligro: "boton--peligro",
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
      className={`boton ${estilosPorVariante[variant]} ${className}`}
      {...props}
    >
      {cargando ? "Cargando..." : children}
    </button>
  );
}
