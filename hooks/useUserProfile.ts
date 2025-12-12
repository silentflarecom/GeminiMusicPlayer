
import { useState, useEffect } from 'react';
import { UserProfile } from '../types';

const DEFAULT_PROFILE: UserProfile = {
    username: 'Max', // Default name as per earlier interactions
    bio: 'Music Lover',
};

const STORAGE_KEY = 'aura_user_profile';

export const useUserProfile = () => {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
    const [loading, setLoading] = useState(true);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setProfile(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load user profile', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => {
            const newProfile = { ...prev, ...updates };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
            } catch (e) {
                console.error('Failed to save user profile', e);
                // If quota exceeded, maybe show toast? For now just log.
            }
            return newProfile;
        });
    };

    return {
        profile,
        loading,
        updateProfile
    };
};
