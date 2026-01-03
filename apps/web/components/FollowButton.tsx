'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';

interface FollowButtonProps {
    username: string;
    initialIsFollowing?: boolean; // Optional initial state
    onToggle?: (isFollowing: boolean) => void;
    className?: string;
}

export default function FollowButton({ username, initialIsFollowing, onToggle, className = '' }: FollowButtonProps) {
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false); // To prevent flashing if we check status

    // If initialIsFollowing is explicitly provided, we trust it.
    // Otherwise, or if we want to confirm, we check. 
    // For now, if provided, we skip check to save bandwidth. 
    // EXCEPT if it's undefined, we MUST check.

    useEffect(() => {
        const checkStatus = async () => {
            const token = getToken();
            if (!token) {
                setChecked(true);
                return;
            }

            if (initialIsFollowing !== undefined) {
                setIsFollowing(initialIsFollowing);
                setChecked(true);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/users/${username}/is-following`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsFollowing(data.data.isFollowing);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setChecked(true);
            }
        };

        checkStatus();
    }, [username, initialIsFollowing]);

    const handleFollow = async () => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        if (loading) return;
        setLoading(true);

        // Optimistic update
        const newState = !isFollowing;
        setIsFollowing(newState);
        if (onToggle) onToggle(newState);

        try {
            const res = await fetch(`${API_URL}/users/${username}/follow`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Action failed');
            }
        } catch (err) {
            // Revert
            setIsFollowing(!newState);
            if (onToggle) onToggle(!newState);
            alert('Failed to follow/unfollow user');
        } finally {
            setLoading(false);
        }
    };

    if (!checked && initialIsFollowing === undefined) {
        return (
            <button className={`px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse text-transparent ${className}`}>
                Loading
            </button>
        );
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-6 py-2 rounded-full font-bold transition-all ${isFollowing
                ? 'bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                : 'bg-teal-500 text-white hover:bg-teal-600 border-2 border-transparent'
                } ${className}`}
        >
            {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </button>
    );
}
