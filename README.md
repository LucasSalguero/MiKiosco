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
```

No subir `.env` al repositorio. El archivo `.env.example` sí debe versionarse.

## Base de datos

Ejecutar la migración inicial:

```bash
npx prisma migrate dev --name init
```

Validar el estado de las migraciones:

```bash
npx prisma migrate status
```

El schema se encuentra en `prisma/schema.prisma` y el cliente singleton de
Prisma en `src/shared/db/client.ts`.

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

## Comandos

`npm run dev` inicia el entorno de desarrollo. `npm run typecheck`,
`npm run lint`, `npm run format:check` y `npm run build` verifican el proyecto.
