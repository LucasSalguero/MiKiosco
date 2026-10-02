import { randomBytes, scryptSync } from "node:crypto";

const PARAMETROS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error("Ejecutá este comando desde una terminal interactiva.");
  process.exitCode = 1;
} else {
  let pin = "";
  process.stdout.write("PIN nuevo (6 a 12 dígitos; no se mostrará): ");
  process.stdin.setRawMode(true);
  process.stdin.setEncoding("utf8");
  process.stdin.resume();

  process.stdin.on("data", (entrada: string) => {
    for (const caracter of entrada) {
      if (caracter === "\u0003") {
        process.stdin.setRawMode(false);
        process.exit(130);
      }
      if (caracter === "\r" || caracter === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        if (!/^\d{6,12}$/.test(pin)) {
          console.error("El PIN debe tener entre 6 y 12 dígitos.");
          process.exitCode = 1;
          return;
        }

        const sal = randomBytes(16);
        const hash = scryptSync(pin, sal, 64, PARAMETROS);
        process.stdout.write(
          `AUTH_PIN_HASH=scrypt$${PARAMETROS.N}$${PARAMETROS.r}$${PARAMETROS.p}$${sal.toString("base64url")}$${hash.toString("base64url")}\n`,
        );
        pin = "";
        return;
      }
      if (caracter === "\u007f" || caracter === "\b") {
        pin = pin.slice(0, -1);
      } else if (/^\d$/.test(caracter) && pin.length < 12) {
        pin += caracter;
      }
    }
  });
}
