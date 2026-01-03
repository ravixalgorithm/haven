'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '@/lib/auth';

function GithubCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            setError('No authorization code found');
            return;
        }

        const exchangeCode = async () => {
            try {
                const res = await fetch('http://localhost:3002/api/v1/auth/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });

                const data = await res.json();

                if (data.status === 'success') {
                    setToken(data.data.token);
                    router.push('/');
                } else {
                    setError(data.error || 'Authentication failed');
                }
            } catch (err) {
                setError('Failed to connect to authentication server');
            }
        };

        exchangeCode();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md max-w-sm w-full text-center">
                {error ? (
                    <div className="text-red-500">
                        <h2 className="text-xl font-bold mb-2">Login Failed</h2>
                        <p>{error}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-300">Authenticating with GitHub...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GithubCallback() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">Loading...</div>}>
            <GithubCallbackContent />
        </Suspense>
    );
}

