"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

import { desbloquear } from "@/features/auth/actions/desbloquear";
import { Boton } from "@/shared/ui/Boton";

export function Desbloqueo(): ReactElement {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const ingresarDigito = (digito: string) => {
    setError("");
    setPin((actual) => (actual.length < 12 ? actual + digito : actual));
  };

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError("");

    const resultado = await desbloquear(pin);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      setPin("");
      return;
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <main className="pantalla-desbloqueo">
      <div className="desbloqueo-panel">
        <section className="desbloqueo-marca" aria-label="Mi Kiosco">
          <div className="desbloqueo-marca__identidad">
            <span className="desbloqueo-marca__isotipo" aria-hidden="true">
              MK
            </span>
            <span>Mi Kiosco</span>
          </div>
          <div className="desbloqueo-marca__mensaje">
            <p>Tu negocio, en orden.</p>
            <h2>Todo listo para seguir vendiendo.</h2>
            <span>Ventas, productos e historial en un solo lugar.</span>
          </div>
          <div className="desbloqueo-marca__estado">
            <span aria-hidden="true" />
            Acceso protegido para tu punto de venta
          </div>
        </section>
        <form className="desbloqueo" onSubmit={(evento) => void enviar(evento)}>
          <p className="marca">Mi Kiosco</p>
          <h1>Ingresá tu PIN</h1>
          <p className="desbloqueo__ayuda">Desbloqueá el punto de venta para continuar.</p>
          <label className="sr-only" htmlFor="pin">
            PIN de 6 a 12 dígitos
          </label>
          <input
            id="pin"
            className="desbloqueo__entrada"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="[0-9]{6,12}"
            minLength={6}
            maxLength={12}
            value={pin}
            onChange={(evento) => {
              setError("");
              setPin(evento.target.value.replace(/\D/g, "").slice(0, 12));
            }}
            aria-describedby={error ? "desbloqueo-error" : undefined}
            aria-invalid={Boolean(error)}
            autoFocus
          />
          <div className="teclado-pin" aria-label="Teclado numérico">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digito) => (
              <button
                key={digito}
                type="button"
                onClick={() => ingresarDigito(digito)}
                aria-label={`Ingresar ${digito}`}
              >
                {digito}
              </button>
            ))}
            <button type="button" onClick={() => setPin("")} aria-label="Borrar PIN">
              Borrar
            </button>
            <button type="button" onClick={() => ingresarDigito("0")} aria-label="Ingresar 0">
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((actual) => actual.slice(0, -1))}
              aria-label="Borrar último dígito"
            >
              ⌫
            </button>
          </div>
          {error ? (
            <p id="desbloqueo-error" className="desbloqueo__error" role="alert">
              {error}
            </p>
          ) : null}
          <Boton type="submit" variant="primario" cargando={enviando} disabled={pin.length < 6}>
            Desbloquear
          </Boton>
        </form>
      </div>
    </main>
  );
}
