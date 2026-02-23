'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { businessApi } from '@/lib/api';
import { Shift, Application } from '@/lib/types';
import { SHIFT_STATUS_COLORS, SHIFT_STATUS_LABELS } from '@/lib/constants';
import { formatDate, formatTime, formatCurrency, calcShiftEarnings } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Calendar, Clock, Users, MapPin, Star, Check, X, AlertCircle, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// CrewProfileModal — fetches full profile via API
// ---------------------------------------------------------------------------
function CrewProfileModal({ crewId, fallbackName, onClose }: { crewId: number; fallbackName: string; onClose: () => void }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['crew-profile', crewId],
    queryFn: async () => {
      const res = await businessApi.getCrewProfile(crewId);
      return res.data;
    },
    enabled: !!crewId,
  });

  const fullName = profile?.personal_details?.full_name || fallbackName || 'Crew Member';
  const rating = profile?.ratings?.average_rating ?? null;
  const totalReviews = profile?.ratings?.total_reviews ?? 0;
  const wouldHireAgainPct = profile?.ratings?.would_hire_again_pct ?? null;
  const primaryRoleRaw = profile?.work_preferences?.primary_role;
  const primaryRole = typeof primaryRoleRaw === 'string' && primaryRoleRaw.trim() ? primaryRoleRaw : null;
  const experience = profile?.work_preferences?.experience || profile?.skills_experience?.previous_experience || null;
  const previousEmployer = profile?.work_preferences?.previous_employer || profile?.skills_experience?.previous_employer || null;
  const phone = profile?.personal_details?.phone || null;
  const email = profile?.personal_details?.email || null;
  const location = profile?.personal_details?.location || null;
  const hasLicense = profile?.verification?.has_driving_license ?? false;
  const licenseType = profile?.verification?.license_type || null;
  const isVerified = profile?.verification?.is_verified ?? false;
  const memberSince = profile?.personal_details?.member_since || null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] shrink-0">
          <h2 className="font-semibold text-[#132c64] text-base">Crew Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-7 w-7 rounded-full border-4 border-[#15cb89] border-t-transparent" />
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Avatar + name + rating */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#132c64] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {fullName[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#132c64] text-lg leading-tight">{fullName}</p>
                    {isVerified && (
                      <span className="text-xs bg-[#15cb89]/10 text-[#15cb89] px-2 py-0.5 rounded-full font-medium">Verified</span>
                    )}
                  </div>
                  {primaryRole && <p className="text-sm text-gray-500 mt-0.5">{primaryRole}</p>}
                  {rating != null ? (
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                      <span className="text-sm font-medium text-gray-700 ml-1">{rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">No ratings yet</p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              {(wouldHireAgainPct != null || memberSince) && (
                <div className="grid grid-cols-2 gap-3">
                  {wouldHireAgainPct != null && (
                    <div className="bg-[#15cb89]/10 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#15cb89]">{Math.round(wouldHireAgainPct)}%</p>
                      <p className="text-xs text-gray-500 mt-0.5">Would hire again</p>
                    </div>
                  )}
                  {memberSince && (
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-blue-600">{new Date(memberSince).getFullYear()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Member since</p>
                    </div>
                  )}
                </div>
              )}

              {/* Contact info */}
              {(phone || email || location) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center justify-between gap-2 text-sm bg-[#15cb89]/10 border border-[#15cb89]/30 text-[#15cb89] rounded-xl px-4 py-3 hover:bg-[#15cb89]/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>📞</span>
                        <span className="font-medium text-[#132c64]">{phone}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#15cb89]">Call</span>
                    </a>
                  )}
                  {email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-gray-400">✉️</span>
                      <span className="truncate">{email}</span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Experience */}
              {experience && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Experience</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{experience}</p>
                </div>
              )}

              {previousEmployer && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Previous Employer</p>
                  <p className="text-sm text-gray-700">{previousEmployer}</p>
                </div>
              )}

              {/* Driving license */}
              {hasLicense && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3">
                  <span className="text-blue-500">🚗</span>
                  <p className="text-sm text-blue-700 font-medium">
                    Driving License{licenseType ? ` — ${licenseType}` : ''}
                  </p>
                </div>
              )}

              {/* Availability */}
              {profile?.availability?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Availability</p>
                  <div className="grid grid-cols-7 gap-1">
                    {profile.availability.map((slot: any) => (
                      <div
                        key={slot.day}
                        className={`flex flex-col items-center py-2 px-1 rounded-lg text-center ${
                          slot.available ? 'bg-[#15cb89]/10 text-[#15cb89]' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <span className="text-[10px] font-semibold">{slot.day?.slice(0, 3)}</span>
                        <span className="text-[9px] mt-0.5">{slot.available ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RateCrewModal — full proper modal per documentation
// ---------------------------------------------------------------------------
function RateCrewModal({
  crew,
  shiftTitle,
  shiftDate,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  crew: any;
  shiftTitle: string;
  shiftDate: string;
  onClose: () => void;
  onSubmit: (data: {
    work_quality_rating: number;
    punctuality_rating: number;
    professionalism_rating: number;
    teamwork_rating: number;
    would_hire_again: boolean;
    followed_instructions: boolean;
    appropriate_attire: boolean;
    review_comment?: string;
    private_notes?: string;
  }) => void;
  isSubmitting: boolean;
}) {
  const [ratings, setRatings] = useState({
    work_quality_rating: 0,
    punctuality_rating: 0,
    professionalism_rating: 0,
    teamwork_rating: 0,
  });
  const [wouldHireAgain, setWouldHireAgain] = useState<boolean | null>(null);
  const [followedInstructions, setFollowedInstructions] = useState<boolean | null>(null);
  const [appropriateAttire, setAppropriateAttire] = useState<boolean | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const starQuestions = [
    { key: 'work_quality_rating', label: 'Work Quality' },
    { key: 'punctuality_rating', label: 'Punctuality' },
    { key: 'professionalism_rating', label: 'Professionalism' },
    { key: 'teamwork_rating', label: 'Teamwork' },
  ] as const;

  const boolQuestions = [
    { key: 'would_hire_again', label: 'Would you hire again?', value: wouldHireAgain, setter: setWouldHireAgain },
    { key: 'followed_instructions', label: 'Followed instructions?', value: followedInstructions, setter: setFollowedInstructions },
    { key: 'appropriate_attire', label: 'Appropriate attire?', value: appropriateAttire, setter: setAppropriateAttire },
  ] as const;

  function validate() {
    const errs: Record<string, string> = {};
    starQuestions.forEach(({ key, label }) => {
      if (!ratings[key] || ratings[key] < 1) errs[key] = `Please rate ${label}`;
    });
    if (wouldHireAgain === null) errs.would_hire_again = 'Please select Yes or No';
    if (followedInstructions === null) errs.followed_instructions = 'Please select Yes or No';
    if (appropriateAttire === null) errs.appropriate_attire = 'Please select Yes or No';
    if (reviewComment.length > 1000) errs.review_comment = 'Max 1000 characters';
    if (privateNotes.length > 500) errs.private_notes = 'Max 500 characters';
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      ...ratings,
      would_hire_again: wouldHireAgain!,
      followed_instructions: followedInstructions!,
      appropriate_attire: appropriateAttire!,
      review_comment: reviewComment || undefined,
      private_notes: privateNotes || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E5E7EB] shrink-0">
          <div>
            <h2 className="font-semibold text-[#132c64] text-base">Rate {crew?.full_name || 'Crew Member'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{shiftTitle} • {formatDate(shiftDate)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Star ratings */}
          <div>
            <div className="space-y-4">
              {starQuestions.map(({ key, label }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{label} <span className="text-red-400">*</span></span>
                    <StarRatingInput
                      value={ratings[key]}
                      onChange={(v) => {
                        setRatings((prev) => ({ ...prev, [key]: v }));
                        setErrors((prev) => ({ ...prev, [key]: '' }));
                      }}
                    />
                  </div>
                  {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Boolean questions */}
          <div className="space-y-3">
            {boolQuestions.map(({ key, label, value, setter }) => (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label} <span className="text-red-400">*</span></span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setter(true); setErrors((prev) => ({ ...prev, [key]: '' })); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${value === true ? 'bg-[#132c64] text-white' : 'border border-[#E5E7EB] text-gray-600 hover:border-[#132c64]'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => { setter(false); setErrors((prev) => ({ ...prev, [key]: '' })); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${value === false ? 'bg-red-500 text-white' : 'border border-[#E5E7EB] text-gray-600 hover:border-red-300'}`}
                    >
                      No
                    </button>
                  </div>
                </div>
                {errors[key] && <p className="text-xs text-red-500 mt-0.5">{errors[key]}</p>}
              </div>
            ))}
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Comments */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 font-medium block mb-1.5">
                Comments for crew <span className="text-gray-400 font-normal">(optional, visible to crew)</span>
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  if (e.target.value.length <= 1000) setErrors((prev) => ({ ...prev, review_comment: '' }));
                }}
                rows={3}
                maxLength={1000}
                placeholder="Great work! Would love to have you back..."
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#132c64]"
              />
              <div className="flex justify-between items-center mt-0.5">
                {errors.review_comment && <p className="text-xs text-red-500">{errors.review_comment}</p>}
                <p className="text-[10px] text-gray-400 ml-auto">{reviewComment.length}/1000</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700 font-medium block mb-1.5">
                Private notes <span className="text-gray-400 font-normal">(optional, only you can see)</span>
              </label>
              <textarea
                value={privateNotes}
                onChange={(e) => {
                  setPrivateNotes(e.target.value);
                  if (e.target.value.length <= 500) setErrors((prev) => ({ ...prev, private_notes: '' }));
                }}
                rows={2}
                maxLength={500}
                placeholder="Consider for full-time position..."
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#132c64]"
              />
              <div className="flex justify-between items-center mt-0.5">
                {errors.private_notes && <p className="text-xs text-red-500">{errors.private_notes}</p>}
                <p className="text-[10px] text-gray-400 ml-auto">{privateNotes.length}/500</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E5E7EB] shrink-0">
          <Button
            className="w-full"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Submit Rating
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StarRatingInput
// ---------------------------------------------------------------------------
function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star className={`h-6 w-6 transition-colors ${star <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClockSummary — fetches clock events for a checked_out / completed assignment
// ---------------------------------------------------------------------------
function ClockSummary({
  assignmentId,
  payRate,
  payType,
  scheduledHours,
}: {
  assignmentId: number;
  payRate: number;
  payType: string;
  scheduledHours: number;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['clock-events', assignmentId],
    queryFn: async () => {
      const res = await businessApi.getClockEvents(assignmentId);
      return res.data;
    },
    enabled: !!assignmentId,
  });

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
        <div className="animate-spin h-3 w-3 rounded-full border-2 border-[#15cb89] border-t-transparent shrink-0" />
        Loading hours...
      </div>
    );
  }

  // Real API returns { events: [...], summary: { clock_in_time, clock_out_time, ... } }
  const summary = data?.summary;
  const events: any[] = data?.events || [];

  if (!summary?.has_clocked_in && !events.length) return null;

  const clockIn: string | null = summary?.clock_in_time
    ?? events.find((e: any) => e.event_type === 'clock_in')?.event_timestamp
    ?? null;
  const clockOut: string | null = summary?.clock_out_time
    ?? events.find((e: any) => e.event_type === 'clock_out')?.event_timestamp
    ?? null;

  let actualHours: number | null = null;
  if (clockIn && clockOut) {
    const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    actualHours = Math.round((diffMs / 3_600_000) * 100) / 100;
  }

  const actualEarnings =
    actualHours != null && payType === 'per_hour'
      ? payRate * actualHours
      : payType === 'per_shift'
      ? payRate
      : null;

  const hoursDiff = actualHours != null && scheduledHours > 0
    ? Math.round((actualHours - scheduledHours) * 100) / 100
    : null;
  const showDiff = hoursDiff != null && Math.abs(hoursDiff) >= 0.25;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="mt-2 bg-[#132c64]/5 border border-[#132c64]/10 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-[#132c64] uppercase tracking-wide">⏰ Actual Hours Worked</p>

      {/* Clock in / out times */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex flex-col">
          <span className="text-gray-400">Clock In</span>
          <span className="font-medium text-[#132c64]">{clockIn ? fmt(clockIn) : '--'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400">Clock Out</span>
          <span className="font-medium text-[#132c64]">{clockOut ? fmt(clockOut) : '--'}</span>
        </div>
      </div>

      {/* Hours + pay summary */}
      {actualHours != null && (
        <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#132c64]/10">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#15cb89]" />
            <span className="text-sm font-bold text-[#132c64]">
              {actualHours.toFixed(2)} hr{actualHours !== 1 ? 's' : ''}
            </span>
          </div>
          {actualEarnings != null && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-400">Actual pay:</span>
              <span className="font-bold text-[#15cb89]">£{actualEarnings.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Hours difference vs scheduled */}
      {showDiff && hoursDiff != null && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          {hoursDiff > 0
            ? <span className="text-amber-500">↑ {hoursDiff.toFixed(2)} hrs over scheduled</span>
            : <span className="text-gray-400">↓ {Math.abs(hoursDiff).toFixed(2)} hrs under scheduled</span>
          }
        </p>
      )}
      <p className="text-[10px] text-gray-400 italic">
        * Actual hours may differ from scheduled hours due to early/late clock-in or clock-out.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ApplicationCard
// ---------------------------------------------------------------------------
function ApplicationCard({
  app,
  shiftStatus,
  shiftTitle,
  shiftDate,
  payRate,
  payType,
  scheduledHours,
  onReview,
  onRate,
  isRating,
}: {
  app: Application;
  shiftStatus: string;
  shiftTitle: string;
  shiftDate: string;
  payRate: number;
  payType: string;
  scheduledHours: number;
  onReview: (id: number, approved: boolean, reason?: string) => void;
  onRate: (assignmentId: number, data: object) => void;
  isRating: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const statusColors: Record<string, string> = {
    pending:   'bg-orange-100 text-orange-800',
    applied:   'bg-orange-100 text-orange-800',
    approved:  'bg-green-100 text-green-800',
    accepted:  'bg-green-100 text-green-800',
    rejected:  'bg-red-100 text-red-800',
    declined:  'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  const statusLabels: Record<string, string> = {
    pending:   'Pending Review',
    applied:   'Pending Review',
    approved:  'Accepted',
    accepted:  'Accepted',
    rejected:  'Rejected',
    declined:  'Rejected',
    withdrawn: 'Withdrawn',
    cancelled: 'Cancelled',
  };

  const isPending = app.status === 'pending' || app.status === 'applied';
  const isAccepted = app.status === 'accepted' || app.status === 'approved';

  // Per docs: eligibility = assignment_status === 'completed' && has_bo_rated === false
  const assignmentStatus = (app as any).assignment_status;
  const hasBORated = (app as any).has_bo_rated === true;
  const assignmentId = app.assignment_id ?? (app as any).assignment?.assignment_id ?? null;

  // Show rate button when: accepted, assignment completed, not yet rated
  const canRate = isAccepted && assignmentStatus === 'completed' && !hasBORated;

  const displayLabel = statusLabels[app.status] ?? app.status ?? 'Unknown';
  const displayColor = statusColors[app.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <>
      {showProfile && app.crew?.user_id && (
        <CrewProfileModal
          crewId={app.crew.user_id}
          fallbackName={app.crew?.full_name || ''}
          onClose={() => setShowProfile(false)}
        />
      )}
      {showRatingModal && (
        <RateCrewModal
          crew={app.crew}
          shiftTitle={shiftTitle}
          shiftDate={shiftDate}
          isSubmitting={isRating}
          onClose={() => setShowRatingModal(false)}
          onSubmit={(data) => {
            if (assignmentId) {
              onRate(assignmentId, data);
            } else {
              toast.error('Assignment ID not found. Cannot submit rating.');
            }
            setShowRatingModal(false);
          }}
        />
      )}

      <div className="p-4 border border-[#E5E7EB] rounded-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full bg-[#132c64] flex items-center justify-center text-white font-bold shrink-0 hover:opacity-80 transition-opacity"
            >
              {app.crew?.full_name?.[0] || 'C'}
            </button>
            <div>
              <p className="font-medium text-[#132c64]">{app.crew?.full_name || 'Crew Member'}</p>
              {app.crew?.rating ? (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3 w-3 ${s <= Math.round(app.crew!.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                  ))}
                  <span className="text-xs font-medium text-gray-600 ml-1">{app.crew.rating.toFixed(1)}</span>
                  {app.crew.review_count != null && (
                    <span className="text-[10px] text-gray-400 ml-0.5">({app.crew.review_count})</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Applied {formatDate(app.applied_at)}</p>
              )}
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${displayColor}`}>
            {displayLabel}
          </span>
        </div>

        {/* View Profile — always visible */}
        <button
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#132c64] border border-[#E5E7EB] rounded-lg py-1.5 hover:bg-gray-50 transition-colors mb-3"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Profile
        </button>

        {app.cover_message && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
            {app.cover_message}
          </p>
        )}

        {/* Clock in/out actual hours + earnings — shown once crew has clocked out */}
        {isAccepted && assignmentId && ['completed', 'checked_out'].includes(assignmentStatus) && (
          <ClockSummary assignmentId={assignmentId} payRate={payRate} payType={payType} scheduledHours={scheduledHours} />
        )}

        {/* Accept / Reject for pending */}
        {isPending && (
          <div className="flex gap-2 mt-3">
            {showRejectInput ? (
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onReview(app.application_id, false, rejectionReason);
                      setShowRejectInput(false);
                    }}
                  >
                    Confirm Rejection
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button size="sm" onClick={() => onReview(app.application_id, true)} className="flex-1">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectInput(true)}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        )}

        {/* Rate button */}
        {canRate && (
          <div className="mt-3">
            <button
              onClick={() => setShowRatingModal(true)}
              className="w-full text-sm px-3 py-2 rounded-lg bg-[#15cb89] text-white hover:bg-[#12b578] transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Star className="h-4 w-4 fill-white" />
              Rate Crew Member
            </button>
          </div>
        )}

        {/* BO's submitted review of crew */}
        {isAccepted && hasBORated && (
          <div className="mt-3 space-y-2">
            {(app as any).my_feedback_to_crew && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-500">Your rating:</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round((app as any).my_feedback_to_crew.stars) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">{((app as any).my_feedback_to_crew.stars).toFixed(1)}</span>
                  </div>
                </div>
                {(app as any).my_feedback_to_crew.comment && (
                  <p className="text-xs text-gray-600 italic">"{(app as any).my_feedback_to_crew.comment}"</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Crew's review of the business */}
        {isAccepted && (app as any).rating_from_crew && (
          <div className="mt-2 bg-blue-50 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-blue-600">Crew's review:</span>
              <div className="flex items-center gap-0.5 ml-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round((app as any).rating_from_crew.stars) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
                <span className="text-xs text-gray-600 ml-1">{((app as any).rating_from_crew.stars).toFixed(1)}</span>
              </div>
            </div>
            {(app as any).rating_from_crew.comment ? (
              <p className="text-xs text-blue-700 italic">"{(app as any).rating_from_crew.comment}"</p>
            ) : (
              <p className="text-xs text-blue-400">No comment left</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// ShiftDetailPage
// ---------------------------------------------------------------------------
export default function ShiftDetailPage() {
  const { shiftId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: shift, isLoading } = useQuery<Shift>({
    queryKey: ['shift', shiftId],
    queryFn: async () => {
      const res = await businessApi.getShift(Number(shiftId));
      return res.data;
    },
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['shift-applications', shiftId],
    queryFn: async () => {
      const res = await businessApi.getShiftApplications(Number(shiftId));
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, is_approved, rejection_reason }: {
      id: number; is_approved: boolean; rejection_reason?: string;
    }) => businessApi.reviewApplication(id, { is_approved, rejection_reason }),
    onSuccess: () => {
      toast.success('Application reviewed!');
      queryClient.invalidateQueries({ queryKey: ['shift-applications', shiftId] });
      queryClient.invalidateQueries({ queryKey: ['business-dashboard'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.detail || 'Failed to review application';
      toast.error(msg);
    },
  });

  const rateMutation = useMutation({
    mutationFn: (data: {
      shift_assignment_id: number;
      work_quality_rating: number;
      punctuality_rating: number;
      professionalism_rating: number;
      teamwork_rating: number;
      would_hire_again: boolean;
      followed_instructions: boolean;
      appropriate_attire: boolean;
      review_comment?: string;
      private_notes?: string;
    }) => businessApi.rateCrewMember(data),
    onSuccess: () => {
      toast.success('Rating submitted!');
      queryClient.invalidateQueries({ queryKey: ['shift-applications', shiftId] });
      queryClient.invalidateQueries({ queryKey: ['shift', shiftId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.detail || 'Failed to submit rating';
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => businessApi.cancelShift(Number(shiftId)),
    onSuccess: () => {
      toast.success('Shift cancelled');
      router.push('/business/shifts');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.response?.data?.detail || 'Failed to cancel shift';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#15cb89] border-t-transparent" />
      </div>
    );
  }

  if (!shift) {
    return <p className="text-center text-gray-500 py-12">Shift not found</p>;
  }

  const rawApplications = applicationsData?.applications || applicationsData?.data || applicationsData || [];
  const applications: Application[] = rawApplications.map((app: any) => {
    // API may return crew data under crew_member or crew
    const crewData = app.crew || app.crew_member || null;
    const normalizedCrew = crewData ? {
      user_id: crewData.crew_member_id ?? crewData.user_id ?? crewData.crew_id,
      full_name: crewData.full_name,
      profile_photo: crewData.profile_photo,
      rating: crewData.average_rating ?? crewData.rating,
      review_count: crewData.review_count ?? crewData.completed_shifts,
      city: crewData.city,
      postcode: crewData.postcode,
      gender: crewData.gender,
      date_of_birth: crewData.date_of_birth,
      previous_experience: crewData.previous_experience,
      previous_employer: crewData.previous_employer,
    } : null;
    return {
      ...app,
      status: app.application_status || app.status || 'pending',
      crew: normalizedCrew,
    };
  });

  const statusClass = SHIFT_STATUS_COLORS[shift.shift_status] || 'bg-gray-100 text-gray-700';
  const statusLabel = SHIFT_STATUS_LABELS[shift.shift_status] || shift.shift_status;

  const totalEarnings = calcShiftEarnings({
    startDate: shift.shift_start_date,
    endDate: shift.shift_end_date || shift.shift_start_date,
    startTime: shift.daily_start_time,
    endTime: shift.daily_end_time,
    payRate: shift.pay_rate,
    payType: shift.pay_type,
    crewNeeded: shift.crew_needed,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/business/shifts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Shifts
          </Button>
        </Link>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Shift Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{shift.shift_title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {(shift.role as any)?.role_name || shift.role?.name || 'Unknown Role'}
              </p>
            </div>
            <p className="text-lg font-bold text-[#15cb89]">
              {formatCurrency(shift.pay_rate)}/{shift.pay_type === 'per_hour' ? 'hr' : 'shift'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p>{formatDate(shift.shift_start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p>{formatTime(shift.daily_start_time)} - {formatTime(shift.daily_end_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Crew</p>
                <p>{(shift as any).metrics?.assigned_count ?? shift.assigned_count ?? 0}/{shift.crew_needed} assigned</p>
              </div>
            </div>
          </div>

          {totalEarnings !== null && (
            <div className="flex items-center justify-between bg-[#132c64]/5 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-500">Approx. total payout</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {shift.pay_type === 'per_hour'
                    ? `${shift.pay_rate}/hr × ${shift.crew_needed} crew`
                    : `${formatCurrency(shift.pay_rate)}/shift × ${shift.crew_needed} crew`}
                </p>
              </div>
              <p className="text-xl font-bold text-[#132c64]">~{formatCurrency(totalEarnings)}</p>
            </div>
          )}

          {shift.shift_requirements && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Requirements</p>
              <p className="text-sm text-gray-600">{shift.shift_requirements}</p>
            </div>
          )}

          {shift.perks?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Perks</p>
              <div className="flex flex-wrap gap-2">
                {shift.perks.map((perk: any) => (
                  <span
                    key={perk.perk_id ?? perk.id}
                    className="bg-[#15cb89]/10 text-[#15cb89] text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {perk.perk_name ?? perk.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {['posted', 'pending_applications'].includes(shift.shift_status) && (
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => cancelMutation.mutate()}
                isLoading={cancelMutation.isPending}
              >
                Cancel Shift
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Applications ({applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No applications yet</p>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app.application_id}
                app={app}
                shiftStatus={shift.shift_status}
                shiftTitle={shift.shift_title}
                shiftDate={shift.shift_start_date}
                payRate={shift.pay_rate}
                payType={shift.pay_type}
                scheduledHours={shift.shift_duration_hours ?? 0}
                isRating={rateMutation.isPending}
                onReview={(id, approved, reason) =>
                  reviewMutation.mutate({ id, is_approved: approved, rejection_reason: reason })
                }
                onRate={(assignmentId, data) =>
                  rateMutation.mutate({ shift_assignment_id: assignmentId, ...(data as any) })
                }
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
