'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  FileText,
  Clock,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/crew/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crew/browse', label: 'Browse Shifts', icon: Search },
  { href: '/crew/applications', label: 'My Applications', icon: FileText },
  { href: '/crew/assignments', label: 'Assignments', icon: Clock },
  { href: '/crew/profile', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CrewSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-[#E5E7EB] z-40 transition-transform duration-200',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <Image src="/instacrew-logo.png" alt="InstaCrew" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-[#132c64] text-base">InstaCrew</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#ff8401] text-white'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-[#ff8401]'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-[#E5E7EB]">
            <div className="bg-orange-50 rounded-xl p-3 text-xs text-gray-600">
              <p className="font-semibold text-[#ff8401] mb-0.5">Crew Portal</p>
              <p>Find shifts and manage your work</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
