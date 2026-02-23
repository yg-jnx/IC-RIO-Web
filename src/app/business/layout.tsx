'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/shared/Navbar';
import BusinessSidebar from '@/components/shared/BusinessSidebar';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isFullScreen =
    pathname === '/business/onboarding' ||
    pathname === '/business/pending-verification';

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || userType !== 'BO')) {
      router.push('/login');
    }
  }, [isAuthenticated, userType, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#15cb89] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || userType !== 'BO') return null;

  // Onboarding and pending-verification are full-screen with no nav/sidebar
  if (isFullScreen) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <BusinessSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 min-h-[calc(100vh-4rem)]">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
