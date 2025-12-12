
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

    async saveSong(song: Song): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORES.SONGS, 'readwrite');
            const store = transaction.objectStore(STORES.SONGS);
            // Don't store the blob url, it's ephemeral
            const { fileUrl, ...rest } = song;
            // Ensure we keep the blob if it exists, otherwise we can't play it later
            // If fileUrl was a blob url, and we don't have fileBlob, we can't persist.
            // Assumption: App ensures fileBlob is set for local files.

            // We store the song object. 
            // Note: If song has no fileBlob and is local, we break. 
            // But imported files will have it added.
            const songToStore = { ...song };
            // We don't clear fileUrl here, but we could to save space, but it serves as ID sometimes? 
            // Actually ID is separate.

            const request = store.put(songToStore);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async getAllLocalSongs(): Promise<Song[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORES.SONGS, 'readonly');
            const store = transaction.objectStore(STORES.SONGS);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const songs: Song[] = request.result;
                // Regenerate URLs for blobs
                const revivified = songs.map(s => {
                    if (s.fileBlob && (!s.fileUrl || s.fileUrl.startsWith('blob:'))) {
                        // Create new URL
                        return {
                            ...s,
                            fileUrl: URL.createObjectURL(s.fileBlob)
                        };
                    }
                    return s;
                });
                resolve(revivified);
            };
        });
    }
}

export const libraryDB = new LibraryDB();
