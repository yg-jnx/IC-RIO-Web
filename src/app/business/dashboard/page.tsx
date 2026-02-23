'use client';

import { useQuery } from '@tanstack/react-query';
import { businessApi, subscriptionApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SHIFT_STATUS_COLORS, SHIFT_STATUS_LABELS } from '@/lib/constants';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  CreditCard,
  MapPin,
  List,
  ChevronDown,
  ChevronUp,
  Zap,
  User,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return Sun;
  if (hour < 18) return Sunset;
  return Moon;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href?: string;
}) {
  const inner = (
    <div className={`rounded-2xl p-4 ${bgColor} ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-2`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-[#132c64]">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{title}</p>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  iconBg,
  iconColor,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </div>
        <span className="text-xs font-medium text-[#132c64] text-center">{label}</span>
      </div>
    </Link>
  );
}

const SHIFT_ROW_BG: Record<string, string> = {
  draft: 'bg-gray-50 hover:bg-gray-100 border border-gray-100',
  posted: 'bg-green-50 hover:bg-green-100 border border-green-100',
  pending_applications: 'bg-orange-50 hover:bg-orange-100 border border-orange-100',
  filled: 'bg-blue-50 hover:bg-blue-100 border border-blue-100',
  in_progress: 'bg-purple-50 hover:bg-purple-100 border border-purple-100',
  completed: 'bg-gray-50 hover:bg-gray-100 border border-gray-100',
  bo_review: 'bg-orange-50 hover:bg-orange-100 border border-orange-100',
  closed: 'bg-slate-50 hover:bg-slate-100 border border-slate-100',
  expired: 'bg-red-50 hover:bg-red-100 border border-red-100',
  cancelled_by_bo: 'bg-red-50 hover:bg-red-100 border border-red-100',
  no_show: 'bg-red-50 hover:bg-red-100 border border-red-100',
  disputed: 'bg-orange-50 hover:bg-orange-100 border border-orange-100',
  archived: 'bg-gray-50 hover:bg-gray-100 border border-gray-100',
};

function ShiftCard({ shift, type }: { shift: any; type: 'open' | 'pending' | 'upcoming' | 'active' | 'needsReview' }) {
  const statusClass = SHIFT_STATUS_COLORS[shift.shift_status] || 'bg-gray-100 text-gray-700';
  const statusLabel = SHIFT_STATUS_LABELS[shift.shift_status] || shift.shift_status;
  const assignedCount = shift.metrics?.assigned_count ?? shift.assigned_count ?? 0;
  const crewNeeded = shift.crew_needed ?? 1;
  const pendingApplications = shift.metrics?.pending_applications ?? 0;
  const applicationsCount = shift.metrics?.applications_count ?? 0;
  const locationName = shift.location?.location_name || shift.location?.city || '';
  const businessInitial = shift.business?.business_name?.[0]?.toUpperCase() || 'B';

  const getDaysUntil = (dateStr: string) => {
    const shiftDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    shiftDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const href = type === 'pending'
    ? `/business/shifts/${shift.shift_id}?tab=applicants`
    : `/business/shifts/${shift.shift_id}`;

  return (
    <Link href={href}>
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow w-72 shrink-0">
        {/* Top badge */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-[#E5E7EB]">
          {type === 'pending' && (
            <span className="flex items-center gap-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
              ⏳ {pendingApplications} Pending
            </span>
          )}
          {type === 'upcoming' && (
            <span className="text-xs bg-[#ff8401] text-white px-2 py-0.5 rounded-full font-medium">
              {getDaysUntil(shift.shift_start_date)}
            </span>
          )}
          {type === 'open' && applicationsCount === 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
              ⚡ No applicants
            </span>
          )}
          {type === 'needsReview' && (
            <span className="flex items-center gap-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
              ⚠ Needs Review
            </span>
          )}
          {type === 'active' && (
            <span className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-medium">
              🟣 In Progress
            </span>
          )}
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}>{statusLabel}</span>
        </div>

        <div className="p-3 space-y-2">
          {/* Header: avatar + title + location */}
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#15cb89] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">{businessInitial}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#132c64] text-sm leading-tight truncate">{shift.shift_title}</p>
              {locationName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{locationName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-lg p-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {formatDate(shift.shift_start_date)}
              <span className="text-gray-300">·</span>
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {formatTime(shift.daily_start_time)} – {formatTime(shift.daily_end_time)}
            </div>
            {shift.pay_rate && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-[#ff8401]">{formatCurrency(shift.pay_rate)}/{shift.pay_type === 'per_hour' ? 'hr' : 'shift'}</span>
                {shift.shift_duration_hours && <span className="text-gray-400">· {shift.shift_duration_hours}h</span>}
              </div>
            )}
          </div>

          {/* Applicants row */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              {applicationsCount} applicant{applicationsCount !== 1 ? 's' : ''}
            </span>
            <span className={`px-2 py-0.5 rounded-full font-medium ${
              assignedCount >= crewNeeded ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {assignedCount}/{crewNeeded} filled
            </span>
          </div>

          {/* CTA */}
          {type === 'pending' ? (
            <div className="w-full py-2 rounded-lg bg-[#132c64] text-white text-xs font-semibold text-center">
              Review Applications →
            </div>
          ) : (
            <div className="w-full py-2 rounded-lg border border-[#E5E7EB] text-[#132c64] text-xs font-medium text-center hover:bg-gray-50">
              View Details
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function ShiftRow({ shift }: { shift: any }) {
  const statusClass = SHIFT_STATUS_COLORS[shift.shift_status] || 'bg-gray-100 text-gray-700';
  const statusLabel = SHIFT_STATUS_LABELS[shift.shift_status] || shift.shift_status;
  const assignedCount = shift.metrics?.assigned_count ?? shift.assigned_count ?? 0;
  const crewNeeded = shift.crew_needed ?? 1;
  const pendingApplications = shift.metrics?.pending_applications ?? 0;
  const locationName = shift.location?.location_name || shift.location?.city || '';
  const rowBg = SHIFT_ROW_BG[shift.shift_status] || 'bg-gray-50 hover:bg-gray-100 border border-gray-100';

  return (
    <Link
      href={`/business/shifts/${shift.shift_id}`}
      className={`flex items-center justify-between p-3.5 rounded-xl transition-colors ${rowBg}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#132c64] truncate">{shift.shift_title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {locationName ? `${locationName} · ` : ''}
          {formatDate(shift.shift_start_date)} {formatTime(shift.daily_start_time)}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-500">
            👥 {assignedCount}/{crewNeeded} filled
          </span>
          {pendingApplications > 0 && (
            <span className="text-xs text-orange-600 font-medium">
              📨 {pendingApplications} pending
            </span>
          )}
        </div>
      </div>
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-3 shrink-0 ${statusClass}`}>
        {statusLabel}
      </span>
    </Link>
  );
}

function SectionWithCards({
  title,
  shifts,
  type,
  seeAllHref,
}: {
  title: string;
  shifts: any[];
  type: 'open' | 'pending' | 'upcoming' | 'active' | 'needsReview';
  seeAllHref?: string;
}) {
  if (!shifts.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-[#132c64]">{title} ({shifts.length})</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-sm text-[#15cb89] font-medium hover:underline">
            See All →
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {shifts.map((shift) => (
          <ShiftCard key={shift.shift_id} shift={shift} type={type} />
        ))}
      </div>
    </div>
  );
}

export default function BusinessDashboardPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [selectedLocation, setSelectedLocation] = useState<string | number>('all');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const { data: locationsData } = useQuery({
    queryKey: ['business-locations'],
    queryFn: async () => {
      const res = await businessApi.getLocations();
      return res.data;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['business-dashboard'],
    queryFn: async () => {
      const res = await businessApi.getAllShifts(1, 50);
      return res.data;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await subscriptionApi.getStatus();
      return res.data;
    },
    retry: 1,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#15cb89] border-t-transparent" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#132c64]">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.username}</p>
          </div>
          <Link href="/business/shifts/new">
            <Button><Plus className="h-4 w-4 mr-2" />Post Shift</Button>
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
          <p className="text-sm text-yellow-700">Could not load dashboard data. Your account is active — try refreshing.</p>
        </div>
      </div>
    );
  }

  const allShifts: any[] = data?.shifts || [];

  // Build location options
  const locationOptions = [
    { id: 'all', name: 'All Locations' },
    ...(locationsData?.locations || []).map((loc: any) => ({
      id: loc.location_id,
      name: loc.location_name,
    })),
  ];

  // Filter shifts by selected location
  const filteredShifts = selectedLocation === 'all'
    ? allShifts
    : allShifts.filter((shift) => {
        const locId = shift.location?.location_id;
        if (locId !== undefined) return String(locId) === String(selectedLocation);
        const selectedName = locationOptions.find(l => String(l.id) === String(selectedLocation))?.name;
        return selectedName && shift.location?.location_name === selectedName;
      });

  // Compute stats from filtered shifts
  const activeShiftPosts = filteredShifts.filter(s =>
    ['posted', 'pending_applications', 'filled', 'in_progress'].includes(s.shift_status)
  ).length;
  const totalApplicants = filteredShifts.reduce((sum: number, s: any) => sum + (s.metrics?.applications_count || 0), 0);
  const filledPositions = filteredShifts.reduce((sum: number, s: any) => sum + (s.metrics?.assigned_count || 0), 0);
  const pendingReviews = filteredShifts.reduce((sum: number, s: any) => sum + (s.metrics?.pending_applications || 0), 0);

  // Shift sections
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const openShifts = filteredShifts.filter(s => s.shift_status === 'posted').slice(0, 5);
  const pendingApprovals = filteredShifts.filter(s =>
    (s.metrics?.pending_applications || 0) > 0
  ).slice(0, 5);
  const activeInProgress = filteredShifts.filter(s => s.shift_status === 'in_progress').slice(0, 5);
  const needsReviewShifts = filteredShifts.filter(s => s.shift_status === 'bo_review').slice(0, 5);
  const upcomingShifts = filteredShifts.filter(shift => {
    const shiftDate = new Date(shift.shift_start_date);
    shiftDate.setHours(0, 0, 0, 0);
    return shiftDate >= todayDate &&
      shiftDate <= sevenDaysFromNow &&
      ['posted', 'pending_applications', 'filled'].includes(shift.shift_status);
  }).sort((a, b) => new Date(a.shift_start_date).getTime() - new Date(b.shift_start_date).getTime()).slice(0, 5);

  const completedShifts = filteredShifts.filter(s => s.shift_status === 'completed').slice(0, 5);

  // Subscription banner
  const renderSubscriptionBanner = () => {
    if (!subscription) return null;
    const isTrial = subscription.status === 'trial_active';
    const isActive = subscription.status === 'active';
    const isWarning = ['past_due', 'expired', 'trial_expired', 'cancelled', 'refunded'].includes(subscription.status);

    if (isWarning || !subscription.has_access) {
      const warningMsg =
        subscription.status === 'past_due' ? 'Your payment is overdue. Update your payment method to keep access.' :
        subscription.status === 'trial_expired' ? 'Your free trial has ended. Subscribe to continue posting shifts.' :
        subscription.status === 'cancelled' ? 'Your subscription has been cancelled. Reactivate to continue posting shifts.' :
        subscription.status === 'refunded' ? 'Your subscription has been refunded. Subscribe to continue posting shifts.' :
        'Your subscription has expired. Renew to continue posting shifts.';

      return (
        <Link href="/business/subscription">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{warningMsg}</p>
            <span className="text-xs font-medium text-red-600 shrink-0">Fix now →</span>
          </div>
        </Link>
      );
    }

    let daysLeft: number | null = null;
    let totalDays: number | null = null;

    if (isTrial && subscription.trial_days_remaining !== undefined) {
      daysLeft = subscription.trial_days_remaining;
      totalDays = 14;
    } else if (isActive && subscription.current_period_end) {
      const end = new Date(subscription.current_period_end);
      daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      totalDays = subscription.plan_type === 'six_month' ? 180 : 30;
    }

    if (daysLeft !== null && totalDays !== null) {
      const progressPct = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
      const barColor = daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-orange-400' : isTrial ? 'bg-blue-500' : 'bg-[#15cb89]';
      const bgColor = daysLeft <= 3 ? 'bg-red-50 border-red-200' : daysLeft <= 7 ? 'bg-orange-50 border-orange-200' : isTrial ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
      const textColor = daysLeft <= 3 ? 'text-red-700' : daysLeft <= 7 ? 'text-orange-700' : isTrial ? 'text-blue-700' : 'text-green-700';
      const label = isTrial ? 'Free Trial' : (subscription.plan_type === 'six_month' ? '6-Month Plan' : 'Monthly Plan');

      return (
        <Link href="/business/subscription">
          <div className={`border rounded-xl p-4 cursor-pointer hover:opacity-90 transition-opacity ${bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className={`h-4 w-4 ${textColor}`} />
                <span className={`text-sm font-medium ${textColor}`}>{label}</span>
              </div>
              <span className={`text-sm font-bold ${textColor}`}>
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
              </span>
            </div>
            <div className="w-full bg-white/60 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${progressPct}%` }} />
            </div>
            <p className={`text-xs mt-1.5 ${textColor} opacity-75`}>
              {subscription.current_period_end
                ? `Renews ${formatDate(subscription.current_period_end)}`
                : isTrial && subscription.trial_end_date
                ? `Trial ends ${formatDate(subscription.trial_end_date)}`
                : ''}
            </p>
          </div>
        </Link>
      );
    }

    return null;
  };

  const selectedLocationName = locationOptions.find(l => String(l.id) === String(selectedLocation))?.name || 'All Locations';

  const GreetingIcon = getGreetingIcon();
  const todayShifts = filteredShifts.filter(shift => {
    const shiftDate = new Date(shift.shift_start_date);
    shiftDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return shiftDate.getTime() === now.getTime();
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GreetingIcon className="h-5 w-5 text-[#ff8401]" />
            <p className="text-sm text-gray-500">{getGreeting()}</p>
          </div>
          <h1 className="text-2xl font-bold text-[#132c64] mt-0.5">{user?.username || 'Dashboard'}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/business/shifts/new">
          <Button className="bg-[#15cb89] hover:bg-[#12b077]">
            <Plus className="h-4 w-4 mr-2" />
            Post Shift
          </Button>
        </Link>
      </div>

      {/* Location Filter + Subscription Banner — side by side */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {/* Location Filter */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#15cb89] transition-colors min-w-48"
          >
            <MapPin className="h-4 w-4 text-[#15cb89]" />
            <span className="text-sm font-medium text-[#132c64] flex-1 text-left">{selectedLocationName}</span>
            {showLocationDropdown ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showLocationDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 min-w-56">
              {locationOptions.map((loc) => (
                <button
                  key={loc.id}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    String(selectedLocation) === String(loc.id) ? 'text-[#15cb89] font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => {
                    setSelectedLocation(loc.id);
                    setShowLocationDropdown(false);
                  }}
                >
                  {loc.name}
                  {String(selectedLocation) === String(loc.id) && (
                    <CheckCircle className="h-4 w-4 text-[#15cb89]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Banner — takes remaining space */}
        <div className="flex-1 w-full">
          {renderSubscriptionBanner()}
        </div>
      </div>

      {/* Stats Grid — capped width so cards don't over-stretch */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
        <StatCard title="Active Shifts" value={activeShiftPosts} icon={Zap} color="bg-[#15cb89]" bgColor="bg-green-50" href="/business/shifts" />
        <StatCard title="Applicants" value={totalApplicants} icon={Users} color="bg-[#ff8401]" bgColor="bg-orange-50" href="/business/shifts" />
        <StatCard title="Filled" value={filledPositions} icon={CheckCircle} color="bg-blue-500" bgColor="bg-blue-50" href="/business/shifts" />
        <StatCard title="Pending" value={pendingReviews} icon={Clock} color="bg-[#132c64]" bgColor="bg-indigo-50" href="/business/shifts" />
      </div>

      {/* Today's Shifts — prominent highlight */}
      {todayShifts.length > 0 && (
        <div className="bg-linear-to-r from-[#132c64] to-[#1a3d8a] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#15cb89]" />
              <span className="font-bold text-base">Today's Shifts</span>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">{todayShifts.length} shift{todayShifts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col gap-2">
            {todayShifts.map((shift) => {
              const assignedCount = shift.metrics?.assigned_count ?? shift.assigned_count ?? 0;
              const crewNeeded = shift.crew_needed ?? 1;
              return (
                <Link key={shift.shift_id} href={`/business/shifts/${shift.shift_id}`}>
                  <div className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{shift.shift_title}</p>
                      <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(shift.daily_start_time)} – {formatTime(shift.daily_end_time)}
                        {shift.location?.location_name && (
                          <><span className="text-white/40">·</span><MapPin className="h-3 w-3" />{shift.location.location_name}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-medium text-[#15cb89]">{assignedCount}/{crewNeeded} crew</p>
                      <p className="text-xs text-white/60 capitalize mt-0.5">{SHIFT_STATUS_LABELS[shift.shift_status] || shift.shift_status}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions — inline row, not stretched */}
      <div>
        <h2 className="text-base font-bold text-[#132c64] mb-3">Quick Actions</h2>
        <div className="flex gap-3">
          <QuickActionCard
            href="/business/shifts/new"
            icon={Plus}
            label="Post Shift"
            iconBg="bg-green-100"
            iconColor="text-[#15cb89]"
          />
          <QuickActionCard
            href="/business/shifts"
            icon={List}
            label="My Shifts"
            iconBg="bg-blue-100"
            iconColor="text-blue-500"
          />
          <QuickActionCard
            href="/business/locations"
            icon={MapPin}
            label="Locations"
            iconBg="bg-green-50"
            iconColor="text-[#15cb89]"
          />
          <QuickActionCard
            href="/business/profile"
            icon={User}
            label="Profile"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
          />
        </div>
      </div>

      {/* Shift Sections */}
      <SectionWithCards title="Open Shifts" shifts={openShifts} type="open" seeAllHref="/business/shifts" />
      <SectionWithCards title="Pending Approvals" shifts={pendingApprovals} type="pending" seeAllHref="/business/shifts" />
      <SectionWithCards title="Active In Progress" shifts={activeInProgress} type="active" seeAllHref="/business/shifts" />
      <SectionWithCards title="Needs Review" shifts={needsReviewShifts} type="needsReview" seeAllHref="/business/shifts" />
      <SectionWithCards title="Upcoming Shifts" shifts={upcomingShifts} type="upcoming" seeAllHref="/business/shifts" />

      {/* Recently Completed - as a list */}
      {completedShifts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#132c64]">Recently Completed</h2>
            <Link href="/business/shifts" className="text-sm text-[#15cb89] font-medium hover:underline">
              See All →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {completedShifts.map((shift) => (
              <ShiftRow key={shift.shift_id} shift={shift} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredShifts.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No shifts yet</p>
          <Link href="/business/shifts/new">
            <Button className="bg-[#15cb89] hover:bg-[#12b077]">Post Your First Shift</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
