'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crewApi } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Calendar, Clock, MapPin, Building2, Star, Gift, Briefcase,
  LogIn, LogOut, CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type ShiftTab = 'today' | 'upcoming' | 'completed';

const TABS: { id: ShiftTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDisplayStatus(assignment: any) {
  const asgStatus = assignment.assignment_status?.toLowerCase();
  const shiftStatus = assignment.shift?.shift_status?.toLowerCase();

  if (asgStatus === 'no_show') return { label: 'No Show', color: 'bg-red-100 text-red-700', canClockIn: false, canClockOut: false };
  if (asgStatus === 'cancelled') return { label: 'Cancelled', color: 'bg-red-100 text-red-700', canClockIn: false, canClockOut: false };
  if (asgStatus === 'withdrawn') return { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600', canClockIn: false, canClockOut: false };
  if (asgStatus === 'checked_in') return { label: 'Checked In', color: 'bg-green-100 text-green-700', canClockIn: false, canClockOut: true };
  if (asgStatus === 'checked_out') return { label: 'Checked Out', color: 'bg-amber-100 text-amber-700', canClockIn: false, canClockOut: false };
  if (asgStatus === 'completed' || shiftStatus === 'completed') return { label: 'Completed', color: 'bg-green-100 text-green-700', canClockIn: false, canClockOut: false };
  if (asgStatus === 'confirmed' || asgStatus === 'assigned') return { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', canClockIn: assignment.actions?.can_clock_in || false, canClockOut: false };
  return { label: asgStatus || 'Unknown', color: 'bg-gray-100 text-gray-600', canClockIn: false, canClockOut: false };
}

function AssignmentCard({
  assignment,
  onClockIn,
  onClockOut,
  onRate,
  isClocking,
  isCompleted: tabIsCompleted,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assignment: any;
  onClockIn: () => void;
  onClockOut: () => void;
  onRate: () => void;
  isClocking: boolean;
  isCompleted: boolean;
}) {
  const displayStatus = getDisplayStatus(assignment);
  const shift = assignment.shift || assignment;
  const location = assignment.location || shift.location || {};
  const business = assignment.business || shift.business || {};
  const role = assignment.role || shift.role || {};
  const payment = assignment.payment || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perks: any[] = shift.perks || assignment.perks || [];

  const locationStr = [location.location_name, location.city].filter(Boolean).join(', ');
  const businessName = business.business_name || assignment.business_name;
  const avgRating = business.average_rating;
  const totalReviews = business.total_reviews;
  const roleName = role.role_name || role.name || assignment.role_name;
  const payRate = payment.pay_rate ?? assignment.pay_rate ?? shift.pay_rate;
  const payType = payment.pay_type ?? assignment.pay_type ?? shift.pay_type;
  const ratingSubmitted = assignment.rating_submitted ?? assignment.has_rated ?? false;
  const ratingDetails = assignment.rating_details;
  const feedbackFromBusiness = assignment.feedback_from_business;

  // Duration
  let durationStr = '';
  const dh = shift.shift_duration_hours ?? assignment.shift_duration_hours;
  if (dh) {
    durationStr = `${dh}h`;
  } else if (shift.daily_start_time && shift.daily_end_time) {
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

  const showRateButton = tabIsCompleted && assignment.assignment_status !== 'no_show' && !ratingSubmitted;

  return (
    <Link href={`/crew/assignments/${assignment.assignment_id}`}>
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm mb-4 cursor-pointer hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Business avatar */}
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-[#ff8401]">
                {businessName?.[0]?.toUpperCase() || 'B'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide truncate">
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

              {/* Business rating */}
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
            <span className="text-sm font-bold text-green-600">
              £{typeof payRate === 'number' ? payRate.toFixed(2) : payRate}
              {payType === 'per_hour' ? '/hr' : ' per shift'}
            </span>
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

        {/* Submitted rating */}
        {ratingSubmitted && ratingDetails && (
          <div className="mx-4 mb-3 bg-gray-50 rounded-xl p-3 border-l-4 border-[#ff8401]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${s <= (ratingDetails.stars ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-medium">Your Review</span>
            </div>
            {ratingDetails.comment && (
              <p className="text-xs text-[#132c64] italic">&ldquo;{ratingDetails.comment}&rdquo;</p>
            )}
          </div>
        )}

        {/* Business feedback */}
        {feedbackFromBusiness && (
          <div className="mx-4 mb-3 bg-green-50 rounded-xl p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${s <= (feedbackFromBusiness.stars ?? 0) ? 'text-green-500 fill-green-500' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-green-700 font-bold uppercase tracking-wide">Business Feedback</span>
            </div>
            <p className="text-xs text-[#132c64] italic">
              &ldquo;{feedbackFromBusiness.comment || 'No comment provided.'}&rdquo;
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 pb-4" onClick={(e) => e.preventDefault()}>
          {(displayStatus.canClockIn || displayStatus.canClockOut || showRateButton) && (
            <div className="flex gap-2 mt-1">
              {displayStatus.canClockIn && (
                <button
                  onClick={(e) => { e.preventDefault(); onClockIn(); }}
                  disabled={isClocking}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#ff8401] hover:bg-[#e07501] text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <LogIn className="h-4 w-4" />
                  {isClocking ? 'Clocking In…' : 'Clock In'}
                </button>
              )}
              {displayStatus.canClockOut && (
                <button
                  onClick={(e) => { e.preventDefault(); onClockOut(); }}
                  disabled={isClocking}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  {isClocking ? 'Clocking Out…' : 'Clock Out'}
                </button>
              )}
              {showRateButton && (
                <button
                  onClick={(e) => { e.preventDefault(); onRate(); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#ff8401] hover:bg-[#e07501] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  <Star className="h-4 w-4" />
                  Rate Business
                </button>
              )}
            </div>
          )}
          {!displayStatus.canClockIn && !displayStatus.canClockOut && !showRateButton && (
            <div className="flex justify-end mt-1">
              <span className="text-xs text-[#ff8401] font-semibold flex items-center gap-1">
                View Details →
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<ShiftTab>('today');
  const [clockingId, setClockingId] = useState<number | null>(null);
  const [showRatingId, setShowRatingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['crew-dashboard'],
    queryFn: async () => {
      const res = await crewApi.getDashboard();
      return res.data;
    },
  });

  const clockInMutation = useMutation({
    mutationFn: (assignmentId: number) => crewApi.clockIn(assignmentId, {}),
    onSuccess: () => {
      toast.success('Clocked in! Have a great shift!');
      queryClient.invalidateQueries({ queryKey: ['crew-dashboard'] });
      setClockingId(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to clock in');
      setClockingId(null);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: (assignmentId: number) => crewApi.clockOut(assignmentId, {}),
    onSuccess: () => {
      toast.success('Clocked out! Great work today!');
      queryClient.invalidateQueries({ queryKey: ['crew-dashboard'] });
      setClockingId(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to clock out');
      setClockingId(null);
    },
  });

  const todayShifts = data?.todays_shifts || [];
  const upcomingShifts = data?.upcoming_shifts || [];
  const completedShifts = data?.completed_shifts || [];

  const getTabCount = (tab: ShiftTab) => {
    if (tab === 'today') return todayShifts.length;
    if (tab === 'upcoming') return upcomingShifts.length;
    return completedShifts.length;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentShifts: any[] =
    selectedTab === 'today' ? todayShifts :
    selectedTab === 'upcoming' ? upcomingShifts :
    completedShifts;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#132c64] mb-4">My Shifts</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 -mx-4 px-4">
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
      ) : currentShifts.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">No {selectedTab} shifts</p>
          <p className="text-gray-400 text-sm">
            {selectedTab === 'today' && 'No shifts scheduled for today'}
            {selectedTab === 'upcoming' && 'No upcoming shifts scheduled'}
            {selectedTab === 'completed' && 'No completed shifts yet'}
          </p>
        </div>
      ) : (
        <div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {currentShifts.map((assignment: any) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              isCompleted={selectedTab === 'completed'}
              isClocking={clockingId === assignment.assignment_id}
              onClockIn={() => {
                setClockingId(assignment.assignment_id);
                clockInMutation.mutate(assignment.assignment_id);
              }}
              onClockOut={() => {
                setClockingId(assignment.assignment_id);
                clockOutMutation.mutate(assignment.assignment_id);
              }}
              onRate={() => setShowRatingId(assignment.assignment_id)}
            />
          ))}
        </div>
      )}

      {/* Simple rating modal - redirect to detail page for full rating */}
      {showRatingId && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowRatingId(null)}>
          <div className="bg-white w-full rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#132c64] mb-2">Rate This Business</h3>
            <p className="text-sm text-gray-500 mb-4">Open the shift details to submit your full rating.</p>
            <Link href={`/crew/assignments/${showRatingId}`}>
              <button
                className="w-full bg-[#ff8401] hover:bg-[#e07501] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowRatingId(null)}
              >
                <CheckCircle className="h-5 w-5" />
                Go to Shift Details
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
