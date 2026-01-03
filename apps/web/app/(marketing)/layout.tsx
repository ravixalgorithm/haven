import Header from '@/components/Header';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Header />
            <main>{children}</main>
        </div>
    );
}

