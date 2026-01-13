"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { API_URL } from "@/lib/config";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        userCount: 0,
        snippetCount: 0,
        totalReports: 0,
        pendingReports: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchStats = async () => {
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status === 403) {
                    setError("Access Denied: You are not an admin.");
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                if (data.status === "success") {
                    setStats(data.data);
                } else {
                    setError(data.error || "Failed to fetch stats");
                }
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
                setError("Connection error");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{error}</h2>
                <Link href="/" className="text-teal-500 hover:text-teal-600 font-medium">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Overview of platform performance and moderation.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/users" className="px-4 py-2 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors backdrop-blur-sm">
                        Manage Users
                    </Link>
                    <Link href="/admin/reports" className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium shadow-lg shadow-teal-500/20 transition-colors">
                        View Reports
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatsCard
                    title="Total Users"
                    value={stats.userCount}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    color="blue"
                    trend="+12% this week"
                />
                <StatsCard
                    title="Total Snippets"
                    value={stats.snippetCount}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                    color="green"
                    trend="+5% this week"
                />
                <StatsCard
                    title="Pending Reports"
                    value={stats.pendingReports}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    color="red"
                    trend={stats.pendingReports > 0 ? "Requires Action" : "All Clear"}
                    pulse={stats.pendingReports > 0}
                />
                <StatsCard
                    title="Total Reports"
                    value={stats.totalReports}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                    color="purple"
                    trend="Lifetime"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions / Recent Activity Placeholder */}
                <div className="bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">System Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Database Connected</span>
                            </div>
                            <span className="text-xs text-green-600 dark:text-green-500">Normal</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">API Gateway</span>
                            </div>
                            <span className="text-xs text-green-600 dark:text-green-500">Operational</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">Socket Server</span>
                            </div>
                            <span className="text-xs text-green-600 dark:text-green-500">Operational</span>
                        </div>
                    </div>
                </div>

                {/* Moderation Queue Preview - Could be real data later */}
                <div className="bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Moderation Queue</h2>
                        <Link href="/admin/reports" className="text-sm text-teal-500 hover:text-teal-600 font-medium">View All</Link>
                    </div>

                    {stats.pendingReports > 0 ? (
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                <span className="font-bold">{stats.pendingReports}</span>
                            </div>
                            <div>
                                <p className="font-medium text-red-900 dark:text-red-300">Pending Reports</p>
                                <p className="text-xs text-red-700 dark:text-red-400">Items requiring your attention.</p>
                            </div>
                            <Link href="/admin/reports" className="ml-auto px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">
                                Review
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 mb-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">All caught up!</p>
                            <p className="text-xs text-slate-500">No pending reports at this time.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, color, trend, pulse }: any) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
        green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
        red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
        purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
    } as any;

    const bgColors = {
        blue: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
        green: "hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
        red: "hover:bg-red-50 dark:hover:bg-red-900/10",
        purple: "hover:bg-purple-50 dark:hover:bg-purple-900/10",
    } as any;

    return (
        <div className={`
            bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-white/10 
            shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${bgColors[color]}
        `}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white font-display mb-2">{value}</p>
                    {trend && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color === 'red' && pulse
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'
                            }`}>
                            {trend}
                        </span>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
