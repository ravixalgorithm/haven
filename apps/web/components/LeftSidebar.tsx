'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth';

const ICONS = {
    Home: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>,
    Fire: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>,
    Topic: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>,
    Bookmark: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
    Create: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Folder: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    Info: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Shield: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Document: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
};

interface Topic {
    name: string;
    count: number;
}

export default function LeftSidebar() {
    const pathname = usePathname();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        setIsAuth(!!getToken());
        // Fetch trending topics (tags/languages) from API
        fetch('http://localhost:3002/api/v1/topics')
            .then(res => res.ok ? res.json() : { data: { topics: [] } })
            .then(data => setTopics(data.data?.topics || []))
            .catch(() => setTopics([]));
    }, []);

    const NavItem = ({ href, icon, name, badge }: { href: string, icon: React.ReactNode, name: string, badge?: number }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
            <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900'
                    }`}
            >
                <div className="text-gray-800 dark:text-gray-300">
                    {icon}
                </div>
                <span className="flex-1">{name}</span>
                {badge !== undefined && (
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                        {badge}
                    </span>
                )}
            </Link>
        )
    }

    return (
        <div className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col gap-1 pr-4 border-r border-transparent lg:border-gray-100 dark:lg:border-zinc-800 overflow-y-auto pt-2 pb-6">

            {/* Primary Navigation */}
            <NavItem href="/feed" icon={ICONS.Home} name="Home" />
            <NavItem href="/popular" icon={ICONS.Fire} name="Popular" />

            {/* Divider */}
            <div className="my-2 border-t border-gray-100 dark:border-zinc-800 mx-4"></div>

            {/* Custom Feeds / Saved Section */}
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Your Library
            </div>
            <NavItem href="/saved" icon={ICONS.Bookmark} name="#All Saved" />
            {isAuth && (
                <NavItem href="/feeds/create" icon={ICONS.Folder} name="Create Custom Feed" />
            )}

            {/* Divider */}
            <div className="my-2 border-t border-gray-100 dark:border-zinc-800 mx-4"></div>

            {/* Dynamic Topics */}
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Topics
            </div>
            {topics.length > 0 ? (
                topics.slice(0, 8).map((topic) => (
                    <NavItem
                        key={topic.name}
                        href={`/feed?q=${encodeURIComponent(topic.name)}`}
                        icon={ICONS.Topic}
                        name={`#${topic.name}`}
                        badge={topic.count}
                    />
                ))
            ) : (
                <p className="px-4 text-xs text-gray-400 italic">No topics yet</p>
            )}

            {/* Divider */}
            <div className="my-2 border-t border-gray-100 dark:border-zinc-800 mx-4"></div>

            {/* Resources Section */}
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Resources
            </div>
            <NavItem href="/about" icon={ICONS.Info} name="About" />
            <NavItem href="/privacy" icon={ICONS.Shield} name="Privacy Policy" />
            <NavItem href="/terms" icon={ICONS.Document} name="Terms of Service" />
        </div>
    );
}

