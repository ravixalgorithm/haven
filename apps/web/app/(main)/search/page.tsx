'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SnippetCard from '@/components/SnippetCard';
import Select from '@/components/Select';

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

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Params
    const query = searchParams.get('q') || '';
    const timeRange = searchParams.get('timeRange') || 'all';
    const sort = searchParams.get('sort') || 'relevance';
    const language = searchParams.get('language') || 'all';

    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all' && key !== 'q') params.delete(key);
        else params.set(key, value);

        router.push(`/search?${params.toString()}`);
    };

    useEffect(() => {
        if (!query && !language) {
            setSnippets([]);
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                let url = `http://localhost:3002/api/v1/search?q=${encodeURIComponent(query)}&limit=50`;
                if (timeRange !== 'all') url += `&timeRange=${timeRange}`;
                if (sort !== 'relevance') url += `&sort=${sort}`;
                if (language !== 'all') url += `&language=${language}`;

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'success') {
                        setSnippets(data.data.results || []);
                    }
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, timeRange, sort, language]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {query ? `Results for "${query}"` : 'Search Snippets'}
                </h1>

                {/* Horizontal Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative z-10">
                    <Select
                        label="Sort:"
                        value={sort}
                        onChange={(val) => updateFilter('sort', val)}
                        options={[
                            { label: 'Relevance', value: 'relevance' },
                            { label: 'Newest', value: 'new' },
                            { label: 'Top Voted', value: 'top' },
                        ]}
                        minWidth="160px"
                    />

                    <Select
                        label="Time:"
                        value={timeRange}
                        onChange={(val) => updateFilter('timeRange', val)}
                        options={[
                            { label: 'Any time', value: 'all' },
                            { label: 'Past 24 hours', value: '24h' },
                            { label: 'Past week', value: '7d' },
                            { label: 'Past month', value: '30d' },
                            { label: 'Past year', value: 'year' },
                        ]}
                        minWidth="160px"
                    />

                    <Select
                        value={language}
                        onChange={(val) => updateFilter('language', val)}
                        options={[
                            { label: 'Any Language', value: 'all' },
                            { label: 'JavaScript', value: 'javascript' },
                            { label: 'TypeScript', value: 'typescript' },
                            { label: 'Python', value: 'python' },
                            { label: 'Java', value: 'java' },
                            { label: 'Go', value: 'go' },
                            { label: 'Rust', value: 'rust' },
                            { label: 'C++', value: 'cpp' },
                            { label: 'HTML', value: 'html' },
                            { label: 'CSS', value: 'css' },
                            { label: 'SQL', value: 'sql' },
                        ]}
                        minWidth="160px"
                    />

                    {/* Clear Filters (if any applied) */}
                    {(timeRange !== 'all' || language !== 'all' || sort !== 'relevance') && (
                        <button
                            onClick={() => router.push(`/search?q=${query}`)}
                            className="ml-auto text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results Area */}
            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-64 animate-pulse"></div>
                        ))}
                    </div>
                ) : snippets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {snippets.map((snippet) => (
                            <div key={snippet.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                <SnippetCard {...snippet} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-500">
                            {query ? `No results found for "${query}"` : 'Enter a query to search or select filters.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 h-64 animate-pulse"></div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
