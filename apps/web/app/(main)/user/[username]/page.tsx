/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SnippetCard from '@/components/SnippetCard';
import FollowButton from '@/components/FollowButton';
import UserListModal from '@/components/UserListModal';
import { getToken } from '@/lib/auth';

interface User {
    id: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
    snippetCount: number;
    followerCount: number;
    followingCount: number;
    reputation: number;
}

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

export default function UserProfile(props: { params: Promise<{ username: string }> }) {
    const router = useRouter();
    const params = use(props.params);
    const { username } = params;

    const [user, setUser] = useState<User | null>(null);
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingSnippets, setLoadingSnippets] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeModal, setActiveModal] = useState<'followers' | 'following' | null>(null);

    // Decode username just in case
    const decodedUsername = decodeURIComponent(username);

    const fetchSnippets = useCallback((pageNum: number) => {
        setLoadingSnippets(true);
        fetch(`http://localhost:3002/api/v1/users/${decodedUsername}/snippets?page=${pageNum}&limit=12`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    const newSnippets = data.data.snippets || [];
                    if (pageNum === 1) {
                        setSnippets(newSnippets);
                    } else {
                        setSnippets(prev => [...prev, ...newSnippets]);
                    }
                    if (newSnippets.length < 12) setHasMore(false);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingSnippets(false));
    }, [decodedUsername]);

    useEffect(() => {
        // Check current user
        const token = getToken();
        if (token) {
            fetch('http://localhost:3002/api/v1/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(d => {
                    if (d.status === 'success') setCurrentUser(d.data);
                })
                .catch(console.error);
        }

        // Fetch Profile
        setLoadingUser(true);
        fetch(`http://localhost:3002/api/v1/users/${decodedUsername}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setUser(data.data);
                } else {
                    // Handle 404 or error
                    console.error('User fetch error:', data);
                }
            })
            .catch(console.error)
            .finally(() => setLoadingUser(false));

        // Fetch Initial Snippets
        fetchSnippets(1);
    }, [decodedUsername, fetchSnippets]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSnippets(nextPage);
    };

    if (loadingUser) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20 text-center text-slate-500">
                User not found
            </div>
        );
    }

    const isOwnProfile = currentUser?.username === user.username;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">

            {/* Profile Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-700 bg-slate-200">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                                    {user.username[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {user.username}
                            </h1>
                            {user.bio && (
                                <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-2xl">
                                    {user.bio}
                                </p>
                            )}

                            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-slate-500 dark:text-slate-400 mb-6">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{user.snippetCount}</span>
                                    <span>Snippets</span>
                                </div>
                                <button
                                    onClick={() => setActiveModal('followers')}
                                    className="flex items-center gap-1 hover:text-teal-500 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{user.followerCount}</span>
                                    <span>Followers</span>
                                </button>
                                <button
                                    onClick={() => setActiveModal('following')}
                                    className="flex items-center gap-1 hover:text-teal-500 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{user.followingCount || 0}</span>
                                    <span>Following</span>
                                </button>

                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{user.reputation}</span>
                                    <span>Reputation</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div>
                                {isOwnProfile ? (
                                    <Link
                                        href="/profile/edit"
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md font-medium text-slate-700 dark:text-white transition-colors"
                                    >
                                        Edit Profile
                                    </Link>
                                ) : (
                                    <FollowButton
                                        username={user.username}
                                        onToggle={(isFollowing) => {
                                            if (user) {
                                                setUser({
                                                    ...user,
                                                    followerCount: user.followerCount + (isFollowing ? 1 : -1)
                                                });
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Snippets List */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Snippets
                </h2>

                {snippets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {snippets.map((snippet) => (
                            <SnippetCard key={snippet.id} {...snippet} />
                        ))}
                    </div>
                ) : (
                    !loadingSnippets && (
                        <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-lg mb-2">No snippets yet</p>
                            {isOwnProfile && (
                                <button
                                    onClick={() => router.push('/snippet/create')}
                                    className="text-teal-500 hover:text-teal-600 font-medium"
                                >
                                    Create your first snippet
                                </button>
                            )}
                        </div>
                    )
                )}

                {loadingSnippets && snippets.length === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md animate-pulse h-64 border border-slate-200 dark:border-slate-700"></div>
                        ))}
                    </div>
                )}

                {hasMore && snippets.length > 0 && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingSnippets}
                            className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                        >
                            {loadingSnippets ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
            {activeModal && (
                <UserListModal
                    type={activeModal}
                    username={user.username}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </div>
    );
}
