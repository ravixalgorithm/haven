'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getToken } from '@/lib/auth';
import { useSocket } from '@/context/SocketContext';
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

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/notifications`, {
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
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.status === 'success') {
                setUnreadCount(data.data.count);
            }
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    }, []);

    const markAllAsRead = async () => {
        const token = getToken();
        if (!token) return;

        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    const { socket, isConnected } = useSocket();

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        fetchUnreadCount();
    }, [fetchUnreadCount]);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNotification = (data: any) => {
            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [data, ...prev]);
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, isConnected]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'upvote':
                return <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4L3 15h6v5h6v-5h6z" /></svg>;
            case 'comment':
                return <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
            case 'follow':
                return <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
            default:
                return null;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Notifications"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1A1A1B] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-teal-500 hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-slate-500">
                                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-2" />
                                <p className="text-sm">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">
                                <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={notif.snippet ? `/snippet/${notif.snippet.slug}` : `/user/${notif.actor.username}`}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!notif.read ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                        {notif.actor.avatarUrl ? (
                                            <img src={notif.actor.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            notif.actor.username[0].toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-800 dark:text-slate-200">
                                            <span className="font-bold">{notif.actor.username}</span>{' '}
                                            <span className="text-slate-600 dark:text-slate-400">{notif.message}</span>
                                        </p>
                                        {notif.snippet && (
                                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                                &ldquo;{notif.snippet.title}&rdquo;
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                            {getIcon(notif.type)}
                                            {formatDistanceToNow(new Date(notif.createdAt))} ago
                                        </p>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </Link>
                            ))
                        )}
                    </div>

                    <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block text-center text-sm text-teal-500 hover:underline font-medium"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

