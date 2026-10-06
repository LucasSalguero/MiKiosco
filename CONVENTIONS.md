# Conventions — Mi Kiosco (MVP)

Reglas mínimas para que el código generado sea consistente. Ante la duda,
priorizar simplicidad y velocidad de entrega sobre "hacerlo perfecto".

## Stack

- Next.js (App Router) + React + TypeScript
- Backend con Server Actions, Route Handlers, PostgreSQL y Prisma
- PWA: ventas pendientes en IndexedDB y catálogo local como respaldo offline
- Estilos con CSS manual en `src/app/globals.css` y `src/app/components.css`; usar clases semánticas.

## Estructura de carpetas

Las rutas viven en `src/app/`. La lógica de negocio se organiza por vertical
slices en `src/features/<dominio>/` (`actions/`, `lib/`, `ui/`); los tipos,
utilidades, acceso a Prisma y componentes compartidos viven en `src/shared/`.
El acceso a IndexedDB pasa por `src/shared/lib/storage.ts`.

## Naming

- Componentes: `PascalCase` (`VentaRapida.tsx`)
- Funciones y variables: `camelCase`
- Archivos que no son componentes: `kebab-case` (`total-diario.ts`)
- Tipos/interfaces de dominio: sustantivo simple, sin prefijo `I` (`Venta`, no `IVenta`)

## TypeScript

- `strict: true` en `tsconfig`. No usar `any`.
- Todo tipo compartido de dominio vive en `src/shared/types/` y se importa
  desde ahí; no redefinirlo inline en cada componente.
- Las funciones de negocio devuelven `Resultado<T>` usando `ok()`/`fallo(msg, code)`.

## Calidad

- `npm run format` aplica Prettier.
- `npm run lint` ejecuta ESLint.

## Estado y datos

- Estado local de componente: `useState`.
- Estado compartido entre varias pantallas: `useContext` (recién ahí, no antes).
- Toda lectura/escritura a `localStorage`/`IndexedDB` pasa por `/lib/storage.ts`.
  Ningún componente accede a `localStorage` directamente.
- Cada función de `storage.ts` debe manejar el caso de fallo (ej: storage
  lleno o corrupto) devolviendo un resultado explícito, no lanzando una
  excepción sin capturar.
- Las ventas usan `EstadoPago` (`PAGADA`, `A_COBRAR_HOY` o `FIADA`). Las ventas
  no pagadas siempre pertenecen a un cliente. El saldo se deriva de ventas no
  anuladas menos pagos no anulados; nunca se persiste como columna.
- Los nombres de clientes se identifican por su forma recortada, en minúsculas,
  sin tildes.
- Los pagos usan claves de operación idempotentes. Importes y subtotales se
  manejan en centavos o con `Prisma.Decimal`; no se acumulan importes con floats
  sin redondear.
- La cola offline puede guardar ventas pagadas o fiadas y conserva el precio
  acordado. Registrar pagos y cobrar ventas fiadas requieren conexión.

## UI / Componentes

- Componentes de función, sin clases.
- Un componente por archivo.
- La pantalla de "venta rápida" no puede tardar más de 2 taps en registrar
  una venta — cualquier cambio que agregue un paso extra a ese flujo
  necesita justificación explícita en el PR/commit.

## Commits

- Formato libre pero descriptivo: `<área>: <qué cambia>`
  (ej: `ventas: agregar totalizador del día`)
- Un commit = un cambio coherente. Evitar commits gigantes que mezclen
  features distintas.

## Errores

- Nunca fallar en silencio: si algo no se pudo guardar, mostrar feedback
  simple al usuario (ej: toast "no se pudo guardar la venta").
- Registrar errores con `console.error("area.funcion", error)`.
- Los controles táctiles deben tener al menos 44px de alto.

## Autenticación y tests

- Las rutas privadas y Server Actions deben validar la sesión del PIN en el
  servidor.
- Las pruebas unitarias de lógica de negocio se ejecutan con `npm test`.
- El runner de pruebas es `node:test` con `tsx`; no sumar dependencias para las
  pruebas unitarias.
- No registrar PINs, hashes ni secretos de sesión en logs.
