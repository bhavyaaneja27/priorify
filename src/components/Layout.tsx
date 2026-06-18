import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Sidebar: hidden on mobile, fixed on desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content: full width on mobile, offset by sidebar on desktop */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Bottom nav: visible only on mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
