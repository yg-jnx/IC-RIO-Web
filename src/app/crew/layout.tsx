'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/shared/Navbar';
import CrewSidebar from '@/components/shared/CrewSidebar';

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || userType !== 'CREW')) {
      router.push('/login');
    }
  }, [isAuthenticated, userType, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#ff8401] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || userType !== 'CREW') return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <CrewSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 min-h-[calc(100vh-4rem)]">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
