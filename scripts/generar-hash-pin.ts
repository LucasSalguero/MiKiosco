import { crearHashPin } from "@/features/auth/lib/hash-pin";

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error("Ejecutá este comando desde una terminal interactiva.");
  process.exitCode = 1;
} else {
  let pin = "";
  let finalizado = false;
  const mostrarEntrada = () => {
    process.stdout.write(`\rPIN nuevo (6 a 12 dígitos): ${"*".repeat(pin.length)}   `);
  };
  process.stdout.write("PIN nuevo (6 a 12 dígitos; se mostrarán solo asteriscos): ");
  process.stdin.setRawMode(true);
  process.stdin.setEncoding("utf8");
  process.stdin.resume();

  process.stdin.on("data", (entrada: string) => {
    for (const caracter of entrada) {
      if (finalizado) continue;
      if (caracter === "\u0003") {
        finalizado = true;
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        process.exit(130);
      }
      if (caracter === "\r" || caracter === "\n") {
        finalizado = true;
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        if (!/^\d{6,12}$/.test(pin)) {
          console.error("El PIN debe tener entre 6 y 12 dígitos.");
          process.exitCode = 1;
          return;
        }

        process.stdout.write(`AUTH_PIN_HASH=${crearHashPin(pin)}\n`);
        pin = "";
        return;
      }
      if (caracter === "\u007f" || caracter === "\b") {
        pin = pin.slice(0, -1);
      } else if (/^\d$/.test(caracter) && pin.length < 12) {
        pin += caracter;
      }
      mostrarEntrada();
    }
  });
}
