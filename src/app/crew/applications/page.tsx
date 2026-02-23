'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crewApi } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  FileText, Calendar, Clock, MapPin, Star, AlertCircle,
  ChevronRight, Briefcase, Gift,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type ApplicationTab = 'pending' | 'rejected' | 'cancelled' | 'withdrawn';

const TABS: { id: ApplicationTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'withdrawn', label: 'Withdrawn' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDisplayStatus(app: any) {
  if (app.shift?.shift_status === 'cancelled_by_bo') {
    return { status: 'cancelled_by_bo', label: 'Cancelled by Business', color: 'bg-red-100 text-red-700' };
  }
  if (app.shift?.shift_status === 'expired') {
    return { status: 'expired', label: 'Shift Expired', color: 'bg-gray-100 text-gray-600' };
  }
  if (app.assignment_status === 'cancelled') {
    return { status: 'assignment_cancelled', label: 'Assignment Cancelled', color: 'bg-red-100 text-red-700' };
  }
  if (app.application_status === 'pending') {
    return { status: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-700' };
  }
  if (app.application_status === 'rejected') {
    return { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-600' };
  }
  if (app.application_status === 'withdrawn') {
    return { status: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-600' };
  }
  return { status: app.application_status, label: app.application_status, color: 'bg-gray-100 text-gray-600' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchesTab(app: any, tab: ApplicationTab): boolean {
  switch (tab) {
    case 'pending':
    case 'rejected':
    case 'withdrawn':
      return app.application_status === tab;
    case 'cancelled':
      return app.shift?.shift_status === 'cancelled_by_bo';
    default:
      return false;
  }
}

function ApplicationCard({
  app,
  onWithdraw,
  isWithdrawing,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: any;
  onWithdraw: (shiftId: number) => void;
  isWithdrawing: boolean;
}) {
  const displayStatus = getDisplayStatus(app);
  const canWithdraw = displayStatus.status === 'pending';

  const shift = app.shift || {};
  const location = app.location || shift.location || {};
  const business = app.business || shift.business || {};
  const role = app.role || shift.role || {};
  const payment = app.payment || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perks: any[] = shift.perks || app.perks || [];

  const locationStr = [location.location_name, location.city].filter(Boolean).join(', ');
  const payRate = payment.total_pay_estimate ?? shift.pay_rate;
  const payType = payment.pay_type ?? shift.pay_type ?? 'per_shift';
  const roleName = role.role_name || role.name || app.role_name;
  const businessName = business.business_name || app.business_name;
  const avgRating = business.average_rating;
  const totalReviews = business.total_reviews;
  const shiftId = app.shift_id || shift.shift_id;

  // Duration calculation
  let durationStr = '';
  if (shift.daily_start_time && shift.daily_end_time) {
    const [sh, sm] = shift.daily_start_time.split(':').map(Number);
    const [eh, em] = shift.daily_end_time.split(':').map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins < startMins) endMins += 24 * 60;
    const total = endMins - startMins;
    const h = Math.floor(total / 60);
    const m = total % 60;
    durationStr = m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm mb-4">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Business avatar */}
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-[#ff8401]">
              {businessName?.[0]?.toUpperCase() || 'B'}
            </span>
          </div>

          {/* Title + company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">
                  {businessName}
                </p>
                <h3 className="font-bold text-[#132c64] text-base leading-tight truncate">
                  {shift.shift_title || 'Shift'}
                </h3>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${displayStatus.color}`}>
                {displayStatus.label}
              </span>
            </div>

            {/* Rating */}
            {avgRating != null && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-amber-800">{Number(avgRating).toFixed(1)}</span>
                {totalReviews != null && (
                  <span className="text-xs text-gray-400">({totalReviews})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Role badge */}
        {roleName && (
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#ff8401] text-xs font-semibold px-2.5 py-1 rounded-lg">
              <Briefcase className="h-3 w-3" />
              {roleName}
            </span>
          </div>
        )}
      </div>

      {/* Details block */}
      <div className="mx-4 mb-3 bg-gray-50 rounded-xl p-3 space-y-1.5">
        {locationStr && (
          <div className="flex items-center gap-2 text-sm text-[#132c64]">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="font-medium">{locationStr}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#132c64]">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="font-medium">{formatDate(shift.shift_start_date)}</span>
          </div>
          {shift.daily_start_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="font-medium">
                {formatTime(shift.daily_start_time)} – {formatTime(shift.daily_end_time)}
              </span>
              {durationStr && (
                <span className="text-xs bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-md">
                  {durationStr}
                </span>
              )}
            </div>
          )}
        </div>
        {payRate != null && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-600">
              £{typeof payRate === 'number' ? payRate.toFixed(2) : payRate}
              {payType === 'per_hour' ? '/hr' : ' total'}
            </span>
          </div>
        )}
      </div>

      {/* Perks */}
      {perks.length > 0 && (
        <div className="px-4 mb-3 flex flex-wrap gap-1.5">
          {perks.slice(0, 3).map((perk: any, i: number) => (
            <span
              key={perk.perk_id ?? i}
              className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded-md"
            >
              <Gift className="h-3 w-3" />
              {perk.perk_name || perk.name}
            </span>
          ))}
          {perks.length > 3 && (
            <span className="text-xs text-gray-400 font-medium self-center">+{perks.length - 3} more</span>
          )}
        </div>
      )}

      {/* Status-specific info boxes */}
      {displayStatus.status === 'cancelled_by_bo' && shift.cancellation_reason && (
        <div className="mx-4 mb-3 flex items-start gap-2 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-600">Cancellation Reason</p>
            <p className="text-xs text-[#132c64] mt-0.5">{shift.cancellation_reason}</p>
          </div>
        </div>
      )}
      {displayStatus.status === 'assignment_cancelled' && (
        <div className="mx-4 mb-3 flex items-start gap-2 p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-600">Assignment Cancelled</p>
            <p className="text-xs text-[#132c64] mt-0.5">This shift assignment has been cancelled by the business.</p>
          </div>
        </div>
      )}
      {displayStatus.status === 'expired' && (
        <div className="mx-4 mb-3 flex items-start gap-2 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-lg">
          <Clock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-600">Shift Expired</p>
            <p className="text-xs text-gray-500 mt-0.5">This shift was not filled and has expired.</p>
          </div>
        </div>
      )}
      {displayStatus.status === 'rejected' && app.rejection_reason && (
        <div className="mx-4 mb-3 flex items-start gap-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 font-medium">{app.rejection_reason}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Applied {formatDate(app.applied_at)}
          </p>
          <div className="flex items-center gap-2">
            {canWithdraw && (
              <button
                onClick={() => onWithdraw(shiftId)}
                disabled={isWithdrawing}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isWithdrawing ? 'Withdrawing…' : 'Withdraw'}
              </button>
            )}
            {shiftId && (
              <Link href={`/crew/browse/${shiftId}`}>
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#ff8401] text-white font-semibold hover:bg-[#e07501] transition-colors">
                  View Shift
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<ApplicationTab>('pending');
  const [withdrawingShiftId, setWithdrawingShiftId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['crew-applications'],
    queryFn: async () => {
      const res = await crewApi.getMyApplications(1, 100);
      return res.data;
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (shiftId: number) => crewApi.withdrawApplication(shiftId),
    onSuccess: () => {
      toast.success('Application withdrawn successfully');
      queryClient.invalidateQueries({ queryKey: ['crew-applications'] });
      queryClient.invalidateQueries({ queryKey: ['crew-dashboard'] });
      setWithdrawingShiftId(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to withdraw application';
      toast.error(msg);
      setWithdrawingShiftId(null);
    },
  });

  const handleWithdraw = (shiftId: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    setWithdrawingShiftId(shiftId);
    withdrawMutation.mutate(shiftId);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawApplications: any[] = data?.applications || data?.data || data || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredApplications = rawApplications.filter((app: any) => matchesTab(app, selectedTab));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTabCount = (tab: ApplicationTab) => rawApplications.filter((app: any) => matchesTab(app, tab)).length;

  return (
    <div className="space-y-0">
      <h1 className="text-2xl font-bold text-[#132c64] mb-4">My Applications</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto -mx-4 px-4">
        {TABS.map((tab) => {
          const count = getTabCount(tab.id);
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'text-[#ff8401]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-[#ff8401] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff8401] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#ff8401] border-t-transparent" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">No {selectedTab} applications</p>
          <p className="text-gray-400 text-sm mb-5">
            {selectedTab === 'pending' && 'Your pending applications will appear here'}
            {selectedTab === 'rejected' && 'No rejected applications yet'}
            {selectedTab === 'cancelled' && 'No cancelled shift applications'}
            {selectedTab === 'withdrawn' && 'No withdrawn applications'}
          </p>
          {selectedTab === 'pending' && (
            <Button
              className="bg-[#ff8401] hover:bg-[#e07501]"
              onClick={() => window.location.href = '/crew/browse'}
            >
              Browse Shifts
            </Button>
          )}
        </div>
      ) : (
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filteredApplications.map((app: any) => (
            <ApplicationCard
              key={app.application_id}
              app={app}
              onWithdraw={handleWithdraw}
              isWithdrawing={withdrawingShiftId === (app.shift_id || app.shift?.shift_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
