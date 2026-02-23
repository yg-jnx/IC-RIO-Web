'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
  LogOut, Building2, Mail, CreditCard, MapPin, ChevronRight,
  FileText, ShieldCheck, Lock, Cookie, Plus, List, Clock,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

function MenuLink({ href, icon: Icon, label, iconColor = 'text-[#132c64]', badge }: {
  href: string; icon: React.ElementType; label: string; iconColor?: string; badge?: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
        <Icon className={`h-5 w-5 ${iconColor} shrink-0`} />
        <span className="text-sm flex-1 text-gray-700">{label}</span>
        {badge && (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium mr-1">{badge}</span>
        )}
        <ChevronRight className="h-4 w-4 text-gray-300" />
      </div>
    </Link>
  );
}

export default function BusinessProfilePage() {
  const { user, logout } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await subscriptionApi.getStatus();
      return res.data;
    },
  });

  const statusLabel: Record<string, string> = {
    active: 'Active',
    trial_active: 'Free Trial',
    trial_expired: 'Trial Expired',
    cancelled: 'Cancelled',
    expired: 'Expired',
    past_due: 'Payment Due',
  };

  const statusColor: Record<string, string> = {
    active: 'text-green-700 bg-green-100',
    trial_active: 'text-blue-700 bg-blue-100',
    trial_expired: 'text-red-600 bg-red-100',
    cancelled: 'text-orange-600 bg-orange-100',
    expired: 'text-red-600 bg-red-100',
    past_due: 'text-red-600 bg-red-100',
  };

  const initials = user?.username?.[0]?.toUpperCase() || 'B';
  const subStatus = subscription?.status;
  const isWarning = subStatus && ['past_due', 'expired', 'trial_expired'].includes(subStatus);

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-8">
      <h1 className="text-2xl font-bold text-[#132c64]">Profile & Settings</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="bg-linear-to-br from-[#132c64] to-[#1e4080] p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-3 ring-4 ring-white/20">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{user?.username}</h2>
          <p className="text-white/70 text-sm mt-0.5">{user?.email}</p>
          <span className="mt-2 bg-[#15cb89]/20 text-[#15cb89] text-xs px-3 py-1 rounded-full font-medium border border-[#15cb89]/30">
            Business Owner
          </span>
        </div>

        <div className="p-4 divide-y divide-gray-100">
          <div className="flex items-start justify-between py-2.5">
            <span className="text-xs text-gray-500 w-28 shrink-0">Username</span>
            <span className="text-sm text-[#132c64] font-medium text-right">{user?.username}</span>
          </div>
          <div className="flex items-start justify-between py-2.5">
            <span className="text-xs text-gray-500 w-28 shrink-0">Email</span>
            <span className="text-sm text-[#132c64] font-medium text-right">{user?.email}</span>
          </div>
          <div className="flex items-start justify-between py-2.5">
            <span className="text-xs text-gray-500 w-28 shrink-0">Account Type</span>
            <span className="text-sm text-[#132c64] font-medium text-right">Business Owner</span>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <Link href="/business/subscription">
        <div className={`rounded-2xl border-2 p-4 cursor-pointer hover:opacity-90 transition-opacity ${
          isWarning ? 'bg-red-50 border-red-200' :
          subStatus === 'active' ? 'bg-green-50 border-green-200' :
          subStatus === 'trial_active' ? 'bg-blue-50 border-blue-200' :
          'bg-white border-[#E5E7EB]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isWarning ? 'bg-red-100' :
              subStatus === 'active' ? 'bg-green-100' :
              subStatus === 'trial_active' ? 'bg-blue-100' :
              'bg-gray-100'
            }`}>
              {isWarning ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : subStatus === 'active' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <CreditCard className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#132c64]">Subscription</p>
              {subscription ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[subStatus || ''] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[subStatus || ''] || subStatus}
                  </span>
                  {subStatus === 'trial_active' && subscription.trial_days_remaining !== undefined && (
                    <span className="text-xs text-gray-500">{subscription.trial_days_remaining}d left</span>
                  )}
                  {subStatus === 'active' && subscription.current_period_end && (
                    <span className="text-xs text-gray-500">Renews {formatDate(subscription.current_period_end)}</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Loading...</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
          </div>

          {isWarning && (
            <div className="mt-3 text-xs text-red-600 font-medium">
              ⚠️ Action required — tap to fix
            </div>
          )}
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Quick Actions</h3>
        </div>
        <MenuLink href="/business/shifts/new" icon={Plus} label="Post a New Shift" iconColor="text-[#15cb89]" />
        <MenuLink href="/business/shifts" icon={List} label="My Shifts" iconColor="text-blue-500" />
        <MenuLink href="/business/locations" icon={MapPin} label="Manage Locations" iconColor="text-[#132c64]" />
        <MenuLink href="/business/applications" icon={Clock} label="Applications" iconColor="text-orange-500" />
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

      <p className="text-center text-xs text-gray-300">InstaCrew Web · v1.0</p>
    </div>
  );
}
