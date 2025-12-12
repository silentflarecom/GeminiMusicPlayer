
import { Song, Playlist } from '../types';

const DB_NAME = 'aura_music_db';
const DB_VERSION = 1;

const STORES = {
    PLAYLISTS: 'playlists',
    SONGS: 'songs', // For caching song data/blobs if needed
};

export class LibraryDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORES.PLAYLISTS)) {
                    db.createObjectStore(STORES.PLAYLISTS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.SONGS)) {
                    // We might store files here later
                    db.createObjectStore(STORES.SONGS, { keyPath: 'id' });
                }
            };
        });
    }

    async getAllPlaylists(): Promise<Playlist[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORES.PLAYLISTS, 'readonly');
            const store = transaction.objectStore(STORES.PLAYLISTS);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async savePlaylist(playlist: Playlist): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORES.PLAYLISTS, 'readwrite');
            const store = transaction.objectStore(STORES.PLAYLISTS);
            const request = store.put(playlist);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async deletePlaylist(id: string): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORES.PLAYLISTS, 'readwrite');
            const store = transaction.objectStore(STORES.PLAYLISTS);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

export const libraryDB = new LibraryDB();
