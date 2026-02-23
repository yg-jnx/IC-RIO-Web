'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { crewApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
  LogOut, User, Mail, Phone, MapPin, Briefcase, Star,
  ChevronRight, ShieldCheck, FileText, Lock, Cookie,
  Clock, CheckCircle, AlertCircle, Key,
} from 'lucide-react';
import Link from 'next/link';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-[#132c64] font-medium text-right flex-1">{value || '—'}</span>
    </div>
  );
}

function MenuLink({ href, icon: Icon, label, iconColor = 'text-[#132c64]', textColor = 'text-gray-700' }: {
  href: string; icon: React.ElementType; label: string; iconColor?: string; textColor?: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
        <Icon className={`h-5 w-5 ${iconColor} shrink-0`} />
        <span className={`text-sm flex-1 ${textColor}`}>{label}</span>
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
    </Link>
  );
}

export default function CrewProfilePage() {
  const { user, logout } = useAuth();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['crew-profile'],
    queryFn: async () => {
      const res = await crewApi.getDashboard();
      return res.data;
    },
  });

  const summary = (profileData as any)?.summary;
  const initials = user?.username?.[0]?.toUpperCase() || 'C';

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-8">
      <h1 className="text-2xl font-bold text-[#132c64]">Profile & Settings</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="bg-linear-to-br from-[#ff8401] to-[#e07501] p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl mb-3 ring-4 ring-white/30">
            {initials}
          </div>
          <h2 className="text-xl font-bold text-white">{user?.username}</h2>
          <p className="text-white/80 text-sm mt-0.5">{user?.email}</p>
          <span className="mt-2 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
            Crew Member
          </span>

          {/* Stats row */}
          {summary && (
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20 w-full justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{summary.completed_shifts || 0}</p>
                <p className="text-xs text-white/70">Shifts Done</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{summary.active_applications || 0}</p>
                <p className="text-xs text-white/70">Applications</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{summary.upcoming_shifts || 0}</p>
                <p className="text-xs text-white/70">Upcoming</p>
              </div>
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="p-4 space-y-0 divide-y divide-gray-100">
          <InfoRow label="Username" value={`@${user?.username}`} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Account Type" value="Crew Member" />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Quick Links</h3>
        </div>
        <MenuLink href="/crew/browse" icon={Briefcase} label="Browse Shifts" iconColor="text-[#ff8401]" />
        <MenuLink href="/crew/applications" icon={FileText} label="My Applications" iconColor="text-amber-500" />
        <MenuLink href="/crew/assignments" icon={Clock} label="My Shifts" iconColor="text-[#132c64]" />
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Account Settings</h3>
        </div>
        <MenuLink href="/crew/onboarding" icon={User} label="Complete / Edit Profile" iconColor="text-[#132c64]" />
      </div>

      {/* Legal */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Legal</h3>
        </div>
        <MenuLink href="/legal/terms" icon={FileText} label="Terms & Conditions" />
        <MenuLink href="/legal/privacy" icon={ShieldCheck} label="Privacy Policy" />
        <MenuLink href="/legal/cookies" icon={Cookie} label="Cookie Policy" />
        <MenuLink href="/legal/gdpr" icon={Lock} label="GDPR Summary" />
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 text-red-500 shrink-0" />
          <span className="text-sm text-red-500 flex-1 text-left font-medium">Sign Out</span>
        </button>
      </div>

      {/* App version */}
      <p className="text-center text-xs text-gray-300">InstaCrew Web · v1.0</p>
    </div>
  );
}
