'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import Link from 'next/link';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
}

export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        fetch('http://localhost:3002/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setUser(data.data);
                    setBio(data.data.bio || '');
                    setAvatarUrl(data.data.avatarUrl || '');
                } else {
                    router.push('/login');
                }
            })
            .catch(() => router.push('/login'))
            .finally(() => setLoading(false));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setSaving(true);

        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch('http://localhost:3002/api/v1/users/me/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bio, avatarUrl: avatarUrl || null }),
            });

            const data = await res.json();

            if (data.status === 'success') {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setTimeout(() => {
                    router.push(`/user/${user?.username}`);
                }, 1000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Edit Profile</h1>
                <Link
                    href={`/user/${user?.username}`}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                    Cancel
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Preview */}
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                                    {user?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Avatar URL
                            </label>
                            <input
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-slate-500">Enter a URL to your profile picture</p>
                        </div>
                    </div>

                    {/* Username (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            value={user?.username || ''}
                            disabled
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-slate-500">Username cannot be changed</p>
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a bit about yourself..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                        <p className="mt-1 text-xs text-slate-500 text-right">{bio.length}/500</p>
                    </div>

                    {/* Message */}
                    {message.text && (
                        <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href={`/user/${user?.username}`}
                            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
