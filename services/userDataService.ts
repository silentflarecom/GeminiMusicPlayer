import { Song } from "../types";

const STORAGE_KEYS = {
    LIKED_SONGS: 'aura_liked_songs',
    RECENT_SONGS: 'aura_recent_songs',
    LIKED_IDS: 'aura_liked_ids'
};

class UserDataService {
    // Liked Songs
    getLikedSongs(): Song[] {
        try {
            const json = localStorage.getItem(STORAGE_KEYS.LIKED_SONGS);
            return json ? JSON.parse(json) : [];
        } catch {
            return [];
        }
    }

    addLikedSong(song: Song) {
        const songs = this.getLikedSongs();
        if (songs.some(s => s.id === song.id)) return;
        const newSongs = [song, ...songs];
        localStorage.setItem(STORAGE_KEYS.LIKED_SONGS, JSON.stringify(newSongs));
        localStorage.setItem(STORAGE_KEYS.LIKED_IDS, JSON.stringify(newSongs.map(s => s.id)));
    }

    removeLikedSong(songId: string) {
        const songs = this.getLikedSongs();
        const newSongs = songs.filter(s => s.id !== songId);
        localStorage.setItem(STORAGE_KEYS.LIKED_SONGS, JSON.stringify(newSongs));
        localStorage.setItem(STORAGE_KEYS.LIKED_IDS, JSON.stringify(newSongs.map(s => s.id)));
    }

    isLiked(songId: string): boolean {
        // Optimization: Keep a set of IDs in memory or read separate key
        try {
            const json = localStorage.getItem(STORAGE_KEYS.LIKED_IDS);
            const ids: string[] = json ? JSON.parse(json) : [];
            return ids.includes(songId);
        } catch {
            return false;
        }
    }

    toggleLike(song: Song) {
        if (this.isLiked(song.id)) {
            this.removeLikedSong(song.id);
            return false;
        } else {
            this.addLikedSong(song);
            return true;
        }
    }

    // Recently Played
    getRecentSongs(): Song[] {
        try {
            const json = localStorage.getItem(STORAGE_KEYS.RECENT_SONGS);
            return json ? JSON.parse(json) : [];
        } catch {
            return [];
        }
    }

    addToHistory(song: Song) {
        let songs = this.getRecentSongs();
        // Remove existing if present to move to top
        songs = songs.filter(s => s.id !== song.id);
        songs.unshift(song);
        // Limit to 50
        if (songs.length > 50) songs = songs.slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.RECENT_SONGS, JSON.stringify(songs));
    }
}

export const userDataService = new UserDataService();
