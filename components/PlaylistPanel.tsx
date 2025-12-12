import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { Song } from '../types';
import { CheckIcon, PlusIcon, QueueIcon, TrashIcon, SelectAllIcon, CloudDownloadIcon } from './Icons';
import { useKeyboardScope } from '../hooks/useKeyboardScope';
import ImportMusicDialog from './ImportMusicDialog';
import SmartImage from './SmartImage';

const IOS_SCROLLBAR_STYLES = `
  .playlist-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.65) rgba(255, 255, 255, 0.02);
  }
  .playlist-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .playlist-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(28px);
  }
  .playlist-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.5));
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(24px);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  }
  .playlist-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.72));
  }
`;

interface PlaylistPanelProps {
    isOpen: boolean;
    onClose: () => void;
    queue: Song[];
    currentSongId?: string;
    onPlay: (index: number) => void;
    onImport: (url: string) => Promise<boolean>;
    onRemove: (ids: string[]) => void;
    accentColor: string;
    onAddFiles?: (files: FileList) => void;
}

const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
    isOpen,
    onClose,
    queue,
    currentSongId,
    onPlay,
    onImport,
    onRemove,
    accentColor,
    onAddFiles
}) => {
    // State to toggle the add options menu
    const [showAddMenu, setShowAddMenu] = useState(false);
    
    // State to control the existing "Import via URL" dialog
    const [isImportingUrl, setIsImportingUrl] = useState(false);
    
    // To reference the file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [visible, setVisible] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const panelRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Virtualization Constants
    const ITEM_HEIGHT = 74; // Approx height of each item (including margin)
    const OVERSCAN = 5;

    // ESC key support using keyboard scope
    useKeyboardScope(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showAddMenu) {
                    e.preventDefault();
                    setShowAddMenu(false);
                    return true;
                }
                if (isImportingUrl) {
                     // Let the dialog handle its own close, or handle it here if needed
                     // But usually dialogs have their own escape handlers.
                     // Assuming ImportMusicDialog handles it.
                     return false; 
                }
                e.preventDefault();
                onClose();
                return true; // Claim the event
            }
            return false;
        },
        100, // High priority
        isOpen, // Only active when panel is open
    );

    // Handle animation visibility with react-spring
    const transitions = useTransition(isOpen, {
        from: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
        enter: { opacity: 1, transform: 'translateY(0px) scale(1)' },
        leave: { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
        config: { tension: 280, friction: 24 }, // Rebound feel
        onRest: () => {
            if (!isOpen) {
                setIsEditing(false);
                setShowAddMenu(false);
                setSelectedIds(new Set());
            }
        }
    });

    // Scroll to current song when opening
    useEffect(() => {
        if (isOpen && listRef.current) {
            const index = queue.findIndex(s => s.id === currentSongId);
            if (index !== -1) {
                const containerHeight = listRef.current.clientHeight;
                const targetScroll = (index * ITEM_HEIGHT) - (containerHeight / 2) + (ITEM_HEIGHT / 2);
                listRef.current.scrollTop = targetScroll;
                setScrollTop(targetScroll);
            } else {
                listRef.current.scrollTop = 0;
                setScrollTop(0);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !isImportingUrl && panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, isImportingUrl]);

    const handleImportUrl = async (url: string) => {
        const success = await onImport(url);
        if (success) {
            setIsImportingUrl(false);
        }
        return success;
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // We use the existing logic in App.tsx -> usePlaylist which listens to a file input
            // But here we need to manually trigger the addLocalFiles logic.
            // Since onImport only takes a URL string, we need a new prop or 
            // hack it by triggering the main input in TopBar? 
            // Better: Dispatch a custom event or reuse the logic if accessible.
            // Wait, TopBar has `onFilesSelected` passed from App.
            // PlaylistPanel only has `onImport` (string).
            // We need to pass `onFilesSelected` to PlaylistPanel or similar.
            
            // To avoid changing the interface too much, let's see if we can get `addLocalFiles` passed down.
            // Since I cannot change App.tsx easily without context, I will assume I can modify App.tsx 
            // to pass the handler or use a global event.
            // Actually, I should probably check App.tsx to see if I can pass `handleFileChange` down to PlaylistPanel.
        }
    };
    
    // NOTE: In the previous turn I just read PlaylistPanel.tsx. I need to make sure I update App.tsx to pass the handler.
    // However, I can't do that in this single write_file action.
    // I will write this file assuming a new prop `onAddFiles` exists, and then update App.tsx in the next step.
    
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleDelete = () => {
        onRemove(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsEditing(false);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === queue.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(queue.map(song => song.id)));
        }
    };

    // Virtual List Logic
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const { virtualItems, totalHeight, startOffset } = useMemo(() => {
        const totalHeight = queue.length * ITEM_HEIGHT;
        const containerHeight = 600; // Approx max height

        let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
        let endIndex = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT);

        startIndex = Math.max(0, startIndex - OVERSCAN);
        endIndex = Math.min(queue.length, endIndex + OVERSCAN);

        const virtualItems = [];
        for (let i = startIndex; i < endIndex; i++) {
            virtualItems.push({
                ...queue[i],
                index: i
            });
        }

        return {
            virtualItems,
            totalHeight,
            startOffset: startIndex * ITEM_HEIGHT
        };
    }, [queue, scrollTop]);

    return (
        <>
            <style>{IOS_SCROLLBAR_STYLES}</style>
            {transitions((style, item) => item && (
                <animated.div
                    ref={panelRef}
                    style={{ ...style, maxHeight: '60vh' }}
                    className={`
                        absolute bottom-24 -right-8 z-50
                        w-[340px] 
                        bg-black/10 backdrop-blur-[100px] saturate-150
                        rounded-[32px] 
                        shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
                        border border-white/5
                        flex flex-col overflow-hidden
                        origin-bottom-right
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* iOS 18 Style Header */}
                    <div className="px-5 pt-5 pb-3 shrink-0 flex items-center justify-between bg-transparent border-b border-white/5">
                        <div className="flex flex-col">
                            <h3 className="text-white text-lg font-bold leading-none tracking-tight">Playing Next</h3>
                            <span className="text-white/40 text-xs font-medium mt-1">{queue.length} Songs</span>
                        </div>

                        <div className="flex items-center gap-2 relative">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSelectAll}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedIds.size === queue.length && queue.length > 0 ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                                        title="Select All"
                                    >
                                        <SelectAllIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedIds.size > 0 ? 'text-red-400 hover:bg-red-500/10' : 'text-white/20 cursor-not-allowed'}`}
                                        title="Delete Selected"
                                        disabled={selectedIds.size === 0}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                                        style={{ color: accentColor }}
                                        title="Done"
                                    >
                                        <CheckIcon className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowAddMenu(!showAddMenu)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showAddMenu ? 'text-white bg-white/20' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                                        title="Add Music"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                    
                                    {/* Add Options Menu */}
                                    {showAddMenu && (
                                        <div className="absolute top-10 right-0 w-48 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <button
                                                onClick={() => {
                                                    setShowAddMenu(false);
                                                    setIsImportingUrl(true);
                                                }}
                                                className="w-full text-left px-4 py-3 text-[14px] text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                                            >
                                                <CloudDownloadIcon className="w-4 h-4 text-blue-400" />
                                                <span>From URL</span>
                                            </button>
                                            <div className="h-[1px] bg-white/5 mx-2"></div>
                                            <button
                                                onClick={() => {
                                                    setShowAddMenu(false);
                                                    // Trigger hidden file input
                                                    // We need to use a DOM id or ref. Since ref is inside this component, we can use it.
                                                    // But we need to make sure the input exists.
                                                    const input = document.getElementById('playlist-folder-input');
                                                    if (input) input.click();
                                                }}
                                                className="w-full text-left px-4 py-3 text-[14px] text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
                                                </svg>
                                                <span>Local Folder</span>
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-white/50 hover:text-white hover:bg-white/10"
                                        title="Edit List"
                                    >
                                        <QueueIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Scrollable List with Virtualization */}
                    <div
                        ref={listRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto playlist-scrollbar px-2 py-2 relative"
                    >
                        {queue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-white/30 space-y-2">
                                <p className="text-xs font-medium">Queue is empty</p>
                            </div>
                        ) : (
                            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                                {virtualItems.map((song) => {
                                    const index = song.index;
                                    const isCurrent = song.id === currentSongId;
                                    const isSelected = selectedIds.has(song.id);

                                    return (
                                        <div
                                            key={`${song.id}-${index}`}
                                            onClick={() => {
                                                if (isEditing) toggleSelection(song.id);
                                                else onPlay(index);
                                            }}
                                            className={`
                                    absolute left-0 right-0 h-[66px]
                                    group flex items-center gap-3 p-2 mx-2 rounded-2xl cursor-pointer transition-all duration-200
                                    ${isEditing ? 'hover:bg-white/10' : isCurrent ? 'bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}
                                `}
                                            style={{
                                                top: `${index * ITEM_HEIGHT}px`,
                                                // Adjust height within the slot if needed, ITEM_HEIGHT includes gap
                                                height: '66px'
                                            }}
                                        >
                                            {/* Edit Mode Checkbox */}
                                            {isEditing && (
                                                <div className={`
                                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ml-1
                                        ${isSelected ? 'border-transparent' : 'border-white/20 group-hover:border-white/40'}
                                    `}
                                                    style={{ backgroundColor: isSelected ? accentColor : 'transparent' }}
                                                >
                                                    {isSelected && (
                                                        <CheckIcon className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Cover & Indicator */}
                                            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 border border-white/5 shadow-sm">
                                                {song.coverUrl ? (
                                                    <SmartImage
                                                        src={song.coverUrl}
                                                        alt={song.title}
                                                        containerClassName="w-full h-full"
                                                        imgClassName={`w-full h-full object-cover transition-opacity duration-300 ${isCurrent && !isEditing ? 'opacity-40 blur-[1px]' : ''}`}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white/20 text-[10px]">♪</div>
                                               )}

                                                {/* Redesigned Now Playing Indicator (Equalizer) */}
                                                {isCurrent && !isEditing && (
                                                    <div className="absolute inset-0 flex items-center justify-center gap-[3px]">
                                                        <div className="w-[3px] bg-current rounded-full animate-[eq-bounce_1s_ease-in-out_infinite]" style={{ height: '12px', color: accentColor }}></div>
                                                        <div className="w-[3px] bg-current rounded-full animate-[eq-bounce_1s_ease-in-out_infinite_0.2s]" style={{ height: '20px', color: accentColor }}></div>
                                                        <div className="w-[3px] bg-current rounded-full animate-[eq-bounce_1s_ease-in-out_infinite_0.4s]" style={{ height: '15px', color: accentColor }}></div>
                                                        <style>{`
                                                @keyframes eq-bounce {
                                                    0%, 100% { transform: scaleY(0.4); opacity: 0.8; }
                                                    50% { transform: scaleY(1.0); opacity: 1; }
                                                }
                                            `}</style>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                                <div className={`text-[15px] font-semibold truncate leading-tight transition-colors duration-300`}
                                                    style={{ color: isCurrent ? accentColor : 'rgba(255,255,255,0.9)' }}>
                                                    {song.title}
                                                </div>
                                                <div className="text-[13px] text-white/50 truncate font-medium">
                                                    {song.artist}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </animated.div>
            ))}

            {/* Hidden Input for Folder Selection */}
            <input
                type="file"
                id="playlist-folder-input"
                className="hidden"
                multiple
                {...({ webkitdirectory: "", directory: "" } as any)}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0 && onAddFiles) {
                        onAddFiles(e.target.files);
                    }
                    e.target.value = ""; // Reset value to allow re-selection
                }}
            />

            {/* Import Music Dialog */}
            <ImportMusicDialog
                isOpen={isImportingUrl}
                onClose={() => setIsImportingUrl(false)}
                onImport={handleImportUrl}
            />
        </>
    );
};

export default PlaylistPanel;