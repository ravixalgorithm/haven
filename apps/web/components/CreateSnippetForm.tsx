"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '@/lib/config';

const LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'html',
    'css', 'json', 'yaml', 'bash', 'shell'
];

export default function CreateSnippetForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        language: 'javascript',
        tags: '',
    });
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const insertMarkdown = (syntax: string) => {
        const textarea = document.getElementById('description-input') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.description;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const selection = text.substring(start, end);

        let newText = text;
        const lang = formData.language;

        switch (syntax) {
            case 'bold': newText = `${before}**${selection || 'text'}**${after}`; break;
            case 'italic': newText = `${before}_${selection || 'text'}_${after}`; break;
            case 'link': newText = `${before}[${selection || 'link title'}](url)${after}`; break;
            case 'list': newText = `${before}\n- ${selection || 'item'}${after}`; break;
            case 'code-inline': newText = `${before}\`${selection || 'code'}\`${after}`; break;
            case 'code-block':
                // Ensure separation from surrounding text with double newlines
                const prefix = before.endsWith('\n') ? '\n' : '\n\n';
                const suffix = after.startsWith('\n') ? '\n' : '\n\n';
                newText = `${before}${prefix}\`\`\`${lang}\n${selection || '// Paste your code here'}\n\`\`\`${suffix}${after}`;
                break;
        }

        setFormData(prev => ({ ...prev, description: newText }));
        // Focus back
        setTimeout(() => {
            textarea.focus();
            // Restore cursor position after the inserted block? 
            // Simplified: just focus for now
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = getToken();
            if (!token) {
                setError('You must be logged in to create a snippet');
                return;
            }

            // Extract code from description (find first code block)
            const codeBlockRegex = /```[\w-]*\n([\s\S]*?)\n```/;
            const match = formData.description.match(codeBlockRegex);
            const extractedCode = match ? match[1] : '// No code block provided';

            const response = await fetch(`${API_URL}/snippets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description, // Full content
                    code: extractedCode, // Extracted for DB requirement
                    language: formData.language,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to create snippet');
                return;
            }

            const data = await response.json();
            router.push(`/snippet/${data.data.id}`);
        } catch (err) {
            setError('Something went wrong');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Title & Language Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="Snippet Title"
                        className="w-full px-4 py-3 bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white font-medium text-lg placeholder:text-slate-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Language</label>
                    <div className="relative">
                        <select
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                            className="w-full appearance-none px-4 py-3 bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white font-medium"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Markdown Description Editor */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Content</label>
                    <div className="flex bg-slate-100 dark:bg-[#272729] rounded-lg p-0.5">
                        <button
                            type="button"
                            onClick={() => setActiveTab('write')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'write' ? 'bg-white dark:bg-[#1A1A1B] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Write
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'preview' ? 'bg-white dark:bg-[#1A1A1B] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Preview
                        </button>
                    </div>
                </div>

                <div className="border border-slate-200 dark:border-[#343536] rounded-xl overflow-hidden bg-white dark:bg-[#1A1A1B] focus-within:ring-2 focus-within:ring-teal-500 transition-all shadow-sm">
                    {activeTab === 'write' ? (
                        <>
                            {/* Toolbar */}
                            <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-[#272729] bg-slate-50 dark:bg-[#1e1e1f] sticky top-0 z-10">
                                <ToolbarBtn onClick={() => insertMarkdown('bold')} label="Bold" icon={<span className="font-bold">B</span>} />
                                <ToolbarBtn onClick={() => insertMarkdown('italic')} label="Italic" icon={<span className="italic font-serif">I</span>} />
                                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                                <ToolbarBtn onClick={() => insertMarkdown('link')} label="Link" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>} />
                                <ToolbarBtn onClick={() => insertMarkdown('code-block')} label="Code Block" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                                <ToolbarBtn onClick={() => insertMarkdown('list')} label="List" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>} />
                            </div>
                            <textarea
                                id="description-input"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Share your knowledge... Use the Code Block button to insert snippets."
                                className="w-full p-6 min-h-[400px] bg-transparent resize-y outline-none dark:text-white font-mono text-sm leading-relaxed"
                            />
                        </>
                    ) : (
                        <div className="p-8 min-h-[400px] prose dark:prose-invert max-w-none font-serif leading-8 text-lg">
                            {formData.description ? (
                                <MarkdownPreview content={formData.description} />
                            ) : (
                                <span className="text-slate-400 italic font-sans">Nothing to preview</span>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-sans">
                    Tip: You can add multiple code blocks. The first one will be used for the card preview.
                </p>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tags</label>
                <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g. react, hooks, sorting (comma separated)"
                    className="w-full px-4 py-3 bg-white dark:bg-[#1A1A1B] border border-slate-200 dark:border-[#343536] rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
            >
                {loading ? 'Publishing...' : 'Publish Snippet'}
            </button>
        </form>
    );
}

function ToolbarBtn({ onClick, icon, label }: { onClick: () => void, icon?: any, label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-[#343536] hover:text-slate-900 dark:hover:text-white rounded transition-colors"
        >
            {icon}
        </button>
    );
}

function MarkdownPreview({ content }: { content: string }) {
    return (
        <ReactMarkdown
            components={{
                h1: ({ node, ...props }) => <h1 className="font-sans font-bold text-3xl mt-8 mb-4 text-slate-900 dark:text-white" {...props} />,
                h2: ({ node, ...props }) => <h2 className="font-sans font-bold text-2xl mt-8 mb-4 text-slate-900 dark:text-white" {...props} />,
                h3: ({ node, ...props }) => <h3 className="font-sans font-bold text-xl mt-6 mb-3 text-slate-900 dark:text-white" {...props} />,
                p: ({ node, ...props }) => <p className="mb-6 font-serif" {...props} />,
                pre: ({ children }) => {
                    const processNode = (node: any): string => {
                        if (typeof node === 'string') return node;
                        if (Array.isArray(node)) return node.map(processNode).join('');
                        if (node?.props) {
                            return processNode(node.props.children);
                        }
                        return '';
                    };

                    let content = '';
                    let language = 'TEXT';

                    const codeChild = Array.isArray(children) ? children[0] : children;
                    if (codeChild?.props?.className) {
                        const match = /language-(\w+)/.exec(codeChild.props.className);
                        if (match) language = match[1];
                    }

                    content = processNode(children).replace(/\n$/, '');

                    return (
                        <div className="my-8 rounded-xl overflow-hidden bg-[#050505] border border-slate-800 shadow-2xl ring-1 ring-white/5">
                            <div className="flex items-center justify-between px-5 py-3 bg-[#0a0a0a] border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                    </div>
                                    <span className="ml-3 text-xs font-mono text-slate-500 uppercase font-bold tracking-wider">
                                        {language}
                                    </span>
                                </div>
                                <CopyButton content={content} />
                            </div>
                            <pre className="p-8 overflow-x-auto text-[15px] font-mono leading-8 text-gray-300 m-0 font-sans bg-[#050505]">
                                <code>{content}</code>
                            </pre>
                        </div>
                    );
                },
                code({ children, className, ...props }) {
                    return (
                        <code className="bg-slate-100 dark:bg-[#1a1a1a] px-1.5 py-0.5 rounded text-sm font-mono text-slate-800 dark:text-teal-400 font-sans border border-slate-200 dark:border-slate-800" {...props}>
                            {children}
                        </code>
                    );
                }
            }}
        >
            {content}
        </ReactMarkdown>
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
            className="group flex items-center gap-2 text-xs font-sans font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider py-1.5 px-3 rounded-md hover:bg-white/10"
            title="Copy Code"
        >
            <span className={`transition-opacity ${copied ? 'opacity-100 text-green-400' : 'opacity-0 group-hover:opacity-100'}`}>
                {copied ? 'Copied!' : 'Copy'}
            </span>
            {copied ? (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
        </button>
    );
}

