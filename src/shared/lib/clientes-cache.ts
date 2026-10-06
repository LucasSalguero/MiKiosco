import type { Cliente } from "@/shared/types/venta";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";
import { abrirBaseDeDatos } from "@/shared/lib/indexeddb";

const STORE_CLIENTES = "clientes-cache";

function ejecutar<T>(
  modo: IDBTransactionMode,
  preparar: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<Resultado<T>> {
  return new Promise((resolve) => {
    void abrirBaseDeDatos()
      .then((db) => {
        if (!db) {
          resolve(fallo("No se pudo acceder al almacenamiento local.", "storage"));
          return;
        }

        try {
          const transaccion = db.transaction(STORE_CLIENTES, modo);
          const request = preparar(transaccion.objectStore(STORE_CLIENTES));
          let valor: T;
          let solicitudCompletada = false;

          request.onsuccess = () => {
            valor = request.result;
            solicitudCompletada = true;
          };
          request.onerror = () => {
            console.error("clientes-cache.solicitud", request.error);
          };
          transaccion.oncomplete = () => {
            db.close();
            resolve(
              solicitudCompletada
                ? ok(valor)
                : fallo("No se pudo guardar la información local.", "storage"),
            );
          };
          transaccion.onabort = () => {
            db.close();
            console.error("clientes-cache.transaccion", transaccion.error);
            resolve(fallo("No se pudo guardar la información local.", "storage"));
          };
          transaccion.onerror = () => {
            console.error("clientes-cache.transaccion", transaccion.error);
          };
        } catch (error) {
          db.close();
          console.error("clientes-cache.ejecutar", error);
          resolve(fallo("El almacenamiento local está corrupto.", "storage"));
        }
      })
      .catch((error: unknown) => {
        console.error("clientes-cache.ejecutar", error);
        resolve(fallo("No se pudo acceder al almacenamiento local.", "storage"));
      });
  });
}

export async function guardarClientesCache(clientes: Cliente[]): Promise<Resultado<Cliente[]>> {
  const resultado = await ejecutar("readwrite", (store) => {
    store.clear();
    for (const cliente of clientes) store.put(cliente);
    return store.getAll();
  });
  return resultado.ok ? ok(resultado.data) : resultado;
}

export async function leerClientesCache(): Promise<Resultado<Cliente[]>> {
  const resultado = await ejecutar<Cliente[]>("readonly", (store) => store.getAll());
  return resultado.ok ? ok(resultado.data) : resultado;
}
