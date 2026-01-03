'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import Link from 'next/link';

export default function CreateFeedPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        setIsAuth(true);
        setLoading(false);
    }, [router]);

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
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Create Custom Feed</h1>
                <Link
                    href="/feed"
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                    Cancel
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
                <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Custom Feeds Coming Soon
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Create personalized feeds by combining your favorite topics, languages, and authors.
                        This feature is under development.
                    </p>
                    <Link
                        href="/feed"
                        className="inline-block mt-6 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Back to Feed
                    </Link>
                </div>
            </div>
        </div>
    );
}
