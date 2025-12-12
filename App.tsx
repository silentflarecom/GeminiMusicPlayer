import React, { useState, useRef, useEffect } from "react";
import { useToast } from "./hooks/useToast";
import { PlayState, Song } from "./types";
import FluidBackground from "./components/FluidBackground";
import Controls from "./components/Controls";
import LyricsView from "./components/LyricsView";
import PlaylistPanel from "./components/PlaylistPanel";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import TopBar from "./components/TopBar";
import SearchModal from "./components/SearchModal";
import { usePlaylist } from "./hooks/usePlaylist";
import { usePlayer } from "./hooks/usePlayer";
import { keyboardRegistry } from "./services/keyboardRegistry";
import MediaSessionController from "./components/MediaSessionController";
import { CloudDownloadIcon } from "./components/Icons";
import HomeView from "./components/HomeView";
import ImmersivePlayer from "./components/ImmersivePlayer";
import AddToPlaylistDialog from "./components/AddToPlaylistDialog";

type ViewState = "home" | "player";

const App: React.FC = () => {
  const { toast } = useToast();
  const playlist = usePlaylist();
  const player = usePlayer({
    queue: playlist.queue,
    originalQueue: playlist.originalQueue,
    updateSongInQueue: playlist.updateSongInQueue,
    setQueue: playlist.setQueue,
    setOriginalQueue: playlist.setOriginalQueue,
  });

  const {
    audioRef,
    currentSong,
    playState,
    currentTime,
    duration,
    playMode,
    matchStatus,
    accentColor,
    togglePlay,
    toggleMode,
    handleSeek,
    playNext,
    playPrev,
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlaylistAddition,
    loadLyricsFile,
    playIndex,
    addSongAndPlay,
    handleAudioEnded,
    play,
    pause,
    resolvedAudioSrc,
    isBuffering,
    bufferProgress,
  } = player;

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false);
  const [songsToAdd, setSongsToAdd] = useState<Song[]>([]);
  const [volume, setVolume] = useState(1);

  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [activePanel, setActivePanel] = useState<"controls" | "lyrics">(
    "controls",
  );
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounter = useRef(0);

  // View Routing State
  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [visualizerMode, setVisualizerMode] = useState<'fluid' | 'gradient'>('fluid');

  // Auto-switch to player when a song starts playing from a non-playing state?
  // Or just let user control it. 
  // Let's switch to player when user plays a song from Home.

  // Effect to sync view if needed, but manual control is better.

  const navigateToPlayer = () => setCurrentView("player");
  const navigateToHome = () => setCurrentView("home");

  const handlePlayFromHome = (index: number) => {
    playIndex(index);
    navigateToPlayer();
  };


  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const wasEmpty = playlist.queue.length === 0;
      const addedSongs = await playlist.addLocalFiles(files);
      if (addedSongs.length > 0) {
        setTimeout(() => {
          handlePlaylistAddition(addedSongs, wasEmpty);
        }, 0);
        toast.success(`Imported ${addedSongs.length} local files`);
      }
    }
  };

  const mobileViewportRef = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth;
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 1024px)");
    const updateLayout = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileLayout(event.matches);
    };
    updateLayout(query);
    query.addEventListener("change", updateLayout);
    return () => query.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (!isMobileLayout) {
      setActivePanel("controls");
      setTouchStartX(null);
      setDragOffsetX(0);
    }
  }, [isMobileLayout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateWidth = () => {
      setPaneWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    window.visualViewport?.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
      window.visualViewport?.removeEventListener("resize", updateWidth);
    };
  }, [isMobileLayout]);

  // Global Keyboard Registry Initialization
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyboardRegistry.handle(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Global Search Shortcut (Registered directly via useEffect for simplicity, or could use useKeyboardScope with high priority)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFileChange = async (files: FileList) => {
    const wasEmpty = playlist.queue.length === 0;
    const addedSongs = await playlist.addLocalFiles(files);
    if (addedSongs.length > 0) {
      setTimeout(() => {
        handlePlaylistAddition(addedSongs, wasEmpty);
      }, 0);
    }
  };

  const handleImportUrl = async (input: string): Promise<boolean> => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    const wasEmpty = playlist.queue.length === 0;
    const result = await playlist.importFromUrl(trimmed);
    if (!result.success) {
      toast.error(result.message ?? "Failed to load songs from URL");
      return false;
    }
    if (result.songs.length > 0) {
      setTimeout(() => {
        handlePlaylistAddition(result.songs, wasEmpty);
      }, 0);
      toast.success(`Successfully imported ${result.songs.length} songs`);
      return true;
    }
    return false;
  };

  const handleImportAndPlay = (song: Song) => {
    // Check if song already exists in queue (by neteaseId for cloud songs, or by id)
    const existingIndex = playlist.queue.findIndex((s) => {
      if (song.isNetease && s.isNetease) {
        return s.neteaseId === song.neteaseId;
      }
      return s.id === song.id;
    });

    if (existingIndex !== -1) {
      // Song already in queue, just play it
      playIndex(existingIndex);
    } else {
      // Add and play atomically - no race conditions!
      addSongAndPlay(song);
    }
  };

  const handleAddToQueue = (song: Song) => {
    playlist.setQueue((prev) => [...prev, song]);
    playlist.setOriginalQueue((prev) => [...prev, song]);
  };

  const handleOpenAddToPlaylist = (songs: Song[]) => {
    setSongsToAdd(songs);
    setShowAddToPlaylistDialog(true);
  };


  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout) return;
    setTouchStartX(event.touches[0]?.clientX ?? null);
    setDragOffsetX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout || touchStartX === null) return;
    const currentX = event.touches[0]?.clientX;
    if (currentX === undefined) return;
    const deltaX = currentX - touchStartX;
    const containerWidth = event.currentTarget.getBoundingClientRect().width;
    const limitedDelta = Math.max(
      Math.min(deltaX, containerWidth),
      -containerWidth,
    );
    setDragOffsetX(limitedDelta);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileLayout || touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) {
      setTouchStartX(null);
      setDragOffsetX(0);
      setIsDragging(false);
      return;
    }
    const deltaX = endX - touchStartX;
    const threshold = 60;
    if (deltaX > threshold) {
      setActivePanel("controls");
    } else if (deltaX < -threshold) {
      setActivePanel("lyrics");
    }
    setTouchStartX(null);
    setDragOffsetX(0);
    setIsDragging(false);
  };

  const handleTouchCancel = () => {
    if (isMobileLayout) {
      setTouchStartX(null);
      setDragOffsetX(0);
      setIsDragging(false);
    }
  };

  const toggleIndicator = () => {
    setActivePanel((prev) => (prev === "controls" ? "lyrics" : "controls"));
    setDragOffsetX(0);
    setIsDragging(false);
  };

  const controlsSection = (
    <div className="flex flex-col items-center justify-center w-full h-full z-30 relative p-4">
      <div className="relative flex flex-col items-center gap-8 w-full max-w-[360px]">
        <Controls
          isPlaying={playState === PlayState.PLAYING}
          onPlayPause={togglePlay}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          title={currentSong?.title || "Welcome to Aura"}
          artist={currentSong?.artist || "Select a song"}
          audioRef={audioRef}
          onNext={playNext}
          onPrev={playPrev}
          playMode={playMode}
          onToggleMode={toggleMode}
          onTogglePlaylist={() => setShowPlaylist(true)}
          accentColor={accentColor}
          volume={volume}
          onVolumeChange={setVolume}
          speed={player.speed}
          preservesPitch={player.preservesPitch}
          onSpeedChange={player.setSpeed}
          onTogglePreservesPitch={player.togglePreservesPitch}
          coverUrl={currentSong?.coverUrl}
          isBuffering={isBuffering}
          bufferProgress={bufferProgress}
          showVolumePopup={showVolumePopup}
          setShowVolumePopup={setShowVolumePopup}
          showSettingsPopup={showSettingsPopup}
          setShowSettingsPopup={setShowSettingsPopup}
          onAddToPlaylist={() => currentSong && handleOpenAddToPlaylist([currentSong])}
        />

        {/* Floating Playlist Panel */}
        <PlaylistPanel
          isOpen={showPlaylist}
          onClose={() => setShowPlaylist(false)}
          queue={playlist.queue}
          currentSongId={currentSong?.id}
          onPlay={playIndex}
          onImport={handleImportUrl}
          onRemove={playlist.removeSongs}
          accentColor={accentColor}
          onAddFiles={handleFileChange}
          onAddToPlaylist={handleOpenAddToPlaylist}
        />
      </div>
    </div>
  );

  const lyricsVersion = currentSong?.lyrics ? currentSong.lyrics.length : 0;
  const lyricsKey = currentSong ? `${currentSong.id}-${lyricsVersion}` : "no-song";

  const lyricsSection = (
    <div className="w-full h-full relative z-20 flex flex-col justify-center px-4 lg:pl-12">
      <LyricsView
        key={lyricsKey}
        lyrics={currentSong?.lyrics || []}
        audioRef={audioRef}
        isPlaying={playState === PlayState.PLAYING}
        currentTime={currentTime}
        onSeekRequest={handleSeek}
        matchStatus={matchStatus}
      />
    </div>
  );

  const fallbackWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const effectivePaneWidth = paneWidth || fallbackWidth;
  const baseOffset = activePanel === "lyrics" ? -effectivePaneWidth : 0;
  const mobileTranslate = baseOffset + dragOffsetX;

  return (
    <div
      className="relative w-full h-screen flex flex-col overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <FluidBackground
        key={isMobileLayout ? "mobile" : "desktop"}
        colors={currentSong?.colors || []}
        coverUrl={currentSong?.coverUrl}
        isPlaying={playState === PlayState.PLAYING}
        isMobileLayout={isMobileLayout}
        visualizerMode={visualizerMode}
      />

      <audio
        ref={audioRef}
        src={resolvedAudioSrc ?? currentSong?.fileUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        crossOrigin="anonymous"
      />

      <KeyboardShortcuts
        isPlaying={playState === PlayState.PLAYING}
        onPlayPause={togglePlay}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onVolumeChange={setVolume}
        onToggleMode={toggleMode}
        onTogglePlaylist={() => setShowPlaylist((prev) => !prev)}
        speed={player.speed}
        onSpeedChange={player.setSpeed}
        onToggleVolumeDialog={() => setShowVolumePopup((prev) => !prev)}
        onToggleSpeedDialog={() => setShowSettingsPopup((prev) => !prev)}
      />

      <MediaSessionController
        currentSong={currentSong ?? null}
        playState={playState}
        currentTime={currentTime}
        duration={duration}
        playbackRate={player.speed}
        onPlay={play}
        onPause={pause}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={handleSeek}
      />

      {/* View Switcher */}
      {currentView === "home" ? (
        <>
          {/* Home View rendered with absolute positioning or standard flow */}
          {/* TopBar is inside HomeView? No, TopBar is global or view specific. 
                HomeView has its own header. TopBar in App was fixed. 
                Let's use TopBar everywhere for consistency or let HomeView handle it? 
                The design showed HomeView has a "Welcome" header. 
                Existing TopBar has Import/Search. 
                Let's Render TopBar globally but transparently? 
                Or let Views handle their own headers. 
                HomeView has a custom header. 
                ImmersivePlayer needs TopBar. 
            */}
          <div className="flex-1 w-full h-full overflow-hidden relative z-20">
            <TopBar
              onFilesSelected={handleFileChange}
              onSearchClick={() => setShowSearch(true)}
              onLogoClick={navigateToHome} // Stay on home or refresh
            />
            <div className="pt-14 h-full">
              <div className="pt-14 h-full">
                <HomeView
                  onNavigateToPlayer={navigateToPlayer}
                  onPlayPlaylist={(songs, startIndex) => {
                    // Replace queue and play
                    playlist.setQueue(songs);
                    playlist.setOriginalQueue(songs);
                    setTimeout(() => playIndex(startIndex), 0);
                  }}
                  isPlaying={playState === PlayState.PLAYING}
                  currentSong={currentSong}
                  greeting="Welcome, Max"
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <ImmersivePlayer
          currentSong={currentSong}
          playState={playState}
          currentTime={currentTime}
          duration={duration}
          playMode={playMode}
          queue={playlist.queue}
          audioRef={audioRef}
          togglePlay={togglePlay}
          toggleMode={toggleMode}
          handleSeek={handleSeek}
          playNext={playNext}
          playPrev={playPrev}
          playIndex={playIndex}
          removeSongs={playlist.removeSongs}
          volume={volume}
          setVolume={setVolume}
          speed={player.speed}
          setSpeed={player.setSpeed}
          preservesPitch={player.preservesPitch}
          togglePreservesPitch={player.togglePreservesPitch}
          accentColor={accentColor}
          isBuffering={isBuffering}
          bufferProgress={bufferProgress}
          matchStatus={matchStatus}
          isMobileLayout={isMobileLayout}
          showPlaylist={showPlaylist}
          setShowPlaylist={setShowPlaylist}
          visualizerMode={visualizerMode}
          onToggleVisualizerMode={() => setVisualizerMode(prev => prev === 'fluid' ? 'gradient' : 'fluid')}
          showVolumePopup={showVolumePopup}
          setShowVolumePopup={setShowVolumePopup}
          showSettingsPopup={showSettingsPopup}
          setShowSettingsPopup={setShowSettingsPopup}
          onSearchClick={() => setShowSearch(true)}
          onFilesSelected={handleFileChange}
          onImportUrl={handleImportUrl}
          onNavigateHome={navigateToHome}
          onAddToPlaylist={handleOpenAddToPlaylist}
        />
      )}

      {/* Add To Playlist Dialog */}
      <AddToPlaylistDialog
        isOpen={showAddToPlaylistDialog}
        onClose={() => setShowAddToPlaylistDialog(false)}
        songsToAdd={songsToAdd}
        onSuccess={() => {
          setSongsToAdd([]);
          // We could show a toast here
          toast.success("Added to playlist");
        }}
      />


      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <CloudDownloadIcon className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Drop to Import
          </h2>
          <p className="text-white/60 text-lg mt-2">
            Add music files or lyrics
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
