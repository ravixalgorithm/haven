'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

interface User {
    username: string;
    avatarUrl?: string; // Optional
    bio?: string;
}

interface UserListModalProps {
    type: 'followers' | 'following';
    username: string; // Target user
    onClose: () => void;
}

export default function UserListModal({ type, username, onClose }: UserListModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/users/${username}/${type}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // API returns { followers: [] } or { following: [] }
                    // We need to access the correct key
                    setUsers(data.data[type] || []);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [type, username]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <h3 className="font-bold text-lg capitalize text-slate-900 dark:text-white">
                        {type}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-4 flex-1">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No {type} yet.
                        </div>
                    ) : (
                        users.map((u, i) => (
                            <Link
                                key={u.username + i}
                                href={`/user/${u.username}`}
                                className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group"
                                onClick={onClose}
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                    {u.avatarUrl ? (
                                        <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 transition-colors">
                                        {u.username}
                                    </div>
                                    {u.bio && (
                                        <div className="text-xs text-slate-500 truncate">
                                            {u.bio}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
