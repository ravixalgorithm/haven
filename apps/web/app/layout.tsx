import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'OPENHAVEN - Code Snippet Manager',
  description: 'Share and discover code snippets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sixtyfour&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 dark:bg-slate-900">
        <Providers>
          <SocketProvider>
            {children}
            <Toaster position="bottom-right" theme="system" />
          </SocketProvider>
        </Providers>
        {/* Grid Background Overlay - on top */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            zIndex: -1
          }}
        />
      </body>
    </html>
  );
}
