'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import CommentSection from '@/components/CommentSection';
import { getToken } from '@/lib/auth';

export default function SnippetDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [snippet, setSnippet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 });
    const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
    const [showActions, setShowActions] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchSnippet = async () => {
            try {
                const res = await fetch(`http://localhost:3002/api/v1/snippets/${params.id}`);
                if (!res.ok) {
                    if (res.status === 404) return null;
                    throw new Error('Failed to fetch snippet');
                }
                const data = await res.json();
                setSnippet(data.data);
                setVotes({ upvotes: data.data.upvotes, downvotes: data.data.downvotes });
            } catch (err: any) {
                console.warn("Fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchVoteStatus = async () => {
            const token = getToken();
            if (!token) return;
            try {
                const res = await fetch(`http://localhost:3002/api/v1/snippets/${params.id}/vote`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserVote(data.data.vote);
                }
            } catch (e) { console.error(e); }
        };

        const fetchCurrentUser = async () => {
            const token = getToken();
            if (!token) return;
            try {
                const res = await fetch('http://localhost:3002/api/v1/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUser(data.data);
                }
            } catch (e) { console.error(e); }
        };

        fetchSnippet();
        fetchVoteStatus();
        fetchCurrentUser();
    }, [params.id]);

    const handleDelete = async () => {
        const token = getToken();
        if (!token) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`http://localhost:3002/api/v1/snippets/${params.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                router.push('/feed');
            } else {
                alert('Failed to delete snippet');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete snippet');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleReport = async () => {
        const token = getToken();
        if (!token) {
            alert('Please login to report');
            return;
        }

        const reason = prompt('Please enter a reason for reporting this snippet:');
        if (!reason) return;

        try {
            const res = await fetch('http://localhost:3002/api/v1/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'snippet',
                    id: params.id,
                    reason
                })
            });

            if (res.ok) {
                alert('Thank you for your report. Our team will review this content.');
            } else {
                alert('Failed to submit report');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to submit report');
        } finally {
            setShowActions(false);
        }
    };

    const isAuthor = currentUser && snippet && currentUser.username === snippet.author.username;

    const handleVote = async (type: 'upvote' | 'downvote') => {
        const token = getToken();
        if (!token) {
            alert('Please login to vote');
            return;
        }

        if (isVoting) return;
        setIsVoting(true);

        const previousUserVote = userVote;
        const previousVotes = votes;
        let nextUserVote: 'upvote' | 'downvote' | null = type;
        const nextVotes = { ...votes };

        if (previousUserVote === type) {
            nextUserVote = null;
            if (type === 'upvote') nextVotes.upvotes--;
            else nextVotes.downvotes--;
        } else {
            if (type === 'upvote') {
                nextVotes.upvotes++;
                if (previousUserVote === 'downvote') nextVotes.downvotes--;
            } else {
                nextVotes.downvotes++;
                if (previousUserVote === 'upvote') nextVotes.upvotes--;
            }
        }

        setUserVote(nextUserVote);
        setVotes(nextVotes);

        try {
            const response = await fetch(`http://localhost:3002/api/v1/snippets/${params.id}/${type}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.userVote !== undefined) {
                    setVotes({
                        upvotes: data.data.upvotes,
                        downvotes: data.data.downvotes,
                    });
                    setUserVote(data.data.userVote);
                }
            } else {
                setUserVote(previousUserVote);
                setVotes(previousVotes);
            }
        } catch (error) {
            setUserVote(previousUserVote);
            setVotes(previousVotes);
        } finally {
            setTimeout(() => setIsVoting(false), 500);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-10 px-4 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 w-1/3 mb-6 rounded"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 w-3/4 mb-4 rounded"></div>
                <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
            </div>
        );
    }

    if (error || !snippet) {
        return (
            <div className="text-center py-20 bg-white dark:bg-[#1A1A1B] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 max-w-2xl mx-auto mt-10">
                <p className="text-xl text-slate-500 mb-4">Snippet not found or deleted</p>
                <Link href="/feed" className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors">
                    Back to Feed
                </Link>
            </div>
        );
    }

    const score = votes.upvotes - votes.downvotes;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">

            {/* Header: Author & Meta */}
            <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-t-xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href={`/user/${snippet.author.username}`}>
                            {snippet.author.avatarUrl ? (
                                <img src={snippet.author.avatarUrl} alt={snippet.author.username} className="w-12 h-12 rounded-full ring-2 ring-slate-100 dark:ring-slate-800" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300">
                                    {snippet.author.username[0].toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <div>
                            <Link href={`/user/${snippet.author.username}`} className="text-lg font-bold text-slate-900 dark:text-white hover:underline block">
                                {snippet.author.username}
                            </Link>
                            <p className="text-sm text-slate-500">
                                Posted on {snippet.createdAt ? format(new Date(snippet.createdAt), 'MMM d, yyyy') : 'Unknown Date'}
                            </p>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>

                        {showActions && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1">
                                    {isAuthor && (
                                        <>
                                            <Link
                                                href={`/snippet/${params.id}/edit`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => setShowActions(false)}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => { setShowActions(false); setShowDeleteModal(true); }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={handleReport}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                        Report
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Vote Control (Minimal) */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center bg-slate-100 dark:bg-[#2d2d2d] rounded-md overflow-hidden border border-slate-200 dark:border-[#3e3e3e]">
                        <button
                            onClick={() => handleVote('upvote')}
                            disabled={isVoting}
                            className={`p-1 px-2.5 transition-colors ${userVote === 'upvote' ? 'bg-teal-100 text-teal-600' : 'hover:bg-slate-200 dark:hover:bg-[#343536] text-slate-500'}`}
                        >
                            <svg className="w-5 h-5" fill={userVote === 'upvote' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={userVote === 'upvote' ? 0 : 2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4L3 15h6v5h6v-5h6z" /></svg>
                        </button>

                        <span className={`px-2 font-bold text-base min-w-[20px] text-center ${userVote === 'upvote' ? 'text-teal-600' : userVote === 'downvote' ? 'text-indigo-500' : 'text-slate-900 dark:text-slate-100'}`}>
                            {score}
                        </span>

                        <button
                            onClick={() => handleVote('downvote')}
                            disabled={isVoting}
                            className={`p-1 px-2.5 transition-colors ${userVote === 'downvote' ? 'bg-indigo-100 text-indigo-500' : 'hover:bg-slate-200 dark:hover:bg-[#343536] text-slate-500'}`}
                        >
                            <svg className="w-5 h-5" fill={userVote === 'downvote' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={userVote === 'downvote' ? 0 : 2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20L3 9h6V4h6v5h6z" /></svg>
                        </button>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">{score} points</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
                    {snippet.title}
                </h1>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {snippet.tags.map((tag: string) => (
                        <Link
                            key={tag}
                            href={`/feed?q=${encodeURIComponent(tag)}`}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-base cursor-pointer"
                        >
                            #{tag}
                        </Link>
                    ))}
                    <Link href={`/feed?q=${encodeURIComponent(snippet.language)}`} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        #{snippet.language}
                    </Link>
                </div>

                {/* Body Content (Markdown Description) */}
                <div className="prose dark:prose-invert max-w-none mb-8 text-slate-800 dark:text-slate-200 leading-8 text-lg font-serif">
                    {snippet.description ? (
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 className="font-sans font-bold text-3xl mt-8 mb-4 text-slate-900 dark:text-white" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="font-sans font-bold text-2xl mt-8 mb-4 text-slate-900 dark:text-white" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="font-sans font-bold text-xl mt-6 mb-3 text-slate-900 dark:text-white" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-6 font-serif" {...props} />,
                                pre: ({ children }) => {
                                    // Robustly extract content from standard ReactMarkdown structure
                                    const processNode = (node: any): string => {
                                        if (typeof node === 'string') return node;
                                        if (Array.isArray(node)) return node.map(processNode).join('');
                                        if (node?.props) {
                                            return processNode(node.props.children);
                                        }
                                        return '';
                                    };

                                    // Extract language from the first child code element if available
                                    let content = '';
                                    let language = 'TEXT';

                                    const codeChild = Array.isArray(children) ? children[0] : children;
                                    if (codeChild?.props?.className) {
                                        const match = /language-(\w+)/.exec(codeChild.props.className);
                                        if (match) language = match[1];
                                    }

                                    content = processNode(children).replace(/\n$/, '');

                                    return (
                                        <div className="my-8 rounded-xl overflow-hidden bg-[#050505] border border-slate-800 shadow-2xl ring-1 ring-white/5">
                                            <div className="flex items-center justify-between px-5 py-3 bg-[#0a0a0a] border-b border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                                    </div>
                                                    <span className="ml-3 text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
                                                        {language}
                                                    </span>
                                                </div>
                                                <CopyButton content={content} />
                                            </div>
                                            <pre className="p-8 overflow-x-auto text-[15px] font-mono leading-8 text-gray-300 m-0 font-sans bg-[#050505]">
                                                <code>{content}</code>
                                            </pre>
                                        </div>
                                    );
                                },
                                code: ({ children, className, ...props }) => {
                                    return (
                                        <code className="bg-slate-100 dark:bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono text-slate-800 dark:text-teal-400 font-sans border border-slate-200 dark:border-slate-800" {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {snippet.description}
                        </ReactMarkdown>
                    ) : (
                        <p className="italic text-slate-500 font-sans">No content provided.</p>
                    )}
                </div>
            </div>

            {/* Comment Section Footer */}
            <div className="mt-8">
                <CommentSection snippetId={params.id} />
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Snippet</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Are you sure you want to delete this snippet? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CopyButton({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="group flex items-center gap-2 text-xs font-sans font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider py-1.5 px-3 rounded-md hover:bg-white/10"
            title="Copy Code"
        >
            <span className={`transition-opacity ${copied ? 'opacity-100 text-green-400' : 'opacity-0 group-hover:opacity-100'}`}>
                {copied ? 'Copied!' : 'Copy'}
            </span>
            {copied ? (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
        </button>
    );
}
