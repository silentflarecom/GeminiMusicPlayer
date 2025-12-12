
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { Playlist, Song, PlayState } from '../types';
import { PrevIcon, PlayIcon, PauseIcon, TrashIcon, CloudDownloadIcon } from './Icons';
import SmartImage from './SmartImage';

interface PlaylistDetailProps {
    playlist: Playlist;
    onBack: () => void;
    onPlay: (song: Song) => void;
    onDelete: (id: string) => void;
    currentSong?: Song | null;
    isPlaying: boolean;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({
    playlist: initialPlaylist, // Rename to avoid confusion if we manage local state
    onBack,
    onPlay,
    onDelete,
    currentSong,
    isPlaying
}) => {
    // We might want to animate the entrance
    const [scrolled, setScrolled] = useState(false);

    // Calculate total duration or stats?
    const songCount = initialPlaylist.songs.length;

    // Scroll listener for header effect
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                setScrolled(scrollRef.current.scrollTop > 200);
            }
        };
        const el = scrollRef.current;
        el?.addEventListener('scroll', handleScroll);
        return () => el?.removeEventListener('scroll', handleScroll);
    }, []);

    // Create a deterministic gradient based on ID
    const gradient = useMemo(() => {
        const colors = [
            'from-indigo-900 to-purple-900',
            'from-rose-900 to-pink-900',
            'from-emerald-900 to-teal-900',
            'from-blue-900 to-cyan-900',
            'from-amber-900 to-orange-900'
        ];
        const index = initialPlaylist.id.charCodeAt(0) % colors.length;
        return colors[index];
    }, [initialPlaylist.id]);

    return (
        <div className="w-full h-full relative z-40 bg-[#0f0f11] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header (Sticky / Floating) */}
            <div className={`absolute top-0 left-0 right-0 h-16 z-50 flex items-center px-4 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : ''}`}>
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                >
                    <PrevIcon className="w-6 h-6" />
                </button>
                <div className={`ml-4 transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-white font-bold truncate max-w-[200px]">{initialPlaylist.name}</h2>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto w-full h-full custom-scrollbar">
                {/* Hero Section */}
                <div className={`relative w-full h-[40vh] min-h-[300px] bg-gradient-to-b ${gradient} flex items-end p-8`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-end text-center md:text-left w-full max-w-5xl mx-auto">
                        {/* Cover */}
                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                            {initialPlaylist.coverUrl ? (
                                <img src={initialPlaylist.coverUrl} className="w-full h-full object-cover" alt={initialPlaylist.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                    <span className="text-6xl">♫</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 mb-2">
                            <h4 className="text-white/60 font-medium uppercase tracking-widest text-xs mb-2">Playlist</h4>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">{initialPlaylist.name}</h1>
                            <div className="flex items-center gap-4 text-white/60 text-sm font-medium justify-center md:justify-start">
                                <span>{songCount} songs</span>
                                <span>•</span>
                                <span>{new Date(initialPlaylist.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 mt-8 justify-center md:justify-start">
                                <button
                                    onClick={() => initialPlaylist.songs.length > 0 && onPlay(initialPlaylist.songs[0])}
                                    disabled={songCount === 0}
                                    className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PlayIcon className="w-6 h-6 translate-x-0.5 fill-current" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm("Are you sure you want to delete this playlist?")) {
                                            onDelete(initialPlaylist.id);
                                            onBack();
                                        }
                                    }}
                                    className="h-10 w-10 text-white/40 hover:text-red-400 transition-colors"
                                    title="Delete Playlist"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Song List */}
                <div className="w-full max-w-5xl mx-auto p-4 md:p-8 pb-32">
                    {songCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-white/30 border-t border-white/5">
                            <CloudDownloadIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">This playlist is empty</p>
                            <p className="text-sm">Add songs from your library or local files</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Header Row */}
                            <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 text-xs font-semibold uppercase text-white/40 border-b border-white/5 mb-2">
                                <div className="w-8 text-center">#</div>
                                <div>Title</div>
                                <div>Artist</div>
                            </div>

                            {initialPlaylist.songs.map((song, idx) => {
                                const isCurrent = currentSong?.id === song.id;
                                return (
                                    <div
                                        key={`${song.id}-${idx}`}
                                        onClick={() => onPlay(song)}
                                        className={`group grid grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${isCurrent ? 'bg-white/10' : ''}`}
                                    >
                                        <div className="w-8 text-center text-white/40 text-sm font-medium group-hover:text-white">
                                            {isCurrent && isPlaying ? (
                                                <div className="w-3 h-3 mx-auto bg-green-400 rounded-full animate-pulse" />
                                            ) : (
                                                <span className="group-hover:hidden">{idx + 1}</span>
                                            )}
                                            <PlayIcon className="w-4 h-4 hidden group-hover:block mx-auto fill-current text-white" />
                                        </div>
                                        <div className="min-w-0 pr-4">
                                            <div className={`text-sm font-semibold truncate ${isCurrent ? 'text-green-400' : 'text-white'}`}>{song.title}</div>
                                        </div>
                                        <div className="text-sm text-white/40 truncate max-w-[150px] text-right">
                                            {song.artist}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistDetail;
