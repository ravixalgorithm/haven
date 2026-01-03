
export default function TermsPage() {
    return (
        <div className="py-4">
            <div className="bg-white dark:bg-[#1A1A1B] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                    Terms of Service
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <div className="prose dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Agreement to Terms</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            By accessing specific contents of OpenHaven, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Intellectual Property</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of OpenHaven and its licensors. The Service is protected by copyright, trademark, and other laws of both the Country and foreign countries.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. User Content</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Code Snippets License</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Unless otherwise specified, code snippets shared on OpenHaven are made available under the MIT License. By posting a snippet, you agree to license it under these terms to other users of the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Termination</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">6. Changes</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
