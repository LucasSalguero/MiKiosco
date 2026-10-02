export type CodigoErrorResultado =
  "validation" | "database" | "storage" | "network" | "unauthorized" | "unknown";

export type Resultado<T> =
  { ok: true; data: T } | { ok: false; code: CodigoErrorResultado; error: string };
