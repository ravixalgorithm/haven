'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';

interface Notification {
    id: string;
    type: 'upvote' | 'comment' | 'follow';
    message: string;
    snippet?: { id: string; title: string; slug: string } | null;
    actor: { id: string; username: string; avatarUrl?: string | null };
    createdAt: string;
    read: boolean;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/notifications?limit=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.status === 'success') {
                setNotifications(data.data.notifications);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const markAllAsRead = async () => {
        const token = getToken();
        if (!token) return;

        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'upvote':
                return (
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4L3 15h6v5h6v-5h6z" />
                        </svg>
                    </div>
                );
            case 'comment':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                    </div>
                );
            case 'follow':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                <div className="flex items-center gap-3">
                    {notifications.some((n) => !n.read) && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-slate-500 hover:text-teal-500 transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                    {/* Settings icon */}
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No notifications yet</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                            When someone interacts with your snippets, you&apos;ll see it here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {notifications.map((notif) => (
                            <Link
                                key={notif.id}
                                href={notif.snippet ? `/snippet/${notif.snippet.slug}` : `/user/${notif.actor.username}`}
                                className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.read ? 'bg-teal-50/30 dark:bg-teal-900/10' : ''}`}
                            >
                                {/* Notification Type Icon */}
                                {getIcon(notif.type)}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-800 dark:text-slate-200">
                                        <span className="font-semibold">u/{notif.actor.username}</span>{' '}
                                        <span className="text-slate-600 dark:text-slate-400">{notif.message}</span>
                                    </p>
                                    {notif.snippet && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {notif.snippet.title}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {formatDistanceToNow(new Date(notif.createdAt))} ago
                                    </p>
                                </div>

                                {/* Unread Indicator */}
                                {!notif.read && (
                                    <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2" />
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
