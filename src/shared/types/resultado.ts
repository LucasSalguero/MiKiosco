export type Resultado<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
