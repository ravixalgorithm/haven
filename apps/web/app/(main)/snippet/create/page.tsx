'use client';

import CreateSnippetForm from '@/components/CreateSnippetForm';

export default function CreateSnippetPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Create New Snippet</h1>
            <div className="max-w-3xl mx-auto">
                <CreateSnippetForm />
            </div>
        </div>
    );
}

