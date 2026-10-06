import type { Resultado } from "@/shared/types/resultado";
import type { Producto } from "@/shared/types/producto";
import type { VentaPendiente } from "@/shared/types/venta";

import { fallo, ok } from "@/shared/lib/resultado";
import { abrirBaseDeDatos } from "@/shared/lib/indexeddb";

const STORE_VENTAS_PENDIENTES = "ventas-pendientes";
const STORE_PRODUCTOS_CACHE = "productos-cache";

type RequestLike = {
  result: unknown;
  error: DOMException | null;
  onerror: ((event: Event) => void) | null;
  onsuccess: ((event: Event) => void) | null;
};

function ejecutarEnStore<T>(
  storeName: string,
  operation: "readonly" | "readwrite",
  callback: (store: IDBObjectStore) => RequestLike,
): Promise<Resultado<T | T[] | null>> {
  return new Promise((resolve) => {
    abrirBaseDeDatos()
      .then((db) => {
        if (!db) {
          resolve(fallo("No se pudo acceder al almacenamiento local."));
          return;
        }

        try {
          const tx = db.transaction(storeName, operation);
          const store = tx.objectStore(storeName);
          const request = callback(store) as RequestLike;
          let resultadoSolicitud: unknown;
          let solicitudCompletada = false;

          request.onsuccess = () => {
            resultadoSolicitud = request.result;
            solicitudCompletada = true;
          };

          request.onerror = () => {
            console.error(`storage.${storeName}`, request.error);
          };

          tx.oncomplete = () => {
            db.close();
            resolve(
              solicitudCompletada
                ? ok(resultadoSolicitud as T | T[] | null)
                : fallo("No se pudo guardar la información local.", "storage"),
            );
          };

          tx.onabort = () => {
            db.close();
            console.error(`storage.${storeName}`, tx.error);
            resolve(fallo("No se pudo guardar la información local.", "storage"));
          };

          tx.onerror = () => {
            console.error(`storage.${storeName}`, tx.error);
          };
        } catch (error) {
          db.close();
          console.error(`storage.${storeName}`, error);
          resolve(fallo("El almacenamiento local está corrupto.", "storage"));
        }
      })
      .catch((error) => {
        console.error("storage.ejecutarEnStore", error);
        resolve(fallo("No se pudo acceder al almacenamiento local."));
      });
  });
}

export async function guardarVentaPendiente(
  pendiente: VentaPendiente,
): Promise<Resultado<VentaPendiente>> {
  const resultado = await ejecutarEnStore<VentaPendiente>(
    STORE_VENTAS_PENDIENTES,
    "readwrite",
    (store) => store.put(pendiente),
  );

  if (!resultado.ok) {
    return resultado;
  }

  return ok(pendiente);
}

export async function listarVentasPendientes(): Promise<Resultado<VentaPendiente[]>> {
  const resultado = await ejecutarEnStore<VentaPendiente>(
    STORE_VENTAS_PENDIENTES,
    "readonly",
    (store) => store.getAll(),
  );

  if (!resultado.ok) {
    return resultado;
  }

  return ok((resultado.data ?? []) as VentaPendiente[]);
}

export async function actualizarVentaPendiente(
  localId: string,
  pendiente: VentaPendiente,
): Promise<Resultado<VentaPendiente>> {
  const resultado = await ejecutarEnStore<VentaPendiente>(
    STORE_VENTAS_PENDIENTES,
    "readwrite",
    (store) => store.put({ ...pendiente, localId }),
  );

  if (!resultado.ok) {
    return resultado;
  }

  return ok({ ...pendiente, localId });
}

export async function eliminarVentaPendiente(localId: string): Promise<Resultado<boolean>> {
  const resultado = await ejecutarEnStore<boolean>(STORE_VENTAS_PENDIENTES, "readwrite", (store) =>
    store.delete(localId),
  );

  if (!resultado.ok) {
    return resultado;
  }

  return ok(true);
}

export async function guardarProductosCache(productos: Producto[]): Promise<Resultado<Producto[]>> {
  const resultado = await ejecutarEnStore<Producto[]>(
    STORE_PRODUCTOS_CACHE,
    "readwrite",
    (store) => {
      store.clear();
      for (const producto of productos) {
        store.put(producto);
      }
      return store.getAll();
    },
  );

  if (!resultado.ok) {
    return resultado;
  }

  return ok((resultado.data ?? []) as Producto[]);
}

export async function leerProductosCache(): Promise<Resultado<Producto[]>> {
  const resultado = await ejecutarEnStore<Producto>(STORE_PRODUCTOS_CACHE, "readonly", (store) =>
    store.getAll(),
  );

  if (!resultado.ok) {
    return resultado;
  }

  return ok((resultado.data ?? []) as Producto[]);
}
