'use client';

import { useEffect, useState } from 'react';
import SnippetCard from '@/components/SnippetCard';
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
}

export default function PopularPage() {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchSnippets = async (pageNum: number, append = false) => {
        if (pageNum === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            // Popular page shows best snippets by default (highest votes + views)
            const res = await fetch(`${API_URL}/popular?sort=best&page=${pageNum}&limit=12`);
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
            console.error('Failed to fetch snippets', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchSnippets(1);
    }, []);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSnippets(nextPage, true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Popular Snippets</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top rated snippets by votes and views</p>
            </div>

            {/* Snippets List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse border border-slate-200 dark:border-slate-700 h-48"
                        />
                    ))}
                </div>
            ) : snippets.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400">No popular snippets yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Be the first to share a snippet!</p>
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
