const DB_NAME = "mi-kiosco";
const STORES = [
  { name: "ventas-pendientes", keyPath: "localId" },
  { name: "productos-cache", keyPath: "id" },
  { name: "clientes-cache", keyPath: "id" },
] as const;

function crearStoresFaltantes(db: IDBDatabase): void {
  for (const store of STORES) {
    if (!db.objectStoreNames.contains(store.name)) {
      db.createObjectStore(store.name, { keyPath: store.keyPath });
    }
  }
}

function abrir(version?: number): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const request =
      version === undefined ? indexedDB.open(DB_NAME) : indexedDB.open(DB_NAME, version);
    let resuelto = false;

    request.onupgradeneeded = () => crearStoresFaltantes(request.result);
    request.onsuccess = () => {
      if (resuelto) {
        request.result.close();
        return;
      }
      request.result.onversionchange = () => request.result.close();
      resuelto = true;
      resolve(request.result);
    };
    request.onerror = () => {
      console.error("storage.abrirBaseDeDatos", request.error);
      resuelto = true;
      resolve(null);
    };
    request.onblocked = () => {
      console.error("storage.abrirBaseDeDatos", "La base local está abierta en otra pestaña.");
      if (!resuelto) {
        resuelto = true;
        resolve(null);
      }
    };
  });
}

export async function abrirBaseDeDatos(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return null;

  const db = await abrir();
  if (!db) return null;
  const faltanStores = STORES.some((store) => !db.objectStoreNames.contains(store.name));
  if (!faltanStores) return db;

  const versionNueva = db.version + 1;
  db.close();
  return abrir(versionNueva);
}
