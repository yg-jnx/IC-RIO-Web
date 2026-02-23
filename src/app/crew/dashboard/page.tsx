'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crewApi } from '@/lib/api';
import { CrewDashboard } from '@/lib/types';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { SHIFT_STATUS_COLORS, CREW_SHIFT_STATUS_LABELS, ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText, Clock, CheckCircle, Calendar, Search, AlertCircle,
  MapPin, LogIn, LogOut, Gift, Briefcase, Star, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

function dateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'TOMORROW';
  if (diff > 1 && diff <= 7) return `${diff}D AWAY`;
  return formatDate(dateStr).toUpperCase();
}

function ShiftCard({ crewShift, isToday, isCompleted: isCompletedSection }: { crewShift: any; isToday?: boolean; isCompleted?: boolean }) {
  const queryClient = useQueryClient();
  const assignmentId = crewShift.assignment_id ?? crewShift.shift?.assignment_id;
  const shift = crewShift.shift || crewShift;
  const assignmentStatus = crewShift.assignment_status;
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);

  const canClockIn = crewShift.actions?.can_clock_in ?? (!crewShift.is_clocked_in && assignmentStatus !== 'checked_in' && assignmentStatus !== 'completed');
  const canClockOut = crewShift.actions?.can_clock_out ?? (crewShift.is_clocked_in || assignmentStatus === 'checked_in');

  const isActive = isClockedIn ?? crewShift.is_clocked_in ?? (assignmentStatus === 'checked_in');
  const isCompleted = isCompletedSection || assignmentStatus === 'completed' || shift.shift_status === 'completed';

  const statusClass = assignmentStatus
    ? (ASSIGNMENT_STATUS_COLORS[assignmentStatus] || 'bg-gray-100 text-gray-700')
    : (SHIFT_STATUS_COLORS[shift.shift_status] || 'bg-gray-100 text-gray-700');
  const statusLabel = assignmentStatus
    ? (ASSIGNMENT_STATUS_LABELS[assignmentStatus] || assignmentStatus)
    : (CREW_SHIFT_STATUS_LABELS[shift.shift_status] || shift.shift_status);

  const payRate = crewShift.pay_rate ?? shift.pay_rate ?? crewShift.payment?.total_pay_estimate;
  const payType = crewShift.pay_type ?? shift.pay_type;
  const rawEstimate = crewShift.total_pay_estimate ?? shift.total_pay_estimate ?? crewShift.payment?.total_pay_estimate;
  const estimatedPay = rawEstimate ?? (payRate && shift.shift_duration_hours
    ? (payType === 'per_hour' ? payRate * shift.shift_duration_hours : payRate)
    : null);

  const businessName = crewShift.business_name || shift.business?.business_name || crewShift.business?.business_name;
  const businessRating = crewShift.business?.average_rating ?? shift.business?.average_rating;
  const locationName = crewShift.location_name || shift.location?.location_name || crewShift.location?.location_name;
  const locationCity = shift.location?.city || crewShift.location_city || crewShift.location?.city;
  const locationParts = [locationName, locationCity].filter(Boolean);
  const roleName = (shift.role as any)?.role_name || shift.role?.name || crewShift.role_name || crewShift.role?.role_name;
  const perks: any[] = shift.perks || crewShift.perks || [];
  const label = dateLabel(shift.shift_start_date);

  const clockInMutation = useMutation({
    mutationFn: () => crewApi.clockIn(Number(assignmentId), {}),
    onSuccess: () => { toast.success('Clocked in! Have a great shift!'); setIsClockedIn(true); queryClient.invalidateQueries({ queryKey: ['crew-dashboard'] }); },
    onError: () => toast.error('Failed to clock in'),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => crewApi.clockOut(Number(assignmentId), {}),
    onSuccess: () => { toast.success('Clocked out! Great work!'); setIsClockedIn(false); queryClient.invalidateQueries({ queryKey: ['crew-dashboard'] }); },
    onError: () => toast.error('Failed to clock out'),
  });

  return (
    <div className={`rounded-xl border overflow-hidden bg-white ${isActive ? 'border-purple-300 shadow-md' : 'border-[#E5E7EB]'} w-72 shrink-0`}>
      {/* Top bar */}
      <div className={`px-3 py-2 flex items-center justify-between ${isActive ? 'bg-purple-600' : isToday ? 'bg-[#132c64]' : isCompleted ? 'bg-gray-500' : 'bg-gray-700'}`}>
        <span className="text-xs font-bold text-white tracking-wider">
          {isActive ? '🟣 NOW WORKING' : isCompleted ? '✅ COMPLETED' : label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Shift title + role + rating */}
        <div>
          <h3 className="font-bold text-[#132c64] text-sm leading-tight">{shift.shift_title}</h3>
          <div className="flex items-center gap-3 mt-0.5">
            {roleName && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{roleName}</span>
              </div>
            )}
            {businessRating != null && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-500">{Number(businessRating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Business + Location */}
        {(businessName || locationParts.length > 0) && (
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span className="text-xs text-gray-600 leading-snug">
              {[businessName, ...locationParts].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        {/* Date / Time */}
        <div className="bg-gray-50 rounded-lg p-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="h-3 w-3 text-gray-400" />
            {formatDate(shift.shift_start_date)}
            <span className="text-gray-300">·</span>
            <Clock className="h-3 w-3 text-gray-400" />
            {formatTime(shift.daily_start_time)} – {formatTime(shift.daily_end_time)}
            {shift.shift_duration_hours ? ` (${shift.shift_duration_hours}h)` : ''}
          </div>

          {/* Pay */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            {payRate && (
              <span className="font-bold text-[#ff8401]">
                {formatCurrency(payRate)}/{payType === 'per_hour' ? 'hr' : 'shift'}
              </span>
            )}
            {!isCompleted && estimatedPay && (
              <span className="text-gray-400">· Est. <span className="font-semibold text-gray-600">{formatCurrency(estimatedPay)}</span></span>
            )}
            {isCompleted && crewShift.total_pay && (
              <span className="font-bold text-green-600">💰 {formatCurrency(crewShift.total_pay)} earned</span>
            )}
          </div>
        </div>

        {/* Perks */}
        {perks.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Gift className="h-3.5 w-3.5 text-gray-400" />
            {perks.slice(0, 3).map((p: any, i: number) => (
              <span key={p.perk_id ?? p.id ?? i} className="text-xs bg-orange-50 text-[#ff8401] border border-orange-100 px-2 py-0.5 rounded-full">
                {p.perk_name || p.name}
              </span>
            ))}
            {perks.length > 3 && <span className="text-xs text-gray-400">+{perks.length - 3}</span>}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-0.5">
          {!isCompleted && !crewShift.clock_out_time && (
            isActive || (isClockedIn === null && canClockOut) ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                onClick={(e) => { e.preventDefault(); clockOutMutation.mutate(); }}
                isLoading={clockOutMutation.isPending}
              >
                <LogOut className="h-3 w-3 mr-1" />
                Clock Out
              </Button>
            ) : canClockIn ? (
              <Button
                size="sm"
                className="flex-1 bg-[#ff8401] hover:bg-[#e07501] text-xs"
                onClick={(e) => { e.preventDefault(); clockInMutation.mutate(); }}
                isLoading={clockInMutation.isPending}
              >
                <LogIn className="h-3 w-3 mr-1" />
                Clock In
              </Button>
            ) : null
          )}
          <Link href={`/crew/assignments/${assignmentId}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full border-[#132c64] text-[#132c64] hover:bg-blue-50 text-xs">
              Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function HorizontalShiftList({ shifts, isToday, isCompleted }: { shifts: any[]; isToday?: boolean; isCompleted?: boolean }) {
  if (!shifts.length) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {shifts.map((s) => (
        <ShiftCard key={s.assignment_id} crewShift={s} isToday={isToday} isCompleted={isCompleted} />
      ))}
    </div>
  );
}

function QuickActionCard({ href, icon: Icon, label, iconBg, iconColor }: {
  href: string; icon: React.ElementType; label: string; iconBg: string; iconColor: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow cursor-pointer">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <span className="text-xs font-medium text-[#132c64] text-center leading-tight">{label}</span>
      </div>
    </Link>
  );
}

export default function CrewDashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<CrewDashboard>({
    queryKey: ['crew-dashboard'],
    queryFn: async () => {
      const res = await crewApi.getDashboard();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#ff8401] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <p className="text-gray-600">Failed to load dashboard</p>
      </div>
    );
  }

  const summary = data?.summary;
  const todaysShifts = data?.todays_shifts || [];
  const upcomingShifts = data?.upcoming_shifts || [];
  const completedShifts = (data as any)?.completed_shifts || [];

  const hasAnyShifts = todaysShifts.length > 0 || upcomingShifts.length > 0 || completedShifts.length > 0;

  // Onboarding/verification banner
  const showOnboarding = user && (!(user as any).signupCompleted || !(user as any).isVerified);

  return (
    <div className="space-y-6">
      {/* Header with avatar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/crew/profile">
            <div className="w-12 h-12 rounded-full bg-[#ff8401] flex items-center justify-center text-white font-bold text-lg shadow-sm cursor-pointer hover:opacity-90">
              {user?.username?.[0]?.toUpperCase() || 'C'}
            </div>
          </Link>
          <div>
            <p className="text-xs text-gray-500">Welcome back</p>
            <h1 className="text-lg font-bold text-[#132c64] leading-tight">{user?.username || 'Crew Member'}</h1>
          </div>
        </div>
        <Link href="/crew/browse">
          <Button className="bg-[#ff8401] hover:bg-[#e07501]">
            <Search className="h-4 w-4 mr-2" />
            Find Shifts
          </Button>
        </Link>
      </div>

      {/* Onboarding banner */}
      {showOnboarding && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${
          !(user as any).signupCompleted
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            !(user as any).signupCompleted ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <AlertCircle className={`h-5 w-5 ${!(user as any).signupCompleted ? 'text-amber-500' : 'text-blue-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${!(user as any).signupCompleted ? 'text-amber-700' : 'text-blue-700'}`}>
              {!(user as any).signupCompleted ? 'Complete Your Profile' : 'Verification Pending'}
            </p>
            <p className={`text-xs mt-0.5 ${!(user as any).signupCompleted ? 'text-amber-600' : 'text-blue-600'}`}>
              {!(user as any).signupCompleted
                ? 'Finish onboarding to apply for shifts and start earning'
                : 'Your profile is under review (usually 24-48 hours)'}
            </p>
          </div>
          <Link href={!(user as any).signupCompleted ? '/crew/onboarding' : '/crew/profile'}>
            <div className={`flex items-center gap-1 text-xs font-semibold ${!(user as any).signupCompleted ? 'text-amber-600' : 'text-blue-600'}`}>
              {!(user as any).signupCompleted ? 'Complete' : 'View'}
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/crew/applications">
          <div className="bg-orange-50 rounded-2xl p-3 cursor-pointer hover:bg-orange-100 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#ff8401] flex items-center justify-center mb-2">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <p className="text-xl font-bold text-[#132c64]">{summary?.active_applications || 0}</p>
            <p className="text-xs text-gray-500">Applications</p>
          </div>
        </Link>
        <Link href="/crew/assignments">
          <div className="bg-green-50 rounded-2xl p-3 cursor-pointer hover:bg-green-100 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center mb-2">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <p className="text-xl font-bold text-[#132c64]">{summary?.completed_shifts || 0}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </Link>
        <Link href="/crew/assignments">
          <div className="bg-amber-50 rounded-2xl p-3 cursor-pointer hover:bg-amber-100 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center mb-2">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <p className="text-xl font-bold text-[#132c64]">{summary?.upcoming_shifts || 0}</p>
            <p className="text-xs text-gray-500">Upcoming</p>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-[#132c64] uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickActionCard href="/crew/browse" icon={Search} label="Browse Shifts" iconBg="bg-orange-100" iconColor="text-[#ff8401]" />
          <QuickActionCard href="/crew/applications" icon={FileText} label="My Applications" iconBg="bg-amber-100" iconColor="text-amber-500" />
          <QuickActionCard href="/crew/assignments" icon={Clock} label="My Shifts" iconBg="bg-orange-50" iconColor="text-[#ff8401]" />
        </div>
      </div>

      {/* Today's Shifts */}
      {todaysShifts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#132c64]">Today&apos;s Shifts</h2>
            <Link href="/crew/assignments" className="text-sm text-[#ff8401] font-medium hover:underline">
              See All →
            </Link>
          </div>
          <HorizontalShiftList shifts={todaysShifts} isToday />
        </div>
      )}

      {/* Upcoming Shifts */}
      {upcomingShifts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#132c64]">Upcoming Shifts</h2>
            <Link href="/crew/assignments" className="text-sm text-[#ff8401] font-medium hover:underline">
              See All →
            </Link>
          </div>
          <HorizontalShiftList shifts={upcomingShifts} />
        </div>
      )}

      {/* Recently Completed */}
      {completedShifts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#132c64]">Recently Completed</h2>
            <Link href="/crew/assignments" className="text-sm text-[#ff8401] font-medium hover:underline">
              See All →
            </Link>
          </div>
          <HorizontalShiftList shifts={completedShifts.slice(0, 5)} isCompleted />
        </div>
      )}

      {/* Empty state */}
      {!hasAnyShifts && (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
          <Calendar className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No Shifts Yet</p>
          <p className="text-gray-400 text-sm mb-4">Start browsing and apply to get started</p>
          <Link href="/crew/browse">
            <Button className="bg-[#ff8401] hover:bg-[#e07501]">
              <Search className="h-4 w-4 mr-2" />
              Browse Shifts
            </Button>
          </Link>
        </div>
      )}

      {/* Coming Soon */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Coming Soon</h2>
          <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">In Development</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '⭐', title: 'Skill Badges', desc: 'Earn badges and increase profile visibility', color: '#F59E0B' },
            { icon: '🏆', title: 'Leaderboard', desc: 'Compete with other crew members', color: '#8B5CF6' },
            { icon: '💰', title: 'Quick Pay', desc: 'Get paid instantly after shifts', color: '#10B981' },
            { icon: '📚', title: 'Training Hub', desc: 'Access free courses and certifications', color: '#3B82F6' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-3 border border-[#E5E7EB] opacity-60 relative">
              <div className="absolute top-2 right-2 text-gray-300">🔒</div>
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-sm font-semibold text-[#132c64]">{f.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
