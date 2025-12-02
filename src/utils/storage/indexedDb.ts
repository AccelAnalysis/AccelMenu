import { Slide } from '../../api/models';

const DB_NAME = 'accelmenu-cache';
const DB_VERSION = 1;
const ASSET_STORE = 'assets';
const DRAFT_STORE = 'drafts';

export interface CachedAssetEntry {
  id: string;
  blob: Blob;
  metadata: CachedAssetMetadata;
}

export interface CachedAssetMetadata {
  name: string;
  type: string;
  size: number;
  createdAt: number;
  updatedAt?: number;
  originalName?: string;
}

export interface DraftCacheEntry {
  id: string;
  boardSlug: string;
  slide: Slide;
  updatedAt: number;
  locationSlug?: string;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        const store = db.createObjectStore(ASSET_STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        const store = db.createObjectStore(DRAFT_STORE, { keyPath: 'id' });
        store.createIndex('boardSlug', 'boardSlug', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStore(storeName: string, mode: IDBTransactionMode) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, mode);
  return { store: tx.objectStore(storeName), tx } as const;
}

export async function cacheAsset(entry: CachedAssetEntry): Promise<void> {
  const { store, tx } = await getStore(ASSET_STORE, 'readwrite');
  store.put({ ...entry, metadata: { ...entry.metadata, updatedAt: Date.now() } });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getCachedAsset(id: string): Promise<CachedAssetEntry | undefined> {
  const { store } = await getStore(ASSET_STORE, 'readonly');
  const request = store.get(id);
  const result = await requestToPromise<CachedAssetEntry | undefined>(request);
  return result ?? undefined;
}

export async function removeCachedAsset(id: string): Promise<void> {
  const { store, tx } = await getStore(ASSET_STORE, 'readwrite');
  store.delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function cacheDrafts(boardSlug: string, slides: Slide[]): Promise<void> {
  if (!slides.length) return;
  const { store, tx } = await getStore(DRAFT_STORE, 'readwrite');
  const timestamp = Date.now();
  slides.forEach((slide) => {
    const entry: DraftCacheEntry = {
      id: slide.id,
      boardSlug,
      slide,
      updatedAt: timestamp,
      locationSlug: slide.locationSlug,
    };
    store.put(entry);
  });

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function loadDraftsForBoard(boardSlug: string): Promise<Slide[]> {
  const { store } = await getStore(DRAFT_STORE, 'readonly');
  const index = store.index('boardSlug');
  const request = index.getAll(boardSlug);
  const entries = await requestToPromise<DraftCacheEntry[]>(request);
  if (!entries?.length) return [];
  return entries.map((entry) => entry.slide).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export async function clearDrafts(boardSlug: string): Promise<void> {
  const { store, tx } = await getStore(DRAFT_STORE, 'readwrite');
  const index = store.index('boardSlug');
  const request = index.getAllKeys(boardSlug);
  const keys = await requestToPromise<IDBValidKey[]>(request);
  keys.forEach((key) => store.delete(key));

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function cacheAssetMetadataFromFile(file: File, blob: Blob, id: string) {
  const metadata: CachedAssetMetadata = {
    name: file.name,
    originalName: file.name,
    type: blob.type || file.type,
    size: blob.size,
    createdAt: Date.now(),
  };
  const entry: CachedAssetEntry = {
    id,
    blob,
    metadata,
  };
  await cacheAsset(entry);
}

export type CachedAssetListItem = CachedAssetMetadata & { id: string };

export async function listCachedAssets(): Promise<CachedAssetListItem[]> {
  const { store } = await getStore(ASSET_STORE, 'readonly');
  const request = store.getAll();
  const entries = await requestToPromise<CachedAssetEntry[]>(request);
  return entries.map((entry) => ({ ...entry.metadata, id: entry.id }));
}
