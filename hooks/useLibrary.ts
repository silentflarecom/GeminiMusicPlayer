import { useState, useEffect, useCallback } from "react";
import { Song, StoredPlaylist } from "../types";

const STORAGE_KEYS = {
  PLAYLISTS: "aura_playlists",
  HISTORY: "aura_history",
};

export const useLibrary = () => {
  const [playlists, setPlaylists] = useState<StoredPlaylist[]>([]);
  const [history, setHistory] = useState<Song[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedPlaylists = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);

      if (storedPlaylists) {
        setPlaylists(JSON.parse(storedPlaylists));
      }
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load library data", e);
    }
  }, []);

  const savePlaylists = (newPlaylists: StoredPlaylist[]) => {
    setPlaylists(newPlaylists);
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(newPlaylists));
  };

  const saveHistory = (newHistory: Song[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
  };

  const createPlaylist = useCallback((name: string, songs: Song[]) => {
    const newPlaylist: StoredPlaylist = {
      id: crypto.randomUUID(),
      name,
      songs,
      createdAt: Date.now(),
      coverUrl: songs.find((s) => s.coverUrl)?.coverUrl,
    };
    
    setPlaylists((prev) => {
      const next = [newPlaylist, ...prev];
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(next));
      return next;
    });
    return newPlaylist;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const addToHistory = useCallback((song: Song) => {
    setHistory((prev) => {
      // Remove existing instance of this song to move it to top
      const filtered = prev.filter((s) => s.id !== song.id && s.fileUrl !== song.fileUrl);
      const next = [song, ...filtered].slice(0, 100); // Keep last 100
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }, []);

  return {
    playlists,
    history,
    createPlaylist,
    deletePlaylist,
    addToHistory,
    clearHistory,
  };
};
