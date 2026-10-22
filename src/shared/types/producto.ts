export type CategoriaProducto =
  | "BEBIDAS"
  | "GOLOSINAS"
  | "CIGARRILLOS"
  | "ALMACEN"
  | "LACTEOS"
  | "PANIFICADOS"
  | "LIMPIEZA"
  | "SERVICIOS"
  | "VARIOS";

/** Categorías en el orden en que se muestran, con su etiqueta. */
export const CATEGORIAS: ReadonlyArray<{ valor: CategoriaProducto; etiqueta: string }> = [
  { valor: "BEBIDAS", etiqueta: "Bebidas" },
  { valor: "GOLOSINAS", etiqueta: "Golosinas" },
  { valor: "CIGARRILLOS", etiqueta: "Cigarrillos" },
  { valor: "ALMACEN", etiqueta: "Almacén" },
  { valor: "LACTEOS", etiqueta: "Lácteos" },
  { valor: "PANIFICADOS", etiqueta: "Panificados" },
  { valor: "LIMPIEZA", etiqueta: "Limpieza" },
  { valor: "SERVICIOS", etiqueta: "Servicios" },
  { valor: "VARIOS", etiqueta: "Varios" },
];

export type Producto = {
  id: number;
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
  marca: string | null;
  codigoBarras: string | null;
  activo: boolean;
  createdAt: string;
};

export type DatosProducto = {
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
  marca: string | null;
  codigoBarras: string | null;
};

export type RedondeoPrecio = "NINGUNO" | "DIEZ" | "CINCUENTA";

export type FiltroActualizacionMasiva = {
  categoria: CategoriaProducto | null;
  marca: string | null;
};

export type CambioPrecio = {
  id: number;
  nombre: string;
  marca: string | null;
  precioActual: number;
  precioNuevo: number;
};
