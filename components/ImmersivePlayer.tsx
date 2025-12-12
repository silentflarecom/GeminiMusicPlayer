
import React, { useRef, useState, useEffect } from "react";
import Controls from "./Controls";
import LyricsView from "./LyricsView";
import PlaylistPanel from "./PlaylistPanel";
import TopBar from "./TopBar";
import { PlayState, Song, PlayMode } from "../types";
import { CloudDownloadIcon } from "./Icons";

interface ImmersivePlayerProps {
    // Data
    currentSong: Song | null;
    playState: PlayState;
    currentTime: number;
    duration: number;
    playMode: PlayMode;
    queue: Song[];

    // Audio Refs & Handlers
    audioRef: React.RefObject<HTMLAudioElement | null>;
    togglePlay: () => void;
    toggleMode: () => void;
    handleSeek: (time: number) => void;
    playNext: () => void;
    playPrev: () => void;
    playIndex: (index: number) => void;
    removeSongs: (ids: string[]) => void;

    // Settings & State
    volume: number;
    setVolume: (vol: number) => void;
    speed: number;
    setSpeed: (speed: number) => void;
    preservesPitch: boolean;
    togglePreservesPitch: () => void;
    accentColor?: string;
    isBuffering: boolean;
    bufferProgress: number;
    matchStatus: any; // Type match from usePlayer

    // UI State passed from App
    isMobileLayout: boolean;
    showPlaylist: boolean;
    setShowPlaylist: (show: boolean) => void;
    showVolumePopup: boolean;
    setShowVolumePopup: (show: boolean) => void;
    showSettingsPopup: boolean;
    setShowSettingsPopup: (show: boolean) => void;

    // Actions
    onSearchClick: () => void;
    onFilesSelected: (files: FileList) => void;
    onImportUrl: (url: string) => Promise<boolean>;

    // Navigation
    onNavigateHome: () => void;
    onAddToPlaylist: (songs: Song[]) => void;
    visualizerMode?: 'fluid' | 'gradient';
    onToggleVisualizerMode?: () => void;
    isLiked?: boolean;
    onToggleLike?: () => void;
}


const ImmersivePlayer: React.FC<ImmersivePlayerProps> = ({
    currentSong,
    playState,
    currentTime,
    duration,
    playMode,
    queue,
    audioRef,
    togglePlay,
    toggleMode,
    handleSeek,
    playNext,
    playPrev,
    playIndex,
    removeSongs,
    volume,
    setVolume,
    speed,
    setSpeed,
    preservesPitch,
    togglePreservesPitch,
    accentColor,
    isBuffering,
    bufferProgress,
    matchStatus,
    isMobileLayout,
    showPlaylist,
    setShowPlaylist,
    showVolumePopup,
    setShowVolumePopup,
    showSettingsPopup,
    setShowSettingsPopup,
    onSearchClick,
    onFilesSelected,
    onImportUrl,
    onNavigateHome,
    onAddToPlaylist,
    visualizerMode,
    onToggleVisualizerMode,
    isLiked,
    onToggleLike
}) => {
    // Local UI State for Mobile Gestures
    const [activePanel, setActivePanel] = useState<"controls" | "lyrics">("controls");
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [dragOffsetX, setDragOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const mobileViewportRef = useRef<HTMLDivElement>(null);
    const [paneWidth, setPaneWidth] = useState(0);

    // Sync pane width
    useEffect(() => {
        if (typeof window === "undefined") return;
        const updateWidth = () => setPaneWidth(window.innerWidth);
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    // Reset mobile state on layout change
    useEffect(() => {
        if (!isMobileLayout) {
            setActivePanel("controls");
            setTouchStartX(null);
            setDragOffsetX(0);
        }
    }, [isMobileLayout]);

    // Touch Handlers
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
        const limitedDelta = Math.max(Math.min(deltaX, containerWidth), -containerWidth);
        setDragOffsetX(limitedDelta);
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!isMobileLayout || touchStartX === null) return;
        const endX = event.changedTouches[0]?.clientX;

        if (endX === undefined) {
            // Cancel
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
        setTouchStartX(null);
        setDragOffsetX(0);
        setIsDragging(false);
    };

    const toggleIndicator = () => {
        setActivePanel((prev) => (prev === "controls" ? "lyrics" : "controls"));
    };

    // --- Sub-Components ---

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
                    speed={speed}
                    preservesPitch={preservesPitch}
                    onSpeedChange={setSpeed}
                    onTogglePreservesPitch={togglePreservesPitch}
                    coverUrl={currentSong?.coverUrl}
                    isBuffering={isBuffering}
                    bufferProgress={bufferProgress}
                    showVolumePopup={showVolumePopup}
                    setShowVolumePopup={setShowVolumePopup}
                    showSettingsPopup={showSettingsPopup}
                    setShowSettingsPopup={setShowSettingsPopup}
                    onAddToPlaylist={() => currentSong && onAddToPlaylist([currentSong])}
                    visualizerMode={visualizerMode}
                    onToggleVisualizerMode={onToggleVisualizerMode}
                    isLiked={isLiked}
                    onToggleLike={onToggleLike}
                />

                <PlaylistPanel
                    isOpen={showPlaylist}
                    onClose={() => setShowPlaylist(false)}
                    queue={queue}
                    currentSongId={currentSong?.id}
                    onPlay={playIndex}
                    onImport={onImportUrl}
                    onRemove={removeSongs}
                    accentColor={accentColor}
                    onAddFiles={onFilesSelected}
                    onAddToPlaylist={onAddToPlaylist}
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

    const effectivePaneWidth = paneWidth || (typeof window !== 'undefined' ? window.innerWidth : 0);
    const baseOffset = activePanel === "lyrics" ? -effectivePaneWidth : 0;
    const mobileTranslate = baseOffset + dragOffsetX;

    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Local TopBar for Immersive View */}
            <TopBar
                onFilesSelected={onFilesSelected}
                onSearchClick={onSearchClick}
                onLogoClick={onNavigateHome}
                onHomeClick={onNavigateHome} // New prop for explicit button
            />
            {/* We need to modify TopBar to accept onLogoClick if we want that, 
           OR we just assume TopBar is generic. 
           Wait, TopBar in App.tsx was fixed. 
           I should overlay a "Back" button or modify TopBar.
           For now, let's assume TopBar is fine, but maybe add a Home button?
           The User requested a Home Page.
           I'll add a floating "Home" button or modify TopBar later.
           Actually, let's wrap TopBar with a click handler on the logo area if possible? 
           The TopBar component has `AuraLogo` inside.
           I'll just add a "Home" button to the TopBar or rely on keyboard shortcuts for now?
           No, UI needs to be explicit.
           
           I will add a `HomeButton` to TopBar props in a later step if needed.
           For now, I'll add a floating "Home" button in the top left if TopBar doesn't support it.
           But TopBar occupies that space.
           
           Let's just use a floating button for "Go Home" temporarily or assume TopBar will be updated.
       */}

            {/* Main Split */}
            {isMobileLayout ? (
                <div className="flex-1 relative w-full h-full">
                    <div
                        ref={mobileViewportRef}
                        className="w-full h-full overflow-hidden"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                    >
                        <div
                            className={`flex h-full ${isDragging ? "transition-none" : "transition-transform duration-300"}`}
                            style={{
                                width: `${effectivePaneWidth * 2}px`,
                                transform: `translateX(${mobileTranslate}px)`,
                            }}
                        >
                            <div className="flex-none h-full" style={{ width: effectivePaneWidth }}>
                                {controlsSection}
                            </div>
                            <div className="flex-none h-full" style={{ width: effectivePaneWidth }}>
                                {lyricsSection}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Page Indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                        <button
                            type="button"
                            onClick={toggleIndicator}
                            className="relative flex h-4 w-28 items-center justify-center rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 transition-transform duration-200 active:scale-105"
                        >
                            <span
                                className={`absolute inset-0 rounded-full bg-white/25 backdrop-blur-[30px] transition-all duration-200 ${activePanel === "controls" ? "opacity-90 left-0 w-1/2" : "opacity-90 left-1/2 w-1/2"}`}
                                style={{
                                    transform: `translateX(${isDragging ? dragOffsetX * 0.04 : 0}px)`
                                }}
                            />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 grid lg:grid-cols-2 w-full h-full pt-14">
                    {controlsSection}
                    {lyricsSection}
                </div>
            )}
        </div>
    );
};

export default ImmersivePlayer;
