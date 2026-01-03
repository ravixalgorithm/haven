'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SnippetCard from '@/components/SnippetCard';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';

interface Snippet {
    id: string;
    slug: string;
    title: string;
    description: string;
    language: string;
    tags: string[];
    author: {
        username: string;
        avatarUrl?: string;
    };
    upvotes: number;
    downvotes: number;
    viewCount: number;
    savedAt: string;
}

export default function SavedPage() {
    const router = useRouter();
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchSaved = useCallback(async (pageNum: number, append = false) => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        if (pageNum === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const res = await fetch(`${API_URL}/saved?page=${pageNum}&limit=12`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.status === 'success') {
                const newSnippets = data.data.snippets || [];
                if (append) {
                    setSnippets((prev) => [...prev, ...newSnippets]);
                } else {
                    setSnippets(newSnippets);
                }
                setHasMore(pageNum < data.data.pagination.pages);
            }
        } catch (err) {
            console.error('Failed to fetch saved snippets', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [router]);

    useEffect(() => {
        fetchSaved(1);
    }, [fetchSaved]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSaved(nextPage, true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Saved Snippets</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{snippets.length} saved</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse border border-slate-200 dark:border-slate-700 h-48"
                        />
                    ))}
                </div>
            ) : snippets.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No saved snippets yet</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        Click the bookmark icon on snippets to save them here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {snippets.map((snippet) => (
                            <div
                                key={snippet.id}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <SnippetCard {...snippet} />
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="text-center pt-4">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
