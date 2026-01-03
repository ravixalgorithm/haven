"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { API_URL } from "@/lib/config";

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/admin/reports?status=pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === "success") {
                setReports(data.data.reports);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleAction = async (reportId: string, action: "resolve" | "dismiss" | "delete_content", snippetId?: string) => {
        const token = getToken();
        if (!token) return;

        if (action === "delete_content" && snippetId) {
            if (!confirm("Are you sure you want to delete this content?")) return;

            try {
                await fetch(`${API_URL}/admin/snippets/${snippetId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Content deleted");
                fetchReports(); // Refresh
            } catch (e) {
                toast.error("Failed to delete content");
            }
            return;
        }

        // Resolve or Dismiss
        const status = action === "resolve" ? "resolved" : "dismissed";
        try {
            await fetch(`${API_URL}/admin/reports/${reportId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });
            toast.success(`Report marked as ${status}`);
            fetchReports();
        } catch (e) {
            toast.error("Failed to update report");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Moderation Queue</h1>
                <div className="flex gap-2">
                    <button onClick={fetchReports} className="p-2 text-slate-500 hover:text-teal-500 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A1B] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {reports.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <p>No pending reports. Good job!</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Date</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Reporter</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Reason</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Content</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4 text-slate-500">
                                        {formatDistanceToNow(new Date(report.createdAt))} ago
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900 dark:text-white">{report.reporter.username}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={report.reason}>
                                        {report.reason}
                                    </td>
                                    <td className="px-6 py-4">
                                        {report.snippet ? (
                                            <Link href={`/snippet/${report.snippet.slug}`} target="_blank" className="text-teal-500 hover:underline">
                                                Snippet: {report.snippet.title}
                                            </Link>
                                        ) : report.comment ? (
                                            <span className="text-slate-500">Comment ID: {report.comment.id}</span>
                                        ) : (
                                            <span className="text-slate-400">Unknown Content</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleAction(report.id, "delete_content", report.snippet?.id)}
                                            className="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            Delete Content
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, "resolve")}
                                            className="text-emerald-500 hover:text-emerald-700 font-medium text-xs px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                        >
                                            Resolve
                                        </button>
                                        <button
                                            onClick={() => handleAction(report.id, "dismiss")}
                                            className="text-slate-400 hover:text-slate-600 font-medium text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            Dismiss
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
