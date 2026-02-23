'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/business/locations', label: 'Locations', icon: MapPin },
  { href: '/business/shifts', label: 'Shifts', icon: Calendar },
  { href: '/business/applications', label: 'Applications', icon: Users },
  { href: '/business/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/business/profile', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#132c64] z-40 transition-transform duration-200',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Image src="/instacrew-logo.png" alt="InstaCrew" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-white text-base">InstaCrew</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-white/60 hover:text-white"
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
                      ? 'bg-[#15cb89] text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="bg-white/10 rounded-xl p-3 text-xs text-white/70">
              <p className="font-semibold text-white mb-0.5">Business Portal</p>
              <p>Manage your shifts, locations and crew</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
