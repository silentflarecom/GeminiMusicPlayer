
import { useState, useEffect, useCallback } from 'react';
import { Playlist, Song } from '../types';
import { libraryDB } from '../services/libraryService';

export const useLibrary = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        try {
            const storedPlaylists = await libraryDB.getAllPlaylists();
            setPlaylists(storedPlaylists.sort((a, b) => b.createdAt - a.createdAt));
        } catch (err) {
            console.error("Failed to load library", err);
        } finally {
            setIsLoading(false);
        }
    };

    const createPlaylist = async (name: string, description?: string) => {
        const newPlaylist: Playlist = {
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: Date.now(),
            songs: []
        };
        await libraryDB.savePlaylist(newPlaylist);
        setPlaylists(prev => [newPlaylist, ...prev]);
        return newPlaylist;
    };

    const deletePlaylist = async (id: string) => {
        await libraryDB.deletePlaylist(id);
        setPlaylists(prev => prev.filter(p => p.id !== id));
    };

    const addSongToPlaylist = async (playlistId: string, song: Song) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        // Check for duplicates
        if (playlist.songs.some(s => s.id === song.id)) return;

        // Note: Logic to persisting Song blobs is complex.
        // For now, we assume these are references or netease songs.
        // If it's a local file, it might break on reload if not handled.
        // A full implementation would clone the blob into IDB.

        const updatedPlaylist = {
            ...playlist,
            songs: [...playlist.songs, song]
            // Update cover if empty
        };

        if (!updatedPlaylist.coverUrl && song.coverUrl) {
            updatedPlaylist.coverUrl = song.coverUrl;
        }

        await libraryDB.savePlaylist(updatedPlaylist);
        setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
    };

    return {
        playlists,
        isLoading,
        createPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        refresh: loadLibrary
    };
};
