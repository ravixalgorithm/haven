'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SnippetCard from '@/components/SnippetCard';

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

const FEATURED_CATEGORIES = [
  {
    label: 'FRONTEND',
    title: 'React & Vue',
    description: 'Modern component patterns and hooks for building beautiful UIs.',
    tagline: 'Most Popular',
    color: 'bg-teal-400',
    textColor: 'text-slate-900',
  },
  {
    label: 'BACKEND',
    title: 'APIs & Servers',
    description: 'REST, GraphQL, and server-side patterns for scalable backends.',
    tagline: 'Trending',
    color: 'bg-slate-900',
    textColor: 'text-white',
  },
  {
    label: 'DATA',
    title: 'Python & SQL',
    description: 'Data processing, analysis, and database query patterns.',
    tagline: 'Fast Growing',
    color: 'bg-purple-300',
    textColor: 'text-slate-900',
  },
  {
    label: 'DEVOPS',
    title: 'CLI & Scripts',
    description: 'Automation scripts, CI/CD, and command-line utilities.',
    tagline: 'Essential',
    color: 'bg-yellow-300',
    textColor: 'text-slate-900',
  },
];

export default function Home() {
  const [trending, setTrending] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3002/api/v1/trending?limit=6')
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
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0a] grid-bg">

      {/* Hero Section - With Floating Quotes */}
      <section className="relative bg-transparent py-20 md:py-28 overflow-hidden">

        {/* Floating Quotes */}
        <div className="absolute top-20 left-[10%] hidden lg:block animate-pulse">
          <div className="bg-teal-100 dark:bg-teal-900/30 px-4 py-2 rounded-full text-teal-700 dark:text-teal-300 text-sm font-medium shadow-lg">
            &ldquo;Finally, a place for my snippets!&rdquo;
          </div>
        </div>
        <div className="absolute top-32 right-[8%] hidden lg:block animate-pulse delay-300">
          <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium shadow-lg">
            &ldquo;Saved me hours of work&rdquo; ⚡
          </div>
        </div>
        <div className="absolute bottom-24 left-[15%] hidden lg:block animate-pulse delay-700">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-full text-yellow-700 dark:text-yellow-300 text-sm font-medium shadow-lg">
            &ldquo;Best snippet library ever&rdquo; 🔥
          </div>
        </div>
        <div className="absolute bottom-32 right-[12%] hidden lg:block animate-pulse delay-500">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-slate-700 dark:text-slate-300 text-sm font-medium shadow-lg">
            &ldquo;10x my productivity&rdquo; 🚀
          </div>
        </div>

        {/* Decorative Dots */}
        <div className="absolute top-40 left-[5%] w-2 h-2 bg-teal-400 rounded-full animate-ping" />
        <div className="absolute bottom-40 right-[5%] w-3 h-3 bg-purple-400 rounded-full animate-ping delay-500" />
        <div className="absolute top-1/2 left-[3%] w-2 h-2 bg-yellow-400 rounded-full animate-ping delay-1000" />

        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
            Code Sharing, Making<br />
            <span className="text-slate-900 dark:text-white">Easy to </span>
            <span className="text-teal-500">Build Faster.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Discover and share code snippets with developers worldwide
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/feed"
              className="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full transition-colors"
            >
              Explore Snippets
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories - Colorful Cards */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Featured Snippets
          </h2>
          <Link
            href="/feed"
            className="text-slate-600 dark:text-slate-400 hover:text-teal-500 font-medium flex items-center gap-1"
          >
            Explore All
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              href={`/feed?q=${cat.title.toLowerCase()}`}
              className={`${cat.color} ${cat.textColor} p-6 rounded-2xl flex flex-col justify-between min-h-[220px] hover:opacity-95 transition-opacity group`}
            >
              <div>
                <span className="text-xs font-bold opacity-70 uppercase tracking-wider">
                  {cat.label}
                </span>
                <h3 className="text-xl font-bold mt-2 mb-2">{cat.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium opacity-70">{cat.tagline}</span>
                <span className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.color === 'bg-slate-900' ? 'bg-white/20' : 'bg-black/10'} group-hover:scale-110 transition-transform`}>
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Trending Now
          </h2>
          <Link
            href="/feed"
            className="text-slate-600 dark:text-slate-400 hover:text-teal-500 font-medium"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-6 animate-pulse border border-slate-200 dark:border-slate-800">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-6" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trending.map((snippet) => (
              <SnippetCard key={snippet.id} {...snippet} />
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                About OpenHaven
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-6">
                OpenHaven is an open-source platform built by developers, for developers. We believe sharing code snippets should be easy, fast, and accessible to everyone. Our mission is to help developers learn faster by connecting them with battle-tested solutions from the community.
              </p>
              <p className="text-slate-500 dark:text-slate-500 mb-6">
                Built with ❤️ by <span className="font-medium text-teal-600 dark:text-teal-400">Open Dev Society</span>
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-teal-500 hover:text-teal-600 font-medium"
              >
                Learn more about us →
              </Link>
            </div>
            <div className="flex-shrink-0">
              <img
                src="https://avatars.githubusercontent.com/u/177231203?s=200&v=4"
                alt="Open Dev Society"
                className="w-32 h-32 rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white">Terms Policy</Link>
              <span>•</span>
              <Link href="/about" className="hover:text-slate-900 dark:hover:text-white">About Us</Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>© {new Date().getFullYear()} OpenHaven</span>
              <span>•</span>
              <span>Open Dev Society</span>
              <Link href="https://github.com/opendevsociety" className="ml-2 w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-slate-400 transition-colors">
                →
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
