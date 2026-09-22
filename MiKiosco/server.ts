import { createServer } from "node:http";

import next from "next";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "localhost";
const development = process.env.NODE_ENV !== "production";
const app = next({ dev: development, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((request, response) => handle(request, response)).listen(port, hostname, () => {
    console.log(`Mi Kiosco disponible en http://${hostname}:${port}`);
  });
});