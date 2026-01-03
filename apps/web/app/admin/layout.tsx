"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();
            if (!token) {
                router.push("/login?redirect=/admin");
                return;
            }

            try {
                const res = await fetch("http://localhost:3002/api/v1/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();

                // Check role (if backend returns it, which it might not yet unless I update auth.ts /me endpoint)
                // Wait, /me does not return role currently. I should update that or fetch separate endpoint?
                // Let's update /me endpoint in auth.ts to return role first? Or just trust accessing /admin/stats will fail if not admin.
                // Better: Try to fetch /admin/stats. If 403, redirect.

                const adminRes = await fetch("http://localhost:3002/api/v1/admin/stats", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (adminRes.status === 403 || adminRes.status === 401) {
                    router.push("/");
                    return;
                }

                setAuthorized(true);
            } catch (err) {
                router.push("/");
            }
        };

        checkAuth();
    }, [router]);

    if (!authorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex">
            {/* Sidebar matching LeftSidebar.tsx */}
            <aside className="w-64 border-r border-gray-100 dark:border-zinc-800 flex flex-col fixed h-full z-10 bg-white dark:bg-black">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'Sixtyfour' }}>
                        OPENHAVEN
                    </Link>
                    <span className="ml-2 text-xs font-mono uppercase text-gray-400 dark:text-gray-600">Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === '/admin'
                        ? 'bg-gray-200 dark:bg-zinc-800 text-black dark:text-white'
                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900'
                        }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        Dashboard
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Reports
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        Users
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Exit Admin
                    </Link>
                </div>
            </aside>
            <main className="flex-1 ml-64 p-8 bg-white dark:bg-black">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
