import React, { useState } from "react";
import { useTransition, animated } from "@react-spring/web";
import { Song, StoredPlaylist } from "../types";
import { PlayIcon, PlusIcon, HistoryIcon, TrashIcon, ClockIcon } from "./Icons";
import SmartImage from "./SmartImage";

interface HomePageProps {
  isVisible: boolean;
  playlists: StoredPlaylist[];
  history: Song[];
  onCreatePlaylist: (name: string) => void;
  onPlayPlaylist: (songs: Song[]) => void;
  onDeletePlaylist: (id: string) => void;
  onClose: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Quiet Hours";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const HomePage: React.FC<HomePageProps> = ({
  isVisible,
  playlists,
  history,
  onCreatePlaylist,
  onPlayPlaylist,
  onDeletePlaylist,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const transitions = useTransition(isVisible, {
    from: { opacity: 0, transform: "scale(0.95) translateY(10px)" },
    enter: { opacity: 1, transform: "scale(1) translateY(0px)" },
    leave: { opacity: 0, transform: "scale(1.05) translateY(-10px)", pointerEvents: "none" },
    config: { tension: 280, friction: 30 },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreating(false);
    }
  };

  return transitions((style, item) => item && (
    <animated.div 
      style={style} 
      className="absolute inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-3xl"
    >
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 min-h-screen">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
              {getGreeting()}
            </h1>
            <p className="text-white/50 text-lg">Welcome to your personal music space.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/10"
          >
            Back to Player
          </button>
        </div>

        {/* Playlists Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
              My Playlists
            </h2>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/90 transition-all text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="mb-8">
              <div className="flex gap-3 max-w-md">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name..."
                  autoFocus
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  type="submit"
                  className="px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 text-white/50 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Create Card (Alternative) */}
            <button
              onClick={() => setIsCreating(true)}
              className="aspect-square rounded-[24px] border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 flex flex-col items-center justify-center gap-3 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
                <PlusIcon className="w-6 h-6 text-white/40 group-hover:text-white/80" />
              </div>
              <span className="text-white/40 font-medium group-hover:text-white/80">New Playlist</span>
            </button>

            {/* Playlist Cards */}
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group relative aspect-square bg-white/5 hover:bg-white/10 rounded-[24px] p-4 flex flex-col transition-all cursor-pointer overflow-hidden border border-white/5 hover:border-white/10"
                onClick={() => onPlayPlaylist(playlist.songs)}
              >
                {/* Cover Grid */}
                <div className="flex-1 w-full rounded-2xl overflow-hidden bg-black/20 mb-4 relative">
                    {playlist.coverUrl ? (
                         <SmartImage src={playlist.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                            <span className="text-4xl">♪</span>
                        </div>
                    )}
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                            <PlayIcon className="w-5 h-5 translate-x-0.5" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-white font-bold truncate pr-2 leading-tight">{playlist.name}</h3>
                        <p className="text-white/40 text-xs mt-1 font-medium">{playlist.songs.length} Tracks</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeletePlaylist(playlist.id);
                        }}
                        className="text-white/20 hover:text-red-400 p-1 rounded-md hover:bg-white/5 transition-colors"
                        title="Delete Playlist"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Played Section */}
        {history.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
              <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
              Recently Played
            </h2>
            
            <div className="bg-white/5 rounded-[32px] p-2 border border-white/5">
              {history.slice(0, 8).map((song, i) => (
                <div
                  key={`${song.id}-${i}`}
                  onClick={() => onPlayPlaylist([song])}
                  className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden relative flex-shrink-0">
                    {song.coverUrl ? (
                        <SmartImage src={song.coverUrl} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">♪</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <PlayIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{song.title}</h4>
                    <p className="text-white/40 text-sm truncate">{song.artist}</p>
                  </div>

                  <div className="text-white/20 px-4 group-hover:text-white/60 transition-colors">
                     <ClockIcon className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </animated.div>
  ));
};

export default HomePage;
