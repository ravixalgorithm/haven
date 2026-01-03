import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        About <span className="font-logo text-teal-500">OPENHAVEN</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        An open-source platform built by developers, for developers. We believe sharing code snippets should be easy, fast, and accessible to everyone.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 px-4 bg-white dark:bg-slate-800">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Our Mission</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                        OPENHAVEN is designed to help developers learn faster by connecting them with battle-tested solutions from the community. Whether you&apos;re looking for a quick utility function, a complex algorithm implementation, or inspiration for your next project, OPENHAVEN is your go-to resource.
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">What We Offer</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: 'Code Sharing', desc: 'Share your code snippets with syntax highlighting for 50+ languages' },
                            { title: 'Community Voting', desc: 'Upvote the best snippets and let quality rise to the top' },
                            { title: 'Discussion', desc: 'Comment and collaborate with other developers' },
                            { title: 'Organization', desc: 'Tag and categorize snippets for easy discovery' },
                        ].map((feature, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Source Section */}
            <section className="py-16 px-4 bg-white dark:bg-slate-800">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Open Source</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        OPENHAVEN is proudly open source. Contribute, report issues, or fork the project on GitHub.
                    </p>
                    <a
                        href="https://github.com/ravixalgorithm/haven"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        View on GitHub
                    </a>
                </div>
            </section>

            {/* Initiative Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-200 bg-teal-50 dark:bg-teal-950/30 dark:border-teal-900/50 mb-4">
                        <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                            An Initiative of Open Dev Society
                        </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                        Building tools that make developers&apos; lives easier, one project at a time.
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 bg-teal-500">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
                    <p className="text-teal-100 mb-6">Join thousands of developers sharing and discovering code.</p>
                    <Link
                        href="/signup"
                        className="inline-block px-8 py-3 bg-white text-teal-600 font-bold rounded-lg hover:bg-teal-50 transition-colors"
                    >
                        Create an Account
                    </Link>
                </div>
            </section>
        </div>
    );
}
