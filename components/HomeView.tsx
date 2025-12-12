
import { PlayIcon, QueueIcon, SettingsIcon, UserIcon, LikeIcon as HeartIcon, ClockIcon, CloudDownloadIcon } from './Icons';
import { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLibrary } from '../hooks/useLibrary';
import ProfileDialog from './ProfileDialog';
import { Song, Playlist } from '../types';
import CreatePlaylistDialog from './CreatePlaylistDialog';
import { userDataService } from '../services/userDataService';
import { useEffect } from 'react';

interface HomeViewProps {
    onNavigateToPlayer: () => void;
    // New prop to handle playing a full playlist
    onPlayPlaylist: (songs: Song[], startIndex: number) => void;
    isPlaying: boolean;
    currentSong: Song | null;
    greeting?: string;
}

import PlaylistDetail from './PlaylistDetail';

const HomeView: React.FC<HomeViewProps> = ({
    onNavigateToPlayer,
    onPlayPlaylist,
    isPlaying,
    currentSong,
    greeting = "Welcome"
}) => {
    const { profile, updateProfile } = useUserProfile();
    const { playlists, createPlaylist, deletePlaylist } = useLibrary();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

    const handleCreatePlaylist = async () => {
        // Simple prompt for now, can be a dialog later
        const name = window.prompt("Playlist Name:", "New Playlist");
        if (name) {
            await createPlaylist(name);
        }
    };


    const timeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const displayGreeting = `${greeting || timeGreeting()}, ${profile.username}`;

    const [showCreateDialog, setShowCreateDialog] = useState(false);

    // Dynamic Counts
    const [likedCount, setLikedCount] = useState(0);
    const [recentCount, setRecentCount] = useState(0);

    useEffect(() => {
        setLikedCount(userDataService.getLikedSongs().length);
        setRecentCount(userDataService.getRecentSongs().length);

        // Listen for storage events to update counts across tabs or components?
        // Or just re-fetch when HomeView mounts/focuses.
        // For now, simple mount fetch is enough.
    }, [isProfileOpen]); // Refresh when profile closes/opens just in case (hacky but simple)


    const handleOpenQuickAccess = async (type: 'liked' | 'recent' | 'local') => {
        let title = "";
        let songs: Song[] = [];
        let id = "";

        if (type === 'liked') {
            title = "Liked Songs";
            songs = userDataService.getLikedSongs();
            id = "liked_songs_virtual";
        } else if (type === 'recent') {
            title = "Recently Played";
            songs = userDataService.getRecentSongs();
            id = "recent_songs_virtual";
            // TODO: Ensure uniqueness or playback issues? Queue handles it.
        } else if (type === 'local') {
            title = "Local Files";
            // We don't have a specific store for all local files other than what's in Library playlists or current queue.
            // But usually apps show all "Imported" files.
            // Since we don't persist "All Local Files" explicitly in a single list, 
            // maybe we can aggregate from all playlists that are "Local" or just show a message or empty.
            // For now, let's show an empty list or try to prompt import logic.
            // Actually, we can just filter all songs in all playlists? Or just use a placeholder.
            // Let's create a placeholder for now as "Local Files" usually implies a file browser which we implemented via "Import Folder".
            id = "local_files_virtual";
            songs = []; // TODO: Aggregate from DB
        }

        const virtualPlaylist: Playlist = {
            id,
            name: title,
            createdAt: Date.now(),
            songs,
            coverUrl: undefined // Could use specific icons
        };

        if (type === 'local' && songs.length === 0) {
            // Maybe trigger import instead?
            // For now just open empty playlist
        }

        setSelectedPlaylist(virtualPlaylist);
    };

    return (
        <div className="w-full h-full relative z-30 flex flex-col p-6 lg:p-12 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                        {displayGreeting}
                    </h1>
                    <p className="text-white/60 text-lg mt-2 font-medium">
                        Your personal music sanctuary
                    </p>
                </div>

                <div className="flex gap-4">
                    <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:scale-105 transition-all">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                    <div
                        className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 p-[2px] cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setIsProfileOpen(true)}
                    >
                        <div className="w-full h-full rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                <div
                    onClick={() => handleOpenQuickAccess('liked')}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-xl border border-white/5 p-6 hover:border-white/20 transition-all cursor-pointer hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <HeartIcon className="w-12 h-12 text-white/20" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-end">
                        <h3 className="text-2xl font-bold text-white mb-1">Liked Songs</h3>
                        <p className="text-white/60">{likedCount} tracks</p>
                    </div>
                </div>

                <div
                    onClick={() => handleOpenQuickAccess('recent')}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/5 p-6 hover:border-white/20 transition-all cursor-pointer hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <ClockIcon className="w-12 h-12 text-white/20" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-end">
                        <h3 className="text-2xl font-bold text-white mb-1">Recently Played</h3>
                        <p className="text-white/60">{recentCount} tracks</p>
                    </div>
                </div>

                <div
                    onClick={() => handleOpenQuickAccess('local')}
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-white/5 p-6 hover:border-white/20 transition-all cursor-pointer hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <CloudDownloadIcon className="w-12 h-12 text-white/20" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-end">
                        <h3 className="text-2xl font-bold text-white mb-1">Local Files</h3>
                        <p className="text-white/60">Imported</p>
                    </div>
                </div>
            </div>

            {/* Playlists Section (Placeholder) */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
                    <button className="text-white/50 hover:text-white text-sm font-medium transition-colors">See All</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Create New Card */}
                    <div
                        onClick={() => setShowCreateDialog(true)}
                        className="aspect-square rounded-2xl bg-white/5 border border-white/5 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <span className="text-3xl text-white/50 font-light">+</span>
                        </div>
                        <span className="text-white/60 font-medium">New Playlist</span>
                    </div>

                    {/* Real Playlists */}
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            className="group cursor-pointer"
                            onClick={() => setSelectedPlaylist(playlist)}
                        >
                            <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-900/50 to-slate-900/50 border border-white/5 mb-3 overflow-hidden relative">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                {playlist.coverUrl ? (
                                    <img src={playlist.coverUrl} className="w-full h-full object-cover" alt={playlist.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl">♫</div>
                                )}
                            </div>
                            <h3 className="text-white font-medium truncate">{playlist.name}</h3>
                            <p className="text-white/40 text-sm">{playlist.songs.length} songs</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Now Playing Floating Bar (Only if currentSong exists) */}
            {currentSong && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-2xl z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
                    <div
                        onClick={onNavigateToPlayer}
                        className="w-full p-2 pr-6 rounded-full bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center gap-4 cursor-pointer hover:bg-white/15 transition-all group"
                    >
                        <div className={`w-12 h-12 rounded-full overflow-hidden relative ${isPlaying ? 'animate-spin-slow' : ''}`}>
                            {currentSong.coverUrl ? (
                                <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-xs text-white">♪</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <h4 className="text-white font-bold truncate">{currentSong.title}</h4>
                            <p className="text-white/60 text-sm truncate">{currentSong.artist}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mini Visualizer or Icon */}
                            <div className="hidden sm:flex items-end gap-1 h-4">
                                {[1, 2, 3, 4].map(bar => (
                                    <div key={bar} className={`w-1 bg-white/80 rounded-full ${isPlaying ? 'animate-music-bar' : 'h-1'}`} style={{ animationDelay: `${bar * 0.1}s` }} />
                                ))}
                            </div>
                            <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10">
                                <PlayIcon className="w-4 h-4 translate-x-0.5 fill-current" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Profile Dialog */}
            <ProfileDialog
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                profile={profile}
                onSave={updateProfile}
            />

            {/* Playlist Detail Overlay */}
            {selectedPlaylist && (
                <div className="absolute inset-0 z-50">
                    <PlaylistDetail
                        playlist={selectedPlaylist}
                        onBack={() => setSelectedPlaylist(null)}
                        currentSong={currentSong}
                        isPlaying={isPlaying}
                        onDelete={(id) => {
                            deletePlaylist(id);
                            setSelectedPlaylist(null);
                        }}
                        onPlay={(song) => {
                            // Find index in playlist
                            const index = selectedPlaylist.songs.findIndex(s => s.id === song.id);
                            if (index !== -1) {
                                onPlayPlaylist(selectedPlaylist.songs, index);
                                onNavigateToPlayer();
                            }
                        }}
                    />
                </div>
            )}
            {/* Create Playlist Dialog */}
            <CreatePlaylistDialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onCreate={(name) => {
                    createPlaylist(name);
                    setShowCreateDialog(false);
                }}
            />
        </div>
    );
};

export default HomeView;
