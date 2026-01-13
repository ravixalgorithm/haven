'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import Link from 'next/link';

// Icons (inline SVGs to avoid dependency check issues if lucide isn't installed, though it likely is)
const UserIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const KeyIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.5 17.5 9.5 19.5l-3.5-3.5 2-2 3.5 3.5L14.257 11.257A6 6 0 1120 13a6 6 0 012-2z" /></svg>
);
const BellIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
);
const MoonIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, setTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch user for Profile/Account tabs
    useEffect(() => {
        const token = getToken();
        if (!token) return; // Middleware might handle redirect, but safe to check

        setLoading(true);
        fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setUser(data.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: UserIcon },
        { id: 'account', label: 'Account', icon: KeyIcon },
        { id: 'notifications', label: 'Notifications', icon: BellIcon },
        { id: 'appearance', label: 'Appearance', icon: MoonIcon },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 relative">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-display">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your preferences and account details.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-72 flex-shrink-0">
                    <nav className="space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area - Glass Card */}
                <div className="flex-1 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Public Profile</h2>
                                    <p className="text-sm text-slate-500 mt-1">This is how others see you on the site.</p>
                                </div>
                                <Link
                                    href="/profile/edit"
                                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
                                >
                                    Edit Profile
                                </Link>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden self-start">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-300">
                                            {user?.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">@{user?.username}</h3>
                                    <p className="text-slate-500">{user?.email}</p>
                                    <div className="flex gap-2 mt-3">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-mono rounded text-slate-600 dark:text-slate-400">
                                            Developer
                                        </span>
                                        {user?.snippetCount > 0 && (
                                            <span className="px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-xs font-medium rounded text-teal-600 dark:text-teal-400">
                                                {user.snippetCount} Snippets
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Bio</label>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                                        {user?.bio || "No bio set yet."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="border-b border-slate-200 dark:border-white/10 pb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Security</h2>
                                <p className="text-sm text-slate-500 mt-1">Manage your login methods and account data.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">GitHub</p>
                                            <p className="text-xs text-slate-500">{user?.githubId ? 'Connected' : 'Not connected'}</p>
                                        </div>
                                    </div>
                                    <button disabled className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg cursor-not-allowed">
                                        {user?.githubId ? 'Connected' : 'Connect'}
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">Email Address</p>
                                            <p className="text-xs text-slate-500">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
                                <h3 className="text-red-500 font-bold mb-4">Danger Zone</h3>
                                <div className="p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-red-700 dark:text-red-400">Delete Account</p>
                                        <p className="text-xs text-red-600/70 dark:text-red-400/70">Permanently remove your account and all snippets.</p>
                                    </div>
                                    <button
                                        onClick={() => alert('Please contact support to delete your account.')}
                                        className="px-4 py-2 bg-white dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPEARANCE TAB */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="border-b border-slate-200 dark:border-white/10 pb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appearance</h2>
                                <p className="text-sm text-slate-500 mt-1">Customize the look and feel of the interface.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {['light', 'dark', 'system'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`group relative p-4 rounded-xl border-2 transition-all duration-200 ${theme === t
                                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                                : 'border-slate-200 dark:border-white/10 hover:border-teal-300 dark:hover:border-teal-700'
                                            }`}
                                    >
                                        <div className={`aspect-video rounded-lg mb-3 ${t === 'light' ? 'bg-slate-100' : t === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-100 to-slate-900'
                                            } border border-slate-200 dark:border-white/5`} />
                                        <p className={`text-sm font-medium capitalize ${theme === t ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'
                                            }`}>
                                            {t}
                                        </p>
                                        {theme === t && (
                                            <div className="absolute top-3 right-3 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center text-white">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="border-b border-slate-200 dark:border-white/10 pb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
                                <p className="text-sm text-slate-500 mt-1">Control what you want to hear about.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: 'New Followers', desc: 'When someone follows you', default: true },
                                    { title: 'Snippet Upvotes', desc: 'When your code gets some love', default: true },
                                    { title: 'Comments', desc: 'When someone replies to your snippet', default: true },
                                    { title: 'Product Updates', desc: 'News about OpenHaven features', default: false },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
