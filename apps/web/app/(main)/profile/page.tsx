'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function ProfileRedirect() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch current user info and redirect to their profile
        fetch('http://localhost:3002/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.data?.username) {
                    router.replace(`/user/${data.data.username}`);
                } else {
                    router.push('/login');
                }
            })
            .catch(() => {
                router.push('/login');
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return null;
}
