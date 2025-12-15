interface Catalog<Metadata> {
  files: { [key: string]: Metadata }
}

const filesStoreName = "files"
const catalogStoreName = "catalog"
const catalogKey = 0

export class IndexedDBStorage<Data, Metadata> {
  private db: IDBDatabase | null = null

  constructor(
    private readonly dbName: string,
    private readonly version: number,
  ) {}

  async init() {
    this.db = await this.openDatabase()
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const openDBRequest = indexedDB.open(this.dbName, this.version)
      openDBRequest.onsuccess = () => resolve(openDBRequest.result)
      openDBRequest.onupgradeneeded = () => {
        const db = openDBRequest.result
        if (!db.objectStoreNames.contains(filesStoreName)) {
          db.createObjectStore(filesStoreName, {
            autoIncrement: true,
          })
        }
        if (!db.objectStoreNames.contains(catalogStoreName)) {
          db.createObjectStore(catalogStoreName)
        }
      }
      openDBRequest.onerror = () => reject(openDBRequest.error)
    })
  }

  private async getCatalog(): Promise<Catalog<Metadata>> {
    if (!this.db) throw new Error("Database not initialized")
    const transaction = this.db.transaction(catalogStoreName, "readonly")
    const store = transaction.objectStore(catalogStoreName)
    const request = store.get(catalogKey)
    const result = await requestToPromise<Catalog<Metadata> | undefined>(
      request,
    )
    return result ?? { files: {} }
  }

  private async setCatalog(catalog: Catalog<Metadata>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")
    const transaction = this.db.transaction(catalogStoreName, "readwrite")
    const store = transaction.objectStore(catalogStoreName)
    const request = store.put(catalog, catalogKey)
    await requestToPromise(request)
  }

  private async updateCatalog(
    update: (catalog: Catalog<Metadata>) => Catalog<Metadata>,
  ): Promise<void> {
    const currentCatalog = await this.getCatalog()
    const newCatalog = update(currentCatalog)
    await this.setCatalog(newCatalog)
  }

  async save(data: Data, metadata: Metadata): Promise<number> {
    return (await this.saveMany([{ data, metadata }]))[0].id
  }

  async saveMany(items: { data: Data; metadata: Metadata }[]) {
    if (!this.db) throw new Error("Database not initialized")
    const transaction = this.db.transaction(filesStoreName, "readwrite")
    const store = transaction.objectStore(filesStoreName)

    const results: { id: number; metadata: Metadata }[] = []

    for await (const item of items) {
      const request = store.add(item.data)
      const result = await requestToPromise<IDBValidKey>(request)
      results.push({
        id: result as number,
        metadata: item.metadata,
      })
    }

    await this.updateCatalog((catalog) => {
      for (const { id, metadata } of results) {
        catalog.files[id] = metadata
      }
      return catalog
    })

    return results
  }

  async load(id: number): Promise<Data | null> {
    if (!this.db) throw new Error("Database not initialized")
    const transaction = this.db.transaction(filesStoreName, "readonly")
    const store = transaction.objectStore(filesStoreName)
    const request = store.get(id)
    const result = await requestToPromise<Data | undefined>(request)
    return result ?? null
  }

  async delete(id: number): Promise<void> {
    await this.deleteMany([id])
  }

  async deleteMany(ids: number[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")
    const transaction = this.db.transaction(filesStoreName, "readwrite")
    const store = transaction.objectStore(filesStoreName)
    for (const id of ids) {
      store.delete(id)
    }

    await this.updateCatalog((catalog) => {
      for (const id of ids) {
        delete catalog.files[id]
      }
      return catalog
    })
  }

  async list(): Promise<{ [key: string]: Metadata }> {
    const catalog = await this.getCatalog()
    return catalog.files
  }
}

function requestToPromise<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
