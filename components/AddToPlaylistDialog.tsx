
import React, { useRef, useEffect } from 'react';
import { Playlist, Song } from '../types';
import { useLibrary } from '../hooks/useLibrary';
import { PlusIcon, CheckIcon } from './Icons';

interface AddToPlaylistDialogProps {
    isOpen: boolean;
    onClose: () => void;
    songsToAdd: Song[];
    onSuccess?: () => void;
}

const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
    isOpen,
    onClose,
    songsToAdd,
    onSuccess
}) => {
    const { playlists, createPlaylist, addSongToPlaylist } = useLibrary();
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleCreateNew = async () => {
        const name = window.prompt("Playlist Name:", "New Playlist");
        if (!name) return;

        const newPlaylist = await createPlaylist(name);
        // Wait a bit for state update or use the returned object directly
        for (const song of songsToAdd) {
            await addSongToPlaylist(newPlaylist.id, song);
        }
        onSuccess?.();
        onClose();
    };

    const handleSelectPlaylist = async (playlist: Playlist) => {
        for (const song of songsToAdd) {
            await addSongToPlaylist(playlist.id, song);
        }
        onSuccess?.();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                className="w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
            >
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Add to Playlist</h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white">Close</button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {/* Create New Option */}
                    <button
                        onClick={handleCreateNew}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors text-left group"
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                            <PlusIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-white font-medium">New Playlist</div>
                        </div>
                    </button>

                    <div className="h-[1px] bg-white/5 my-2 mx-4" />

                    {/* Playlist List */}
                    {playlists.map(playlist => {
                        const count = playlist.songs.length;
                        return (
                            <button
                                key={playlist.id}
                                onClick={() => handleSelectPlaylist(playlist)}
                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors text-left group"
                            >
                                <div className="relative w-12 h-12 bg-white/5 rounded-lg overflow-hidden border border-white/5">
                                    {playlist.coverUrl ? (
                                        <img src={playlist.coverUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            <span className="text-lg">♫</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium truncate">{playlist.name}</div>
                                    <div className="text-white/40 text-xs">{count} songs</div>
                                </div>
                            </button>
                        );
                    })}

                    {playlists.length === 0 && (
                        <div className="p-4 text-center text-white/30 text-sm">
                            No playlists found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistDialog;
