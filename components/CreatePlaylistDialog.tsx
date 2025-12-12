
import React, { useState, useRef, useEffect } from 'react';

interface CreatePlaylistDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}

const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({
    isOpen,
    onClose,
    onCreate
}) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleCreate = () => {
        if (name.trim()) {
            onCreate(name.trim());
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreate();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-white mb-2">New Playlist</h3>
                <p className="text-white/40 text-sm mb-6">Give your playlist a name.</p>

                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Playlist Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all mb-6"
                />

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="px-6 py-2 bg-white text-black rounded-full font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePlaylistDialog;
