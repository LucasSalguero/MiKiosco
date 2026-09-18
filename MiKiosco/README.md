# Mi Kiosco

Mi Kiosco es una aplicación para gestionar ventas y productos de un kiosco.
El proyecto se encuentra en la etapa inicial del MVP.

## Estado actual

La base del proyecto está preparada con:

- Next.js 16 con App Router
- React 19
- TypeScript 5
- PostgreSQL
- Prisma 7
- Estructura modular por vertical slices dentro de `src/`
- Modelos de base de datos `Producto`, `Venta` y `VentaItem`

Todavía no se han implementado las pantallas, acciones de servidor ni la lógica
funcional de ventas.

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

## Comandos disponibles

En el estado actual, las dependencias y la base de datos están configuradas.
Los scripts de desarrollo de Next.js se agregarán junto con la aplicación.
