/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getToken, logout } from '@/lib/auth';
import { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';
import { API_URL } from '@/lib/config';

export default function Header() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [user, setUser] = useState<{ username: string; avatarUrl?: string } | null>(null);

    useEffect(() => {
        const token = getToken();

        setIsAuth(!!token);
        // Fetch user info if authenticated
        if (token) {
            fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(d => setUser(d.data))
                .catch(console.error);
        }
    }, []);

    const handleLogout = () => {
        logout();
        setIsAuth(false);
        setUser(null);
        router.push('/');
    };

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-slate-200 dark:border-[#343536] h-14">
            <nav className="container mx-auto px-4 h-full flex justify-between items-center gap-4">

                {/* 1. Logo & Badge Section */}
                <div className="flex items-center gap-4 min-w-fit">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="OPENHAVEN" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-lg font-logo text-slate-900 dark:text-white hidden md:block tracking-wider">OPENHAVEN</span>
                    </Link>

                    {/* The "Initiative" Badge */}
                    <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full border border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-900/50">
                        <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                            Initiative of Open Dev Society
                        </span>
                    </div>
                </div>

                {/* 2. Center Search Bar */}
                <div className="flex-1 max-w-2xl px-4">
                    <SearchBar />
                </div>

                {/* 3. Right Actions */}
                <div className="flex gap-3 items-center min-w-fit">
                    {/* Action Icons (Hidden on mobile) */}
                    <div className="hidden md:flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3 mr-1">
                        <ThemeToggle />
                        <NotificationDropdown />
                        <Link
                            href="/snippet/create"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-full text-sm font-bold transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Create
                        </Link>
                    </div>

                    {isAuth ? (
                        <div className="relative group">
                            <button className="flex items-center gap-2 p-1 pr-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                <div className="relative">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-sm object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-sm bg-indigo-500 flex items-center justify-center text-white font-bold">
                                            {user?.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white dark:ring-[#1A1A1B]" />
                                </div>

                                <span className="text-sm font-medium hidden lg:block text-slate-700 dark:text-slate-200">
                                    {user?.username}
                                </span>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A1A1B] rounded-md shadow-lg py-1 border border-slate-200 dark:border-slate-700 hidden group-hover:block hover:block">
                                <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Profile</Link>
                                <Link href="/settings" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Settings</Link>
                                <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Log Out</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login" className="px-6 py-1.5 rounded-full text-sm font-bold bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                                Log In
                            </Link>
                            <Link href="/signup" className="px-6 py-1.5 rounded-full text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}

