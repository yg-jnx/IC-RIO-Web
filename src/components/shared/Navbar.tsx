'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell, LogOut, Menu, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout, userType } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const isBO = userType === 'BO';
  const accentColor = isBO ? '#15cb89' : '#ff8401';

  return (
    <nav className="bg-white border-b border-[#E5E7EB] h-16 flex items-center px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <Link href={isBO ? '/business/dashboard' : '/crew/dashboard'} className="flex items-center gap-2">
          <Image src="/instacrew-logo.png" alt="InstaCrew" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-[#132c64] hidden sm:block">InstaCrew</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell className="h-5 w-5 text-gray-600" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: accentColor }}
            >
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {user?.username}
            </span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50">
              <Link
                href={isBO ? '/business/profile' : '/crew/profile'}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowDropdown(false)}
              >
                <User className="h-4 w-4" />
                Profile Settings
              </Link>
              <hr className="my-1" />
              <button
                onClick={() => { setShowDropdown(false); logout(); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
