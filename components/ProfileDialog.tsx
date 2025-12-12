
import React, { useRef, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { CheckIcon, UserIcon } from './Icons';

interface ProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onSave: (updates: Partial<UserProfile>) => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({
    isOpen,
    onClose,
    profile,
    onSave,
}) => {
    const [username, setUsername] = useState(profile.username);
    const [bio, setBio] = useState(profile.bio || '');
    const [avatar, setAvatar] = useState<string | undefined>(profile.avatarUrl);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setUsername(profile.username);
            setBio(profile.bio || '');
            setAvatar(profile.avatarUrl);
        }
    }, [isOpen, profile]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onSave({ username, bio, avatarUrl: avatar });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                className="w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            >
                <div className="p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>

                    <div className="flex flex-col items-center mb-8 gap-4">
                        <div
                            className="group relative w-24 h-24 rounded-full bg-white/10 overflow-hidden cursor-pointer ring-4 ring-transparent hover:ring-white/10 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatar ? (
                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/50">
                                    <UserIcon className="w-10 h-10" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-xs font-medium">Change</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Nickname</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                                placeholder="Your name"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Bio / Mood</label>
                            <input
                                type="text"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                                placeholder="How are you feeling?"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <CheckIcon className="w-4 h-4" />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDialog;
