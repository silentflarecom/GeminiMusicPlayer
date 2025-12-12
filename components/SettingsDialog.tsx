
import React, { useState } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { SettingsIcon, SparklesIcon, InfoIcon, GithubIcon, VolumeHighIcon } from './Icons';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    visualizerMode: 'fluid' | 'gradient';
    onToggleVisualizerMode: () => void;
    volume: number;
    onVolumeChange: (vol: number) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen,
    onClose,
    visualizerMode,
    onToggleVisualizerMode,
    volume,
    onVolumeChange
}) => {
    const transitions = useTransition(isOpen, {
        from: { opacity: 0, transform: 'scale(0.95)' },
        enter: { opacity: 1, transform: 'scale(1)' },
        leave: { opacity: 0, transform: 'scale(0.95)' },
        config: { tension: 300, friction: 25 }
    });

    const [activeTab, setActiveTab] = useState<'appearance' | 'about'>('appearance');

    if (!isOpen && !transitions((s, i) => i)) return null; // Safe check or just remove based on hook behavior. 
    // Actually, useTransition handles mounting/unmounting. We don't need this check usually if we always render the result.
    // However, to avoid rendering null excessively...
    // Let's just remove the check and rely on the transition function.

    return transitions((style, item) => item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <animated.div
                style={style}
                className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-purple-400" />
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 border-b border-white/5 bg-black/20">
                    <button
                        onClick={() => setActiveTab('appearance')}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'appearance' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        Appearance
                    </button>
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'about' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        About
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">Visual Options</h3>

                                {/* Visualizer Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <SparklesIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Visualizer Mode</p>
                                            <p className="text-white/50 text-xs">{visualizerMode === 'fluid' ? 'Fluid Simulation' : 'Gradient Flow'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onToggleVisualizerMode}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${visualizerMode === 'fluid'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-blue-500 text-white'}`}
                                    >
                                        {visualizerMode === 'fluid' ? 'Fluid' : 'Gradient'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="space-y-6 text-center py-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <span className="text-3xl font-bold text-white">A</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Aura Music</h3>
                                <p className="text-white/40">Version 1.0.0 (Beta)</p>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex justify-center gap-4">
                                <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/80">
                                    <GithubIcon className="w-4 h-4" />
                                    GitHub
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </animated.div>
        </div>
    ));
};

export default SettingsDialog;
