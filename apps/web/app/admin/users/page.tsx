"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { API_URL } from "@/lib/config";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/admin/users?search=${debouncedSearch}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === "success") {
                setUsers(data.data.users);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [debouncedSearch]);

    const handleBan = async (userId: string) => {
        if (!confirm("Are you sure you want to ban this user?")) return;

        const token = getToken();
        if (!token) return;

        try {
            await fetch(`${API_URL}/admin/users/${userId}/ban`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("User banned");
            fetchUsers();
        } catch (e) {
            toast.error("Failed to ban user");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#1A1A1B] text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1A1A1B] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <p>No users found.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">User</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Role</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Joined</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">Stats</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        {user.avatarUrl ? (
                                            <Image src={user.avatarUrl} alt={user.username} width={32} height={32} className="rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                                                {user.username[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{user.username}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {formatDistanceToNow(new Date(user.createdAt))} ago
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {user.snippetCount} snippets
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleBan(user.id)}
                                            className="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                            disabled={user.role === 'ADMIN'}
                                        >
                                            Ban
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
