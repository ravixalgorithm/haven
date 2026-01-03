import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import Header from '@/components/Header';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-black">
            <Header />
            <div className="container mx-auto px-4 max-w-[1600px]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">

                    {/* Left Sidebar - Navigation */}
                    <aside className="hidden md:block md:col-span-3 lg:col-span-2">
                        <LeftSidebar />
                    </aside>

                    {/* Main Content - Feed */}
                    <main className="col-span-1 md:col-span-9 lg:col-span-7 pb-20">
                        {children}
                    </main>

                    {/* Right Sidebar - Trending/Ads */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <RightSidebar />
                    </aside>

                </div>
            </div>
        </div>
    );
}

