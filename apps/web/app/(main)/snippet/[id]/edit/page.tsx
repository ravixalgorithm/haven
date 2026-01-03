'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';

const LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'html',
    'css', 'json', 'yaml', 'bash', 'shell'
];

export default function EditSnippetPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        title: '',
        description: '',
        code: '',
        language: 'javascript',
        tags: ''
    });

    useEffect(() => {
        const fetchSnippet = async () => {
            try {
                const res = await fetch(`${API_URL}/snippets/${params.id}`);
                if (!res.ok) throw new Error('Failed to fetch snippet');
                const data = await res.json();
                setForm({
                    title: data.data.title || '',
                    description: data.data.description || '',
                    code: data.data.code || '',
                    language: data.data.language || 'javascript',
                    tags: data.data.tags?.join(', ') || ''
                });
            } catch (err) {
                setError('Failed to load snippet');
            } finally {
                setLoading(false);
            }
        };

        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        fetchSnippet();
    }, [params.id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const tagsArray = form.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            const res = await fetch(`${API_URL}/snippets/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    code: form.code,
                    language: form.language,
                    tags: tagsArray
                })
            });

            if (res.ok) {
                router.push(`/snippet/${params.id}`);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to update snippet');
            }
        } catch (err) {
            setError('Failed to update snippet');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 w-1/3 rounded"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Edit Snippet</h1>
            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Language *
                        </label>
                        <select
                            name="language"
                            value={form.language}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description (Markdown supported)
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={6}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                            placeholder="Describe your snippet..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Code *
                        </label>
                        <textarea
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            rows={12}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-900 text-green-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
                            placeholder="Paste your code here..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={form.tags}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="react, hooks, state"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-3 rounded-lg bg-teal-500 text-white font-bold hover:bg-teal-600 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
