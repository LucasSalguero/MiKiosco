import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada.");
}

const databaseUrl = new URL(connectionString);
if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
  throw new Error("La limpieza solo admite una base PostgreSQL.");
}

const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, ""));
if (!databaseName) {
  throw new Error("No se pudo determinar el nombre de la base de datos.");
}

const flags = new Set(process.argv.slice(2));
const allowedFlags = new Set(["--apply", "--backup-verified"]);
for (const flag of flags) {
  if (flag.startsWith("--confirm-database=")) continue;
  if (!allowedFlags.has(flag)) {
    throw new Error(`Opción desconocida: ${flag}`);
  }
}

const confirmationFlag = [...flags].find((flag) => flag.startsWith("--confirm-database="));
const confirmedDatabase = confirmationFlag?.slice("--confirm-database=".length);
const apply = flags.has("--apply");

if (apply && (!flags.has("--backup-verified") || confirmedDatabase !== databaseName)) {
  throw new Error(
    "Para aplicar, verificá el backup y confirmá exactamente la base con --backup-verified --confirm-database=<nombre>.",
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function obtenerConteos(
  client: PrismaClient,
): Promise<Array<{ tabla: string; cantidad: number }>> {
  const conteos = await client.$queryRaw<Array<{ tabla: string; cantidad: bigint }>>`
    SELECT 'Producto' AS tabla, COUNT(*)::bigint AS cantidad FROM "Producto"
    UNION ALL
    SELECT 'Venta', COUNT(*)::bigint FROM "Venta"
    UNION ALL
    SELECT 'VentaItem', COUNT(*)::bigint FROM "VentaItem"
    UNION ALL
    SELECT 'Cliente', COUNT(*)::bigint FROM "Cliente"
    UNION ALL
    SELECT 'Pago', COUNT(*)::bigint FROM "Pago"
    UNION ALL
    SELECT 'AuthRateLimit', COUNT(*)::bigint FROM "AuthRateLimit"
  `;
  return conteos.map(({ tabla, cantidad }) => ({ tabla, cantidad: Number(cantidad) }));
}

async function main(): Promise<void> {
  try {
    console.log(`Base objetivo: ${databaseName} (${databaseUrl.hostname})`);
    console.table(await obtenerConteos(prisma));

    if (!apply) {
      console.log("Vista previa solamente. No se modificó ningún dato.");
      console.log(
        `Para borrar todos los datos: npm run db:limpiar -- --apply --backup-verified --confirm-database=${databaseName}`,
      );
      return;
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`
        TRUNCATE TABLE "Pago", "VentaItem", "Venta", "Cliente", "Producto", "AuthRateLimit"
        RESTART IDENTITY CASCADE
      `;
    });

    console.log("Limpieza completada. Se conservaron el esquema y las migraciones.");
    console.table(await obtenerConteos(prisma));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("No se pudo completar la limpieza de la base de datos.", error);
  process.exitCode = 1;
});
