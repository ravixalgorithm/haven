'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import CommentSection from '@/components/CommentSection';
import ShareModal from '@/components/ShareModal';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    const [showShareModal, setShowShareModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchSnippet = async () => {
            try {
                const res = await fetch(`${API_URL}/snippets/${params.id}`);
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
                const res = await fetch(`${API_URL}/snippets/${params.id}/vote`, {
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
                const res = await fetch(`${API_URL}/auth/me`, {
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
            const res = await fetch(`${API_URL}/snippets/${params.id}`, {
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
            const res = await fetch(`${API_URL}/reports`, {
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
            const response = await fetch(`${API_URL}/snippets/${params.id}/${type}`, {
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
        <div className="max-w-5xl mx-auto py-12 px-4 relative">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            {/* Main Content Card */}
            <div className="bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">

                {/* Header Section */}
                <div className="p-8 md:p-10 border-b border-slate-200 dark:border-white/5 bg-gradient-to-br from-white/50 to-slate-50/50 dark:from-white/[0.02] dark:to-transparent">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            {/* Title */}
                            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight font-display">
                                {snippet.title}
                            </h1>

                            {/* Author & Meta */}
                            <div className="flex items-center gap-4 text-sm">
                                <Link href={`/user/${snippet.author.username}`} className="group flex items-center gap-3">
                                    {snippet.author.avatarUrl ? (
                                        <img src={snippet.author.avatarUrl} alt={snippet.author.username} className="w-10 h-10 rounded-full ring-2 ring-slate-100 dark:ring-white/10 group-hover:ring-teal-500 transition-all" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20">
                                            {snippet.author.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">
                                            {snippet.author.username}
                                        </span>
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {snippet.createdAt ? format(new Date(snippet.createdAt), 'MMM d, yyyy') : 'Unknown Date'}
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Actions & Voting */}
                        <div className="flex flex-row md:flex-col items-end gap-4">
                            {/* Vote Control */}
                            <div className="flex items-center bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm p-1">
                                <button
                                    onClick={() => handleVote('upvote')}
                                    disabled={isVoting}
                                    className={`p-2 rounded-md transition-all ${userVote === 'upvote' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400'}`}
                                >
                                    <svg className="w-5 h-5" fill={userVote === 'upvote' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                </button>

                                <span className={`px-3 font-bold text-lg min-w-[40px] text-center ${userVote === 'upvote' ? 'text-teal-600 dark:text-teal-400' : userVote === 'downvote' ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {score}
                                </span>

                                <button
                                    onClick={() => handleVote('downvote')}
                                    disabled={isVoting}
                                    className={`p-2 rounded-md transition-all ${userVote === 'downvote' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400'}`}
                                >
                                    <svg className="w-5 h-5" fill={userVote === 'downvote' ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </div>

                            {/* Action Buttons Group */}
                            <div className="flex gap-2">
                                {/* Share Button */}
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors shadow-sm"
                                    title="Share Snippet"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                </button>

                                {/* Menu Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowActions(!showActions)}
                                        className="p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors shadow-sm"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>

                                    {showActions && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 z-20 py-1.5 overflow-hidden ring-1 ring-black/5">
                                                {isAuthor && (
                                                    <>
                                                        <Link
                                                            href={`/snippet/${params.id}/edit`}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                                            onClick={() => setShowActions(false)}
                                                        >
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            Edit Snippet
                                                        </Link>
                                                        <button
                                                            onClick={() => { setShowActions(false); setShowDeleteModal(true); }}
                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            Delete Snippet
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={handleReport}
                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                                    Report Issue
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        {snippet.tags.map((tag: string) => (
                            <Link
                                key={tag}
                                href={`/feed?q=${encodeURIComponent(tag)}`}
                                className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 dark:hover:border-teal-900/50 transition-all uppercase tracking-wide"
                            >
                                #{tag}
                            </Link>
                        ))}
                        <Link href={`/feed?q=${encodeURIComponent(snippet.language)}`} className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-full text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                            {snippet.language}
                        </Link>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-8 md:p-10">
                    <div className="prose dark:prose-invert max-w-none prose-lg prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-a:text-teal-600 dark:prose-a:text-teal-400 hover:prose-a:text-teal-500">
                        {snippet.description ? (
                            <ReactMarkdown
                                components={{
                                    pre: ({ children }) => {
                                        // Helper to safely extract content
                                        const processNode = (node: any): string => {
                                            if (typeof node === 'string') return node;
                                            if (Array.isArray(node)) return node.map(processNode).join('');
                                            if (node?.props) return processNode(node.props.children);
                                            return '';
                                        };

                                        // Extract language class
                                        let language = 'javascript'; // Default
                                        let content = '';

                                        const codeChild = Array.isArray(children) ? children[0] : children;
                                        if (codeChild?.props?.className) {
                                            const match = /language-(\w+)/.exec(codeChild.props.className);
                                            if (match) language = match[1];
                                        }

                                        content = processNode(children).replace(/\n$/, '');

                                        return (
                                            <div className="not-prose my-10 rounded-2xl overflow-hidden bg-[#0d0e11] border border-slate-800 shadow-2xl ring-1 ring-white/5 group relative text-sm leading-relaxed">
                                                {/* Code Header */}
                                                <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5 backdrop-blur-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#ff5f56]/50" />
                                                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#ffbd2e]/50" />
                                                            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#27c93f]/50" />
                                                        </div>
                                                        <span className="ml-2 font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">{language}</span>
                                                    </div>
                                                    <CopyButton content={content} />
                                                </div>

                                                {/* Code Content with Syntax Highlighting */}
                                                <div className="relative">
                                                    {/* Subtle Grid Background for Code */}
                                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
                                                    <SyntaxHighlighter
                                                        language={language}
                                                        style={atomDark}
                                                        customStyle={{ margin: 0, padding: '2rem', background: 'transparent' }}
                                                        wrapLines={true}
                                                        showLineNumbers={true}
                                                        lineNumberStyle={{ minWidth: "2.5em", paddingRight: "1em", color: "#4b5563", textAlign: "right" }}
                                                    >
                                                        {content}
                                                    </SyntaxHighlighter>
                                                </div>
                                            </div>
                                        );
                                    },
                                    code: ({ children, className, ...props }) => (
                                        <code className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm text-teal-700 dark:text-teal-300 font-mono font-medium border border-teal-200/50 dark:border-teal-800/50" {...props}>
                                            {children}
                                        </code>
                                    )
                                }}
                            >
                                {snippet.description}
                            </ReactMarkdown>
                        ) : (
                            <p className="italic text-slate-500 font-sans text-center py-10">No description provided.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Comment Section (Outer Container) */}
            <div className="mt-12">
                <div className="bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 md:p-10 shadow-lg">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 font-display flex items-center gap-3">
                        <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Discussion
                    </h3>
                    <CommentSection snippetId={params.id} />
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-[#151516] rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl transform transition-all scale-100">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6 mx-auto">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2 font-display">Delete this Snippet?</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
                                This action cannot be undone. This will permanently remove the snippet and all associated data.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Forever'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={snippet.title}
                url={typeof window !== 'undefined' ? window.location.href : ''}
            />
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
            className="group flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-all uppercase tracking-wider py-1.5 px-3 rounded-md hover:bg-white/10 active:scale-95"
            title="Copy Code"
        >
            <span className={`transition-all duration-300 ${copied ? 'opacity-100 text-teal-400 scale-110' : 'opacity-0 -translate-x-2 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto group-hover:translate-x-0'}`}>
                {copied ? 'Copied!' : 'Copy'}
            </span>
            {copied ? (
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
        </button>
    );
}
