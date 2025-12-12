import { PlayIcon, QueueIcon, SettingsIcon, UserIcon, CloudDownloadIcon, LinkIcon } from './Icons';
import { useState, useEffect, useRef } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { useUserProfile } from '../hooks/useUserProfile';
import { useLibrary } from '../hooks/useLibrary';
import ProfileDialog from './ProfileDialog';
import { Song, Playlist } from '../types';
import CreatePlaylistDialog from './CreatePlaylistDialog';
import { SparklesIcon } from './Icons';
import PlaylistDetail from './PlaylistDetail';

// Folder icon for local files
const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
    </svg>
);

interface HomeViewProps {
    onNavigateToPlayer: () => void;
    onPlayPlaylist: (songs: Song[], startIndex: number) => void;
    isPlaying: boolean;
    currentSong: Song | null;
    greeting?: string;
    onSettingsClick: () => void;
    onThemeClick: () => void;
    onImportFiles?: () => void;
    onImportUrl?: (url: string) => Promise<boolean>;
}

const HomeView: React.FC<HomeViewProps> = ({
    onNavigateToPlayer,
    onPlayPlaylist,
    isPlaying,
    currentSong,
    greeting,
    onSettingsClick,
    onThemeClick,
    onImportFiles,
    onImportUrl
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

    // Netease URL import state
    const [neteaseUrl, setNeteaseUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleNeteaseImport = async () => {
        if (!neteaseUrl.trim() || isImporting || !onImportUrl) return;
        setIsImporting(true);
        try {
            const success = await onImportUrl(neteaseUrl.trim());
            if (success) {
                setNeteaseUrl('');
            }
        } finally {
            setIsImporting(false);
        }
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
                    <button
                        onClick={onThemeClick}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:scale-105 transition-all"
                        title="Switch Theme / Visualizer"
                    >
                        <SparklesIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onSettingsClick}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:scale-105 transition-all"
                        title="Settings"
                    >
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

            {/* Import Cards - Main Action Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                {/* Netease Cloud Music Import */}
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500/20 via-red-400/15 to-rose-500/20 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300">
                    {/* Background decoration */}
                    <div className="absolute -top-4 -right-4 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Netease Cloud Music</h3>
                                <p className="text-white/50 text-sm">Import from link</p>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-white/60 text-sm mb-4 leading-relaxed">
                            Paste a song or playlist link to import with cover art and lyrics
                        </p>

                        {/* URL Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={neteaseUrl}
                                onChange={(e) => setNeteaseUrl(e.target.value)}
                                placeholder="https://music.163.com/..."
                                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-white/15 transition-all text-sm"
                                disabled={isImporting}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleNeteaseImport();
                                    }
                                }}
                            />
                            <button
                                onClick={handleNeteaseImport}
                                disabled={isImporting || !neteaseUrl.trim()}
                                className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${isImporting || !neteaseUrl.trim()
                                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 active:scale-[0.98] shadow-lg shadow-red-500/25'
                                    }`}
                            >
                                {isImporting ? (
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <LinkIcon className="w-5 h-5" />
                                )}
                                <span className="hidden sm:inline">{isImporting ? 'Importing...' : 'Import'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Local Files Import */}
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-400/15 to-cyan-500/20 backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
                    {/* Background decoration */}
                    <div className="absolute -top-4 -right-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <FolderIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Local Files</h3>
                                <p className="text-white/50 text-sm">Import from folder</p>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-white/60 text-sm mb-4 leading-relaxed">
                            Import music from your local folder. Supports MP3, FLAC, WAV and more
                        </p>

                        {/* Action Button */}
                        <button
                            onClick={onImportFiles}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                        >
                            <CloudDownloadIcon className="w-5 h-5" />
                            <span>Select Folder</span>
                        </button>
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
                            className="group cursor-pointer active:scale-95 transition-transform duration-200"
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

            {/* Playlist Detail Overlay Transition */}
            {(() => {
                const transitions = useTransition(selectedPlaylist, {
                    from: { opacity: 0, transform: 'translate3d(0, 100%, 0)' },
                    enter: { opacity: 1, transform: 'translate3d(0, 0%, 0)' },
                    leave: { opacity: 0, transform: 'translate3d(0, 50%, 0)' },
                    config: { tension: 280, friction: 30, clamp: true },
                });

                return transitions((style, item) => item && (
                    <animated.div style={style} className="absolute inset-0 z-50">
                        <PlaylistDetail
                            playlist={item}
                            onBack={() => setSelectedPlaylist(null)}
                            currentSong={currentSong}
                            isPlaying={isPlaying}
                            onDelete={(id) => {
                                deletePlaylist(id);
                                setSelectedPlaylist(null);
                            }}
                            onPlay={(song) => {
                                // Find index in playlist
                                const index = item.songs.findIndex(s => s.id === song.id);
                                if (index !== -1) {
                                    onPlayPlaylist(item.songs, index);
                                    onNavigateToPlayer();
                                }
                            }}
                        />
                    </animated.div>
                ));
            })()}
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
