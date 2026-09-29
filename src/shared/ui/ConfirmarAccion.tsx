"use client";

import { useEffect, useId, useRef, type ReactElement } from "react";

import { Boton } from "@/shared/ui/Boton";

type ConfirmarAccionProps = {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  variantConfirmar?: "primario" | "peligro";
  confirmando?: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
};

export function ConfirmarAccion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  variantConfirmar = "peligro",
  confirmando = false,
  alConfirmar,
  alCancelar,
}: ConfirmarAccionProps): ReactElement {
  const dialogo = useRef<HTMLDialogElement>(null);
  const identificador = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (abierto && !elemento.open) elemento.showModal();
    if (!abierto && elemento.open) elemento.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      className="dialogo-confirmacion"
      aria-labelledby={`${identificador}-titulo`}
      aria-describedby={`${identificador}-mensaje`}
      onCancel={(evento) => {
        evento.preventDefault();
        alCancelar();
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) alCancelar();
      }}
    >
      <h2 id={`${identificador}-titulo`}>{titulo}</h2>
      <p id={`${identificador}-mensaje`}>{mensaje}</p>
      <div className="dialogo-confirmacion__acciones">
        <Boton variant="secundario" onClick={alCancelar}>
          Cancelar
        </Boton>
        <Boton variant={variantConfirmar} cargando={confirmando} onClick={alConfirmar}>
          {textoConfirmar}
        </Boton>
      </div>
    </dialog>
  );
}