'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        username: string;
        avatarUrl?: string;
    };
    parentId?: string | null;
    upvotes: number;
    downvotes: number;
}

export default function CommentSection({ snippetId }: { snippetId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);

    useEffect(() => {
        setIsAuth(!!getToken());
        fetchComments();
        fetchCurrentUser();
    }, [snippetId]);

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

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_URL}/snippets/${snippetId}/comments?limit=100`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.data.comments || []);
            }
        } catch (err) {
            console.error('Failed to load comments', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewComment = (comment: Comment) => {
        // Ensure new comment has defaults
        const safeComment = {
            ...comment,
            upvotes: comment.upvotes || 0,
            downvotes: comment.downvotes || 0
        };
        setComments(prev => [safeComment, ...prev]);
    };

    // Build Tree
    const rootComments = useMemo(() => {
        return comments.filter(c => !c.parentId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [comments]);

    const getReplies = (parentId: string) => {
        return comments.filter(c => c.parentId === parentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    // Callback to update a comment in the list (for edit/delete)
    const handleUpdateComment = (updatedComment: Comment | null, commentId: string) => {
        if (!updatedComment) {
            // Delete
            setComments(prev => prev.filter(c => c.id !== commentId));
        } else {
            // Edit
            setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
        }
    };

    return (
        <div className="bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                Discussion <span className="text-slate-500 font-normal">({comments.length})</span>
            </h3>

            {/* Root Input */}
            <CommentInput snippetId={snippetId} onCommentPosted={handleNewComment} />

            {/* Comment List */}
            {loading ? (
                <div className="space-y-4 animate-pulse mt-8">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 w-1/4 mb-4 rounded" />
                </div>
            ) : (
                <div className="space-y-6 mt-8">
                    {rootComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={{
                                ...comment,
                                upvotes: comment.upvotes || 0,
                                downvotes: comment.downvotes || 0
                            }}
                            getReplies={getReplies}
                            snippetId={snippetId}
                            onReplyPosted={handleNewComment}
                            currentUser={currentUser}
                            onUpdate={handleUpdateComment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CommentItem({ comment, getReplies, snippetId, onReplyPosted, currentUser, onUpdate }: { comment: Comment, getReplies: (id: string) => Comment[], snippetId: string, onReplyPosted: (c: Comment) => void, currentUser: any, onUpdate: (c: Comment | null, id: string) => void }) {
    const replies = getReplies(comment.id);
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [vote, setVote] = useState<'upvote' | 'downvote' | null>(null);
    // Safety check for NaN
    const [score, setScore] = useState((comment.upvotes || 0) - (comment.downvotes || 0));

    const isAuthor = currentUser && currentUser.username === comment.user.username;

    const handleVote = async (type: 'upvote' | 'downvote') => {
        const token = getToken();
        if (!token) {
            alert('Please login to vote');
            return;
        }

        const prevVote = vote;
        const prevScore = score;
        let newScore = score;

        if (vote === type) {
            setVote(null); // Toggle off
            newScore = type === 'upvote' ? score - 1 : score + 1;
        } else {
            if (vote) {
                // Switching
                newScore = type === 'upvote' ? score + 2 : score - 2;
            } else {
                // New
                newScore = type === 'upvote' ? score + 1 : score - 1;
            }
            setVote(type);
        }
        setScore(newScore);

        try {
            const res = await fetch(`${API_URL}/comments/${comment.id}/${type}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                setVote(prevVote);
                setScore(prevScore);
            }
        } catch (e) {
            setVote(prevVote);
            setScore(prevScore);
        }
    };

    const handleEdit = async () => {
        const token = getToken();
        if (!token || !editContent.trim()) return;

        try {
            const res = await fetch(`${API_URL}/comments/${comment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent })
            });

            if (res.ok) {
                const data = await res.json();
                onUpdate(data.data, comment.id);
                setIsEditing(false);
            } else {
                alert('Failed to update comment');
            }
        } catch (e) {
            alert('Failed to update comment');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/comments/${comment.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                onUpdate(null, comment.id);
            } else {
                alert('Failed to delete comment');
            }
        } catch (e) {
            alert('Failed to delete comment');
        }
    };

    const handleReport = async () => {
        const token = getToken();
        if (!token) {
            alert('Please login to report');
            return;
        }

        const reason = prompt('Please enter a reason for reporting this comment:');
        if (!reason) return;

        try {
            const res = await fetch(`${API_URL}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'comment',
                    id: comment.id,
                    reason
                })
            });

            if (res.ok) {
                alert('Thank you for your report. Our team will review this content.');
            } else {
                alert('Failed to submit report');
            }
        } catch (err) {
            alert('Failed to submit report');
        } finally {
            setIsActionOpen(false);
        }
    };

    return (
        <div className="flex gap-3 group relative">
            <div className="flex flex-col items-center">
                <Link href={`/user/${comment.user.username}`}>
                    {comment.user.avatarUrl ? (
                        <img src={comment.user.avatarUrl} alt={comment.user.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {comment.user.username[0].toUpperCase()}
                        </div>
                    )}
                </Link>
                {replies.length > 0 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-2 mb-2 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500 flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <Link href={`/user/${comment.user.username}`} className="font-bold text-slate-900 dark:text-slate-200 hover:underline">
                            {comment.user.username}
                        </Link>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                        <button onClick={() => setIsActionOpen(!isActionOpen)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {isActionOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsActionOpen(false)} />
                                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-1 text-xs">
                                    {isAuthor && (
                                        <>
                                            <button onClick={() => { setIsEditing(true); setIsActionOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Edit</button>
                                            <button onClick={() => { handleDelete(); setIsActionOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600">Delete</button>
                                        </>
                                    )}
                                    <button onClick={handleReport} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Report</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="mb-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded p-2 text-sm text-slate-900 dark:text-white"
                            rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                            <button onClick={handleEdit} className="px-2 py-1 bg-teal-500 text-white rounded text-xs font-bold hover:bg-teal-600">Save</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-2">
                        {comment.content}
                    </div>
                )}

                <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1 text-slate-500">
                        <button onClick={() => handleVote('upvote')} className={`p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded ${vote === 'upvote' ? 'text-teal-500' : ''}`}>
                            <svg className="w-4 h-4" fill={vote === 'upvote' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <span className={`text-xs font-bold ${vote === 'upvote' ? 'text-teal-500' : vote === 'downvote' ? 'text-indigo-500' : ''}`}>
                            {score}
                        </span>
                        <button onClick={() => handleVote('downvote')} className={`p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded ${vote === 'downvote' ? 'text-indigo-500' : ''}`}>
                            <svg className="w-4 h-4" fill={vote === 'downvote' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        Reply
                    </button>
                </div>

                {isReplying && (
                    <div className="mt-2 mb-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                        <CommentInput snippetId={snippetId} parentId={comment.id} onCommentPosted={(c) => {
                            onReplyPosted(c);
                            setIsReplying(false);
                        }} autoFocus />
                    </div>
                )}

                <div className="space-y-4 mt-2">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={{
                                ...reply,
                                upvotes: reply.upvotes || 0,
                                downvotes: reply.downvotes || 0
                            }}
                            getReplies={getReplies}
                            snippetId={snippetId}
                            onReplyPosted={onReplyPosted}
                            currentUser={currentUser}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function CommentInput({ snippetId, parentId, onCommentPosted, autoFocus }: { snippetId: string, parentId?: string, onCommentPosted: (c: Comment) => void, autoFocus?: boolean }) {
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent] = useState('');
    const token = getToken();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !token) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/snippets/${snippetId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, parentId })
            });

            if (res.ok) {
                const data = await res.json();
                onCommentPosted(data.data);
                setContent('');
            }
        } catch (err) {
            console.error('Failed to post comment', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="p-3 bg-slate-50 dark:bg-[#272729] rounded-lg text-sm text-center text-slate-500">
                Please <Link href="/login" className="text-teal-500 font-bold hover:underline">login</Link> to reply.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={parentId ? "What are your thoughts?" : "Add a comment..."}
                className="w-full bg-slate-50 dark:bg-[#272729] border border-slate-200 dark:border-[#343536] rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 min-h-[80px]"
                autoFocus={autoFocus}
            />
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-full text-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {submitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
                </button>
            </div>
        </form>
    );
}

