
export default function PrivacyPage() {
    return (
        <div className="py-4">
            <div className="bg-white dark:bg-[#1A1A1B] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                    Privacy Policy
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <div className="prose dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Welcome to OpenHaven. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Data We Collect</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
                            <li><strong>Identity Data:</strong> includes username, or similar identifier.</li>
                            <li><strong>Contact Data:</strong> includes email address.</li>
                            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, and operating system and platform.</li>
                            <li><strong>Usage Data:</strong> includes information about how you use our website, products and services (e.g., upvotes, comments, snippet views).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. How We Use Your Data</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300 mt-4">
                            <li>To register you as a new user.</li>
                            <li>To manage our relationship with you.</li>
                            <li>To improve our website, products/services, marketing of customer relationships and experiences.</li>
                            <li>To administer and protect our business and this website.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Contact Us</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:opendevsociety@gmail.com" className="text-teal-500 hover:text-teal-600">opendevsociety@gmail.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
