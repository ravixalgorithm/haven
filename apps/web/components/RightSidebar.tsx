'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VOTE_UPDATE_EVENT } from '@/lib/events';

interface TrendingSnippet {
    id: string;
    title: string;
    upvotes: number;
    downvotes: number;
    score?: number;
}

export default function RightSidebar() {
    const [trending, setTrending] = useState<TrendingSnippet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3002/api/v1/trending?limit=10')
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'success' && data.data) {
                    setTrending(data.data.snippets || []);
                } else {
                    console.error('Failed trending:', data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed trending fetch', err);
                setLoading(false);
            });

        const handleVoteUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setTrending(prev => prev.map(s => {
                if (s.id === detail.id) {
                    return { ...s, score: detail.score };
                }
                return s;
            }));
        };

        window.addEventListener(VOTE_UPDATE_EVENT, handleVoteUpdate);
        return () => window.removeEventListener(VOTE_UPDATE_EVENT, handleVoteUpdate);
    }, []);

    return (
        <div className="flex flex-col gap-4 pb-4">

            {/* Sponsor Us Card */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src="https://avatars.githubusercontent.com/u/177231203?s=200&v=4"
                        alt="Open Dev Society"
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <h3 className="text-lg font-bold">Support Haven</h3>
                        <p className="text-teal-100 text-xs">Open Dev Society</p>
                    </div>
                </div>
                <p className="text-teal-100 text-sm mb-4">
                    Love OpenHaven? Help us keep building amazing tools for developers!
                </p>

                {/* Buy us a coffee button */}
                <Link
                    href="https://buymeacoffee.com"
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full bg-white text-teal-600 font-bold py-2.5 rounded-lg hover:bg-teal-50 transition-colors mb-2"
                >
                    ☕ Buy us a coffee
                </Link>

                {/* Sponsor via email */}
                <a
                    href="mailto:opendevsociety@gmail.com?subject=Sponsorship%20Inquiry%20-%20OpenHaven"
                    className="flex items-center justify-center gap-2 w-full bg-white/10 text-white font-medium py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Sponsor Us
                </a>

                {/* Sponsor Showcase Spot */}
                <div className="mt-4 pt-3 border-t border-white/20">
                    <p className="text-[10px] text-teal-200 uppercase tracking-wider mb-2 text-center">Our Sponsor</p>
                    <div className="bg-white/10 border border-dashed border-white/30 rounded-lg p-3 text-center">
                        <span className="text-white/60 text-sm italic">Your Company Here</span>
                    </div>
                </div>
            </div>

            {/* Trending List */}
            <div className="bg-white dark:bg-[#1A1A1B] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                    🔥 Trending Today
                </h3>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded" />
                        ))}
                    </div>
                ) : trending.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No trending snippets yet</p>
                ) : (
                    <div className="space-y-2">
                        {trending.slice(0, 10).map((snippet, idx) => (
                            <Link
                                key={snippet.id}
                                href={`/snippet/${snippet.id}`}
                                className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <span className="text-teal-500 font-bold text-xs min-w-[20px]">#{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-teal-500 transition-colors line-clamp-2 leading-tight">
                                        {snippet.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {snippet.score !== undefined
                                            ? snippet.score
                                            : (snippet.upvotes - (snippet.downvotes || 0))} pts
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 justify-center">
                <Link href="/privacy" className="hover:text-teal-500 transition-colors">Privacy</Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-teal-500 transition-colors">Terms</Link>
                <span>•</span>
                <Link href="/about" className="hover:text-teal-500 transition-colors">About</Link>
                <span className="w-full text-center mt-1 text-slate-400">© 2026 OpenHaven</span>
            </div>
        </div>
    );
}
