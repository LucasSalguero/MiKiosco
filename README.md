# Mi Kiosco

Mi Kiosco es una aplicación para gestionar ventas y productos de un kiosco.
El proyecto se encuentra en la etapa inicial del MVP.

## Estado actual

La aplicación incluye:

- Next.js 16 con App Router
- React 19
- TypeScript 5
- PostgreSQL
- Prisma 7
- Punto de venta, productos e historial organizados por vertical slices dentro de `src/`
- Persistencia de ventas en PostgreSQL mediante Prisma
- Cola local IndexedDB, envío idempotente y sincronización automática al recuperar conexión
- Catálogo cacheado para consulta sin conexión y shell PWA con service worker
- Fiados por cliente: ventas a cobrar hoy, cuentas mensuales y pagos parciales
- Resumen diario separado entre vendido, cobrado y deuda pendiente
- Cierre perezoso de ventas vencidas al cargar Vender, Fiados o Historial, más
  cierre manual confirmado desde Fiados

## Requisitos

- Node.js 24 o compatible con las dependencias instaladas
- npm
- PostgreSQL ejecutándose localmente

## Instalación

Instalar las dependencias:

```bash
npm install
```

Crear `.env` a partir de `.env.example` y configurar la conexión:

```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database>?schema=public"
AUTH_PIN_HASH="<hash generado con npm run auth:hash-pin>"
AUTH_SESSION_SECRET="<secreto aleatorio de al menos 32 caracteres>"
TZ="America/Argentina/Buenos_Aires"
```

No subir `.env` al repositorio. El archivo `.env.example` sí debe versionarse.

Generar el hash de un PIN numérico de 6 a 12 dígitos desde una terminal
interactiva (la consola muestra asteriscos en lugar de los dígitos):

```bash
npm run auth:hash-pin
```

Copiar la línea `AUTH_PIN_HASH=...` resultante a `.env` o a las variables
secretas del proveedor. Crear `AUTH_SESSION_SECRET` con un secreto aleatorio
de al menos 32 caracteres, por ejemplo:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

El hash usa el formato `scrypt-v1:<salt>:<digest>` sin signos `$`, para evitar
que el cargador de variables de Next.js expanda partes del hash como referencias
a otras variables. Los hashes del formato anterior deben regenerarse y el
servidor debe reiniciarse luego de editar `.env`.

La sesión se guarda en una cookie `HttpOnly`, `SameSite=Strict` y `Secure` en
producción, y vence a las 12 horas. Sin ambas variables de autenticación
configuradas, las rutas y acciones privadas permanecen bloqueadas.
El desbloqueo limita los intentos por IP en cada proceso: cinco PINs incorrectos
en una ventana de 15 minutos bloquean nuevos intentos durante cinco minutos. Si
se ejecutan varias instancias, configurar además el rate limit compartido del
proveedor o del proxy.

## Base de datos

Aplicar las migraciones pendientes en desarrollo:

```bash
npx prisma migrate dev
```

Validar el estado de las migraciones:

```bash
npx prisma migrate status
```

El schema se encuentra en `prisma/schema.prisma` y el cliente singleton de
Prisma en `src/shared/db/client.ts`.

## Despliegue en producción

La aplicación puede ejecutarse en Render, Railway, Fly.io o un servidor Node
con PostgreSQL gestionado en Neon, Supabase u otro proveedor compatible.

1. Crear una base PostgreSQL y configurar `DATABASE_URL` con su URL de
   conexión (usar SSL según los requisitos del proveedor).
2. Configurar en el entorno de producción `AUTH_PIN_HASH`,
   `AUTH_SESSION_SECRET` y `TZ=America/Argentina/Buenos_Aires`. No incluir
   valores reales en Git ni en logs del pipeline.
3. Usar Node.js 24 o compatible y ejecutar `npm ci`, `npm run build` y
   `npm start`. El comando de inicio ejecuta `prisma migrate deploy` antes de
   levantar Next.js; las migraciones pendientes deben estar versionadas en
   `prisma/migrations/`.
4. Servir la aplicación mediante HTTPS para habilitar la cookie segura y la
   instalación de la PWA. El manifiesto incluye iconos Android y Apple; en
   iOS, usar **Compartir → Agregar a inicio**.

No ejecutar `prisma migrate dev` en producción. El proveedor debe permitir
conexiones salientes a PostgreSQL y conservar las variables de entorno entre
reinicios.

## Estructura

```text
prisma/
  schema.prisma
  migrations/

src/
  features/
    sales/
    products/
    daily-summary/
    sales-history/
    offline-sync/
  shared/
    db/
    ui/
    lib/
```

Cada slice de funcionalidad mantiene sus carpetas de interfaz, acciones y
lógica específica cuando corresponde. `src/shared/` contiene recursos
compartidos entre slices.

## Convenciones

Las reglas de organización, naming, TypeScript, estado, UI, commits y manejo
de errores están documentadas en [CONVENTIONS.md](CONVENTIONS.md).

## Offline y PWA

El service worker se registra únicamente en producción. Para probar el flujo
offline en una instalación local:

```bash
npm run build
npm run start
```

Abrí la aplicación en el navegador mientras hay conexión y esperá a que el
service worker figure como activo. En DevTools, abrí **Application → Service
Workers** y activá **Offline**. El catálogo cargado previamente permanece
disponible; las ventas se guardan en IndexedDB y se envían automáticamente al
volver a activar la conexión. El historial muestra las pendientes y las que
requieren revisión.

Para validar una venta antigua, guardá una venta con fecha de más de 30 días en
la cola local: al sincronizar debe quedar marcada para revisión y no impedir
que se envíen las demás.

Por seguridad, el service worker cachea la shell estática de desconexión,
recursos e iconos; no guarda páginas autenticadas ni respuestas de Server
Components. Los recursos compilados de Next.js se buscan primero en la red y
se usan desde caché solo como respaldo offline, para evitar mezclar scripts
viejos con páginas actualizadas. Una página que ya estaba abierta puede
conservar el flujo de venta local, pero al recargar sin conexión se muestra la
shell de desconexión.

Las ventas fiadas también se pueden registrar sin conexión: se guardan con la
clave de operación local y se sincronizan junto con el cliente, que se busca o
crea por nombre normalizado para evitar duplicados. Registrar pagos, cobrar una
venta fiada y cerrar manualmente el día requieren conexión. El saldo de cada
cliente se deriva de ventas fiadas no anuladas menos pagos no anulados; no se
guarda como un valor independiente. Los pagos anteriores a la incorporación del
medio de pago se conservan con medio `DESCONOCIDO`, porque ese dato no existía
en el sistema anterior.

## Comandos

`npm run dev` inicia el entorno de desarrollo. `npm test` ejecuta las pruebas
con `node:test` y `tsx`,
`npm run typecheck`, `npm run lint`, `npm run format:check` y `npm run build`
verifican el proyecto.
