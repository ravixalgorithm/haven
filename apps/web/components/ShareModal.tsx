'use client';

import { useEffect, useState } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    url: string;
}

export default function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) setCopied(false);
    }, [isOpen]);

    if (!isOpen) return null;

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(`Check out this snippet "${title}" on OpenHaven: ${url}`);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const platforms = [
        {
            name: 'Twitter / X',
            href: `https://twitter.com/intent/tweet?text=${encodedText}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            )
        },
        {
            name: 'LinkedIn',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
            )
        },
        {
            name: 'WhatsApp',
            href: `https://wa.me/?text=${encodedText}`,
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
            )
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Share Snippet</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        {platforms.map(p => (
                            <a
                                key={p.name}
                                href={p.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 hover:text-teal-500"
                            >
                                {p.icon}
                                <span className="text-xs font-medium">{p.name}</span>
                            </a>
                        ))}
                    </div>

                    {/* Copy Link */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Or copy link</label>
                        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input
                                type="text"
                                readOnly
                                value={url}
                                className="bg-transparent border-none text-sm text-slate-600 dark:text-slate-300 w-full focus:ring-0"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${copied
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 shadow-sm'
                                    }`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
