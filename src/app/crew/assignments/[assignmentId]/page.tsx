'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { crewApi } from '@/lib/api';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { CREW_SHIFT_STATUS_LABELS, ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, LogIn, LogOut, Star, Building2, Banknote, Gift, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const queryClient = useQueryClient();
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState({
    workplace_environment_rating: 0,
    management_rating: 0,
    payment_accuracy_rating: 0,
    shift_description_accuracy_rating: 0,
    perks_provided: true,
    paid_on_time: true,
    safe_working_conditions: true,
    would_work_again: true,
    shift_started_as_scheduled: true,
    review_comment: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const res = await crewApi.getDashboard();
      const dashboard = res.data;
      const all = [
        ...(dashboard?.todays_shifts || []),
        ...(dashboard?.upcoming_shifts || []),
        ...(dashboard?.completed_shifts || []),
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return all.find((a: any) => String(a.assignment_id) === String(assignmentId)) || null;
    },
    placeholderData: keepPreviousData,
  });

  const clockInMutation = useMutation({
    mutationFn: () => crewApi.clockIn(Number(assignmentId), {}),
    onSuccess: () => {
      toast.success('Clocked in successfully!');
      setIsClockedIn(true);
      queryClient.invalidateQueries({ queryKey: ['crew-dashboard'] });
    },
    onError: () => toast.error('Failed to clock in'),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => crewApi.clockOut(Number(assignmentId), {}),
    onSuccess: () => {
      toast.success('Clocked out successfully!');
      setIsClockedIn(false);
      queryClient.invalidateQueries({ queryKey: ['crew-dashboard'] });
    },
    onError: () => toast.error('Failed to clock out'),
  });

  const [ratingDone, setRatingDone] = useState(false);

  const ratingMutation = useMutation({
    mutationFn: () =>
      crewApi.rateBusiness({
        shift_assignment_id: Number(assignmentId),
        ...rating,
      }),
    onSuccess: () => {
      toast.success('Rating submitted! Thank you.');
      setShowRating(false);
      setRatingDone(true);
    },
    onError: () => toast.error('Failed to submit rating'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#ff8401] border-t-transparent" />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignment: any = data;

  if (!assignment) {
    return <p className="text-center text-gray-500 py-12">Assignment not found</p>;
  }

  // API may return shift nested under .shift, or fields directly on the object
  const shift = assignment.shift || assignment;
  const payRate = assignment.pay_rate ?? shift.pay_rate;
  const payType = assignment.pay_type ?? shift.pay_type;
  const totalPayEstimate = assignment.total_pay_estimate ?? shift.total_pay_estimate;
  const perks: any[] = shift.perks || assignment.perks || [];
  const businessName = assignment.business_name || shift.business?.business_name;
  const locationName = assignment.location_name || shift.location?.location_name;
  const locationAddress = assignment.location_address || (shift.location ? `${shift.location.address_line1 || ''}, ${shift.location.city || ''}`.trim().replace(/^,|,$/, '') : null);

  const roleName = (shift.role as any)?.role_name || shift.role?.name || assignment.role_name;
  const requirements = shift.shift_requirements || assignment.shift_requirements;
  const isCompleted = shift.shift_status === 'completed' || assignment.assignment_status === 'completed'
    || assignment.assignment_status === 'checked_out';

  // Determine clock state from the most reliable sources:
  // 1. Local optimistic state (isClockedIn) if user just clicked
  // 2. assignment_status === 'checked_in' (server-side)
  // 3. clock_in_time set AND clock_out_time not set (server-side)
  // 4. is_clocked_in flag
  const serverClockedIn =
    assignment.assignment_status === 'checked_in' ||
    (assignment.clock_in_time && !assignment.clock_out_time) ||
    assignment.is_clocked_in;
  const effectiveClockedIn = isClockedIn ?? serverClockedIn;

  // Rating: hide button if already submitted
  const ratingSubmitted = assignment.rating_submitted ?? assignment.has_rated ?? false;

  // Calculate estimated pay if total_pay_estimate not provided
  let estimatedPay = totalPayEstimate;
  if (!estimatedPay && payRate && shift.shift_duration_hours) {
    estimatedPay = payType === 'per_hour' ? payRate * shift.shift_duration_hours : payRate;
  }

  const overallRating = Math.round(
    (rating.workplace_environment_rating + rating.management_rating +
      rating.payment_accuracy_rating + rating.shift_description_accuracy_rating) / 4
  ) || 0;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Link href="/crew/assignments">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Assignments
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <CardTitle className="text-xl">{shift.shift_title}</CardTitle>
              {(() => {
                const aStatus = assignment.assignment_status;
                const label = aStatus
                  ? (ASSIGNMENT_STATUS_LABELS[aStatus] || aStatus)
                  : (CREW_SHIFT_STATUS_LABELS[shift.shift_status] || shift.shift_status);
                const cls = aStatus
                  ? (ASSIGNMENT_STATUS_COLORS[aStatus] || 'bg-gray-100 text-gray-600')
                  : 'bg-gray-100 text-gray-600';
                return (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${cls}`}>
                    {label}
                  </span>
                );
              })()}
            </div>
            {payRate != null && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-[#ff8401]">
                  {formatCurrency(payRate)}/{payType === 'per_hour' ? 'hr' : 'shift'}
                </p>
                {estimatedPay != null && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Est. {formatCurrency(estimatedPay)} total
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Business / Location */}
          {(businessName || locationName || locationAddress) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              {businessName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-[#132c64]">{businessName}</span>
                </div>
              )}
              {(locationName || locationAddress) && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    {locationName && <p className="font-medium">{locationName}</p>}
                    {locationAddress && <p className="text-gray-400 text-xs">{locationAddress}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p>{formatDate(shift.shift_start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p>{formatTime(shift.daily_start_time)} – {formatTime(shift.daily_end_time)}
                  {shift.shift_duration_hours ? <span className="text-gray-400 ml-1">({shift.shift_duration_hours}h)</span> : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Role */}
          {roleName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Role</p>
                <p className="font-medium">{roleName}</p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {requirements && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-[#132c64]">Requirements</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{requirements}</p>
            </div>
          )}

          {/* Pay breakdown */}
          {payRate != null && (
            <div className="bg-orange-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-4 w-4 text-[#ff8401]" />
                <span className="font-medium text-[#132c64]">Pay</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rate</span>
                <span className="font-medium">{formatCurrency(payRate)}/{payType === 'per_hour' ? 'hr' : 'shift'}</span>
              </div>
              {shift.shift_duration_hours > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Duration</span>
                  <span>{shift.shift_duration_hours}h</span>
                </div>
              )}
              {estimatedPay != null && (
                <div className="flex justify-between font-semibold text-[#132c64] pt-1 border-t border-orange-100">
                  <span>Estimated total</span>
                  <span className="text-[#ff8401]">{formatCurrency(estimatedPay)}</span>
                </div>
              )}
            </div>
          )}

          {/* Perks */}
          {perks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[#132c64]">
                <Gift className="h-4 w-4 text-[#ff8401]" />
                Perks
              </div>
              <div className="flex flex-wrap gap-2">
                {perks.map((perk: any, i: number) => (
                  <span
                    key={perk.perk_id ?? perk.id ?? i}
                    className="text-xs bg-orange-50 text-[#ff8401] border border-orange-100 px-2.5 py-1 rounded-full"
                  >
                    {perk.perk_name || perk.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clock In/Out Status */}
          {assignment.clock_in_time && (
            <div className="bg-green-50 rounded-lg p-3 text-sm">
              <p className="text-green-700">
                <span className="font-medium">Clocked in:</span>{' '}
                {new Date(assignment.clock_in_time).toLocaleTimeString()}
              </p>
              {assignment.clock_out_time && (
                <p className="text-green-700 mt-1">
                  <span className="font-medium">Clocked out:</span>{' '}
                  {new Date(assignment.clock_out_time).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {/* Clock In/Out Buttons */}
          {!isCompleted && !assignment.clock_out_time && (
            <div className="pt-1">
              {effectiveClockedIn ? (
                <Button
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  variant="outline"
                  size="lg"
                  onClick={() => clockOutMutation.mutate()}
                  isLoading={clockOutMutation.isPending}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Clock Out
                </Button>
              ) : (
                <Button
                  className="w-full bg-[#ff8401] hover:bg-[#e07501]"
                  size="lg"
                  onClick={() => clockInMutation.mutate()}
                  isLoading={clockInMutation.isPending}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Clock In
                </Button>
              )}
            </div>
          )}

          {/* Rate Business */}
          {isCompleted && !ratingSubmitted && !ratingDone && (
            <div className="pt-1">
              {showRating ? (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-[#132c64]">Rate this Business</p>

                  {/* Star ratings for each category */}
                  {([
                    { key: 'workplace_environment_rating', label: 'Workplace Environment' },
                    { key: 'management_rating', label: 'Management' },
                    { key: 'payment_accuracy_rating', label: 'Payment Accuracy' },
                    { key: 'shift_description_accuracy_rating', label: 'Shift Description Accuracy' },
                  ] as const).map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating((r) => ({ ...r, [key]: star }))}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 transition-colors ${
                                star <= rating[key] ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Boolean toggles */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {([
                      { key: 'perks_provided', label: 'Perks provided' },
                      { key: 'paid_on_time', label: 'Paid on time' },
                      { key: 'safe_working_conditions', label: 'Safe conditions' },
                      { key: 'would_work_again', label: 'Would work again' },
                      { key: 'shift_started_as_scheduled', label: 'Started on time' },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setRating((r) => ({ ...r, [key]: !r[key] }))}
                        className={`px-2 py-1.5 rounded-lg border text-left transition-colors ${
                          rating[key]
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                        }`}
                      >
                        {rating[key] ? '✓' : '✗'} {label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Leave a comment (optional)..."
                    value={rating.review_comment}
                    onChange={(e) => setRating((r) => ({ ...r, review_comment: e.target.value }))}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3}
                  />

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowRating(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#ff8401] hover:bg-[#e07501]"
                      onClick={() => ratingMutation.mutate()}
                      isLoading={ratingMutation.isPending}
                      disabled={overallRating === 0}
                    >
                      Submit Rating
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-[#ff8401] text-[#ff8401] hover:bg-orange-50"
                  onClick={() => setShowRating(true)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate This Business
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
