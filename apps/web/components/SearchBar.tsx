"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { API_URL } from '@/lib/config';

// Hook for debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = useState<{ id: string; title: string; language: string; author?: { username: string } }[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Load recent searches on mount
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch results when debounced query changes
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.data.results || []);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        // Save to recent searches
        const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        setShowDropdown(false);
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    const clearRecent = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search snippets..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {loading && (
                    <div className="absolute right-3 top-2.5">
                        <div className="animate-spin h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </form>

            {showDropdown && (query || recentSearches.length > 0) && (
                <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    {/* Recent Searches */}
                    {!query && recentSearches.length > 0 && (
                        <div className="py-2">
                            <div className="flex justify-between items-center px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <span>Recent</span>
                                <button onClick={clearRecent} className="hover:text-red-500">Clear</button>
                            </div>
                            {recentSearches.map((term, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setQuery(term);
                                        router.push(`/search?q=${encodeURIComponent(term)}`);
                                        setShowDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                                >
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {term}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Live Results */}
                    {query && (
                        <div className="py-2">
                            {results.length > 0 ? (
                                <>
                                    <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Snippets
                                    </div>
                                    {results.map((result) => (
                                        <Link
                                            key={result.id}
                                            href={`/snippet/${result.id}`}
                                            onClick={() => setShowDropdown(false)}
                                            className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {result.title}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <span className="bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">
                                                    {result.language}
                                                </span>
                                                <span>by {result.author?.username}</span>
                                            </div>
                                        </Link>
                                    ))}
                                    <button
                                        onClick={() => handleSearch()}
                                        className="w-full text-center py-2 text-sm text-teal-500 hover:text-teal-600 font-medium border-t border-slate-100 dark:border-slate-700 mt-1"
                                    >
                                        View all results for &quot;{query}&quot;
                                    </button>
                                </>
                            ) : (
                                !loading && (
                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                        No results found
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

