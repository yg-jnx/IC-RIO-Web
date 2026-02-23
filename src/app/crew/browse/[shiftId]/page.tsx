'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { crewApi } from '@/lib/api';
import { Shift } from '@/lib/types';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ShiftDetailPage() {
  const { shiftId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [coverMessage, setCoverMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Browse shifts don't have a single-shift endpoint in crew API, so we re-use browse
  const { data: browseData, isLoading } = useQuery({
    queryKey: ['crew-shift-detail', shiftId],
    queryFn: async () => {
      const res = await crewApi.browseShifts({ page: 1, page_size: 100 });
      const shifts = res.data?.shifts || [];
      return shifts.find((s: Shift) => s.shift_id === Number(shiftId)) || null;
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => crewApi.applyToShift(Number(shiftId), { cover_message: coverMessage }),
    onSuccess: () => {
      toast.success('Application submitted!');
      queryClient.invalidateQueries({ queryKey: ['crew-applications'] });
      router.push('/crew/applications');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string; detail?: string } } };
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to apply';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#ff8401] border-t-transparent" />
      </div>
    );
  }

  const shift: Shift | null = browseData;

  if (!shift) {
    return <p className="text-center text-gray-500 py-12">Shift not found</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/crew/browse">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Browse Shifts
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{shift.shift_title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {(shift.role as any)?.role_name || shift.role?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[#ff8401]">
                {formatCurrency(shift.pay_rate)}
              </p>
              <p className="text-xs text-gray-500">
                per {shift.pay_type === 'per_hour' ? 'hour' : 'shift'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-5">
          <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-gray-400">Hours</p>
                <p>{formatTime(shift.daily_start_time)} - {formatTime(shift.daily_end_time)}</p>
              </div>
            </div>
            {shift.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p>{shift.location.city}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Positions</p>
                <p>{shift.slots_remaining} available</p>
              </div>
            </div>
          </div>

          {shift.shift_requirements && (
            <div>
              <h4 className="font-medium text-[#132c64] mb-1.5">Requirements</h4>
              <p className="text-sm text-gray-600">{shift.shift_requirements}</p>
            </div>
          )}

          {shift.additional_notes && (
            <div>
              <h4 className="font-medium text-[#132c64] mb-1.5">Additional Notes</h4>
              <p className="text-sm text-gray-600">{shift.additional_notes}</p>
            </div>
          )}

          {shift.perks?.length > 0 && (
            <div>
              <h4 className="font-medium text-[#132c64] mb-2">Perks</h4>
              <div className="flex flex-wrap gap-2">
                {shift.perks.map((perk: any) => (
                  <span
                    key={perk.perk_id ?? perk.id}
                    className="bg-orange-50 text-[#ff8401] text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {perk.perk_name ?? perk.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showApplyForm ? (
            <div className="space-y-3 pt-2">
              <Textarea
                label="Cover Message (Optional)"
                placeholder="Tell the business why you're perfect for this shift..."
                rows={4}
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowApplyForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#ff8401] hover:bg-[#e07501]"
                  onClick={() => applyMutation.mutate()}
                  isLoading={applyMutation.isPending}
                >
                  Submit Application
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-full bg-[#ff8401] hover:bg-[#e07501]"
              size="lg"
              onClick={() => setShowApplyForm(true)}
              disabled={shift.slots_remaining === 0}
            >
              {shift.slots_remaining === 0 ? 'No Positions Available' : 'Apply Now'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
