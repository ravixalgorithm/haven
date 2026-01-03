'use client';

import { useState } from 'react';
import { getToken } from '@/lib/auth';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {[
                            { id: 'profile', label: 'Profile' },
                            { id: 'account', label: 'Account' },
                            { id: 'notifications', label: 'Notifications' },
                            { id: 'appearance', label: 'Appearance' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                                Profile Settings
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Manage your public profile information.
                            </p>
                            {/* Placeholder for Profile Form */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-500 text-center">
                                Profile editing coming soon.
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                                Account Settings
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Manage your account credentials and security.
                            </p>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                                Notifications
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Choose what you want to be notified about.
                            </p>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                                Appearance
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Customize how OpenHaven looks for you.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
