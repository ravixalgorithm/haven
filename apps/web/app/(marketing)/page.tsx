'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SnippetCard from '@/components/SnippetCard';
import { API_URL } from '@/lib/config';
import { Terminal, Code2, Share2, Zap, ArrowRight, Github, LayoutGrid, Search } from 'lucide-react';

interface Snippet {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: string;
  tags: string[];
  author: {
    username: string;
    avatarUrl?: string;
  };
  upvotes: number;
  downvotes: number;
  viewCount: number;
}

export default function Home() {
  const router = useRouter();
  const [trending, setTrending] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect logged-in users to feed
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.push('/feed');
      return;
    }
  }, [router]);

  useEffect(() => {
    fetch(`${API_URL}/trending?limit=6`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.data) {
          setTrending(data.data.snippets || []);
        } else {
          console.error('Failed to fetch trending snippets:', data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch trending snippets network error', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] overflow-x-hidden selection:bg-teal-500/30">

      {/* Navbar handled by Layout */}

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Hero Text */}
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-6 border border-teal-100 dark:border-teal-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                v1.0 Now Live
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-slate-900 dark:text-white">
                Share Code. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-500 animate-gradient-x">
                  Build Faster.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                The open-source snippet manager designed for modern developers.
                Store, organize, and discover battle-tested code patterns.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  href="/feed"
                  className="w-full sm:w-auto px-8 py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40"
                >
                  Start Exploring
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="https://github.com/open-dev-society/openhaven"
                  target="_blank"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <Github size={18} />
                  Star on GitHub
                </Link>
              </div>
            </div>

            {/* Hero Visual - Code Window */}
            <div className="flex-1 w-full max-w-xl lg:max-w-none relative perspective-1000">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 via-purple-500 to-yellow-500 rounded-2xl blur opacity-30 dark:opacity-50 animate-pulse"></div>
              <div className="relative bg-slate-50 dark:bg-[#0F0F11] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">snippet.tsx</div>
                  <div className="w-8"></div> {/* spacer */}
                </div>

                {/* Window Content */}
                <div className="p-6 font-mono text-sm md:text-base leading-relaxed overflow-x-auto">
                  <div className="text-slate-800 dark:text-slate-300">
                    <span className="text-purple-500">import</span> <span className="text-yellow-600 dark:text-yellow-400">{`{ useState }`}</span> <span className="text-purple-500">from</span> <span className="text-teal-500">'react'</span>;<br /><br />
                    <span className="text-purple-500">export function</span> <span className="text-blue-500">useCounter</span>() <span className="text-yellow-600 dark:text-yellow-400">{`{`}</span><br />
                    &nbsp;&nbsp;<span className="text-purple-500">const</span> [count, setCount] = <span className="text-blue-500">useState</span>(<span className="text-orange-500">0</span>);<br />
                    <br />
                    &nbsp;&nbsp;<span className="text-slate-500 dark:text-slate-500">// Increment securely</span><br />
                    &nbsp;&nbsp;<span className="text-purple-500">const</span> <span className="text-blue-500">increment</span> = () ={'>'} <span className="text-blue-500">setCount</span>(c ={'>'} c + <span className="text-orange-500">1</span>);<br />
                    <br />
                    &nbsp;&nbsp;<span className="text-purple-500">return</span> <span className="text-yellow-600 dark:text-yellow-400">{`{ count, increment }`}</span>;<br />
                    <span className="text-yellow-600 dark:text-yellow-400">{`}`}</span>
                  </div>

                  {/* Cursor */}
                  <div className="mt-4 flex items-center gap-2 text-teal-500">
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </div>

              {/* Float Cards */}
              <div className="absolute -bottom-6 -left-6 p-4 glass-panel rounded-xl shadow-xl flex items-center gap-3 animate-float hidden md:flex">
                <div className="bg-teal-500/20 p-2 rounded-lg text-teal-600">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Efficiency</div>
                  <div className="text-sm font-bold dark:text-white">+ 45% Faster</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* Stats Section */}
      <section className="py-20 border-y border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            {[
              { label: 'Developers', value: '10+' },
              { label: 'Snippets', value: '50+' },
              { label: 'Upvotes', value: '100+' },
              { label: 'Uptime', value: '24/7' }
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-emerald-600 mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-24 border-t border-slate-200 dark:border-white/5 relative bg-white dark:bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] -z-10 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10 opacity-50"></div>
        <div className="container mx-auto px-6 max-w-6xl relative">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <LayoutGrid className="text-teal-500" />
                Trending Snippets
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Most picked by the community this week
              </p>
            </div>
            <Link href="/feed" className="text-teal-500 hover:text-teal-400 text-sm font-semibold flex items-center gap-1 group">
              View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-white/5 rounded-xl h-64 animate-pulse border border-slate-200 dark:border-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((snippet) => (
                <div key={snippet.id} className="transform hover:-translate-y-1 transition-transform duration-300">
                  <SnippetCard {...snippet} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50 dark:bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Three simple steps to supercharge your development workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent -z-10"></div>

            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl group-hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-110 transition-transform">
                  <Search size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">1. Search</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Find the exact code pattern you need using our semantic search engine.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl group-hover:-translate-y-2 transition-transform duration-300 delay-75">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  <Code2 size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">2. Copy</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Copy the snippet with one click. TypeScript types included automatically.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl group-hover:-translate-y-2 transition-transform duration-300 delay-150">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-6 group-hover:scale-110 transition-transform">
                  <Terminal size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">3. Build</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Drop it into your project and move on to the next task. Done.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Style) */}
      <section className="py-32 bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">Why OpenHaven?</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Built to solve the fragmentation of code sharing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 rounded-3xl bg-teal-500 text-white shadow-2xl shadow-teal-500/20 hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between h-full">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 text-white backdrop-blur-md">
                <Search size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Discover</h3>
                <p className="text-teal-50 leading-relaxed font-medium">Use semantic search to find widespread patterns. No vague keywords needed.</p>
              </div>
            </div>

            <div className="grid gap-8">
              <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-purple-500/50 transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:rotate-6 transition-transform">
                    <Share2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">Post your best hooks and utilities. Help others while building your reputation.</p>
              </div>

              <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-yellow-500/50 transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:rotate-6 transition-transform">
                    <Terminal size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Integrate</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400">Copy-paste ready code. Verified and formatted.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        {/* Giant Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-bold text-white/[0.02] font-logo pointer-events-none select-none">
          O
        </div>

        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 font-logo tracking-tight">
            About OpenHaven
          </h2>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            OpenHaven is an open-source platform built by developers, for developers. We believe sharing code snippets should be easy, fast, and accessible to everyone. Our mission is to help developers learn faster by connecting them with battle-tested solutions from the community.
          </p>

          <p className="text-slate-400 font-medium mb-8">
            Built with ❤️ by <span className="text-teal-400 font-bold">Open Dev Society</span>
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="https://github.com/open-dev-society"
              target="_blank"
              className="inline-flex items-center gap-2 text-teal-400 font-bold hover:text-teal-300 transition-colors"
            >
              Learn more about us <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/5 text-center">
        <div className="container mx-auto px-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} OpenHaven. Open Source Community.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="#" className="text-slate-400 hover:text-teal-500 transition-colors">Twitter</Link>
            <Link href="#" className="text-slate-400 hover:text-teal-500 transition-colors">GitHub</Link>
            <Link href="#" className="text-slate-400 hover:text-teal-500 transition-colors">Discord</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-teal-500/50 transition-colors group">
      <div className="w-12 h-12 bg-teal-50 dark:bg-white/10 rounded-xl flex items-center justify-center text-teal-600 dark:text-white mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
