
import { useState, useEffect, useCallback } from 'react';
import { Playlist, Song } from '../types';
import { libraryDB } from '../services/libraryService';

export const useLibrary = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [localSongs, setLocalSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        try {
            const storedPlaylists = await libraryDB.getAllPlaylists();
            setPlaylists(storedPlaylists.sort((a, b) => b.createdAt - a.createdAt));

            const storedSongs = await libraryDB.getAllLocalSongs();
            setLocalSongs(storedSongs.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)));
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

    const addLocalSong = async (song: Song) => {
        // Add timestamp if missing
        const songToSave = { ...song, addedAt: Date.now() };
        await libraryDB.saveSong(songToSave);
        setLocalSongs(prev => {
            const exists = prev.find(p => p.id === song.id);
            if (exists) return prev;
            return [songToSave, ...prev];
        });
    };

    return {
        playlists,
        isLoading,
        createPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        refresh: loadLibrary,
        localSongs,
        addLocalSong
    };
};
