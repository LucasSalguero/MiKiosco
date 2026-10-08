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
El límite de PIN se guarda en PostgreSQL y se comparte entre instancias: cinco
intentos incorrectos en una ventana de 15 minutos bloquean nuevos intentos
durante cinco minutos. La clave de origen se almacena con HMAC, no como una IP
en texto plano. El proxy de entrada debe establecer `x-forwarded-for`
correctamente; si PostgreSQL no está disponible, el desbloqueo falla de forma
cerrada.

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

### Limpieza antes del primer día

No hay una tabla de usuarios: la autenticación usa un PIN configurado como
secreto. Como los productos y las ventas no tienen una marca que identifique
datos de prueba, el script ofrece un reinicio total de los datos de la
aplicación (productos, ventas, ítems, clientes, pagos y límites de intentos). Conserva
el esquema y el historial de migraciones.

Primero aplicá las migraciones y hacé/verificá un backup. La vista previa no
modifica la base:

```bash
npm run db:limpiar
```

Si los conteos y el nombre de base son los esperados, aplicá la limpieza
confirmando el nombre exacto de la base y que el backup fue verificado:

```bash
npm run db:limpiar -- --apply --backup-verified --confirm-database=<nombre-de-base>
```

El script vuelve a mostrar los conteos al terminar. No se ejecuta durante el
arranque ni como parte del despliegue. No uses `--apply` sobre una base que ya
contenga datos reales que quieras conservar.

Antes de aplicarlo, cerrá la aplicación y la PWA en todos los dispositivos para
que no sincronicen ventas durante el reinicio. Revisá que no haya ventas
legítimas sin sincronizar; luego de la limpieza, borrá los datos locales del
sitio en cada dispositivo (incluye IndexedDB, caché y service worker) y volvé a
abrirlo conectado. Esto elimina también cualquier venta de prueba que hubiera
quedado en la cola offline; no se puede hacer desde el script del servidor.

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
5. Activar en el proveedor de PostgreSQL backups automáticos diarios con al
   menos siete días de retención y tomar un backup manual antes de la limpieza.
   Antes de abrir el kiosco, restaurar un backup reciente en una base separada
   y comprobar que se pueden consultar productos y ventas. No probar la
   restauración sobre la base de producción.

No ejecutar `prisma migrate dev` en producción. El proveedor debe permitir
conexiones salientes a PostgreSQL y conservar las variables de entorno entre
reinicios. Los backups administrados son una configuración del proveedor y
deben verificarse allí; el proyecto no crea ni programa backups por sí solo.

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
