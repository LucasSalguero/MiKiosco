# Conventions — Mi Kiosco (MVP)

Reglas mínimas para que el código generado sea consistente. Ante la duda,
priorizar simplicidad y velocidad de entrega sobre "hacerlo perfecto".

## Stack

- Next.js (App Router) + React + TypeScript
- PWA, sin backend propio en esta etapa: persistencia local vía
  `localStorage` / `IndexedDB`
- Estilos con Tailwind CSS

## Estructura de carpetas

```text
/app                → rutas (App Router)

/components          → componentes de UI reutilizables

/lib                 → lógica de dominio (ventas, productos, totales)

/lib/storage.ts      → única capa de acceso a IndexedDB/localStorage

/types               → tipos compartidos (Venta, Producto, etc.)
```

No crear una nueva carpeta de nivel superior sin justificarlo en el commit.

## Naming

- Componentes: `PascalCase` (`VentaRapida.tsx`)
- Funciones y variables: `camelCase`
- Archivos que no son componentes: `kebab-case` (`total-diario.ts`)
- Tipos/interfaces de dominio: sustantivo simple, sin prefijo `I` (`Venta`, no `IVenta`)

## TypeScript

- `strict: true` en `tsconfig`. No usar `any`.
- Todo tipo de dominio (venta, producto, día) vive en `/types` y se importa
  desde ahí — no redefinir tipos inline en cada componente.

## Estado y datos

- Estado local de componente: `useState`.
- Estado compartido entre varias pantallas: `useContext` (recién ahí, no antes).
- Toda lectura/escritura a `localStorage`/`IndexedDB` pasa por `/lib/storage.ts`.
  Ningún componente accede a `localStorage` directamente.
- Cada función de `storage.ts` debe manejar el caso de fallo (ej: storage
  lleno o corrupto) devolviendo un resultado explícito, no lanzando una
  excepción sin capturar.

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
- No hace falta un sistema de logging todavía; `console.error` con
  contexto alcanza en esta etapa.

## Fuera de alcance por ahora (no implementar sin pedirlo explícitamente)

- Autenticación / multiusuario
- Backend remoto / sincronización en la nube
- Tests automatizados
- Internacionalización
