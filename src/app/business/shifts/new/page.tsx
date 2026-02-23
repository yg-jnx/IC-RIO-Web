'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { businessApi, subscriptionApi } from '@/lib/api';
import { ROLES, PERKS, ROLE_REQUIREMENTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, CreditCard } from 'lucide-react';
import { calcShiftEarnings, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const schema = z.object({
  location_id: z.string().min(1, 'Select a location'),
  role_id: z.string().min(1, 'Select a role'),
  shift_title: z.string().min(3, 'Title must be at least 3 characters'),
  shift_requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
  crew_needed: z.string().min(1, 'At least 1 crew member needed'),
  shift_start_date: z.string().min(1, 'Start date is required'),
  shift_end_date: z.string().min(1, 'End date is required'),
  daily_start_time: z.string().min(1, 'Start time is required'),
  daily_end_time: z.string().min(1, 'End time is required'),
  pay_rate: z.string().min(1, 'Pay rate is required'),
  pay_type: z.enum(['per_hour', 'per_shift']),
  perk_ids: z.array(z.number()).optional(),
  additional_notes: z.string().optional(),
  publish_immediately: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewShiftPage() {
  const router = useRouter();

  const {
    data: subscriptionData,
    isLoading: isCheckingSubscription,
    isFetching: isSubscriptionFetching,
  } = useQuery({
    queryKey: ['subscription-status-new-shift'],
    queryFn: async () => {
      const res = await subscriptionApi.getStatus();
      return res.data;
    },
    retry: 1,
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await businessApi.getLocations();
      return res.data;
    },
  });

  const locations = locationsData?.locations || locationsData || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      pay_type: 'per_hour',
      perk_ids: [],
      publish_immediately: true,
      crew_needed: '1',
    },
  });

  const selectedPerks = watch('perk_ids') || [];
  const watchedRoleId = useWatch({ control, name: 'role_id' });
  const requirementsEdited = useRef(false);

  // Auto-select first location when locations load
  useEffect(() => {
    if (locations.length === 1) {
      setValue('location_id', String(locations[0].location_id));
    }
  }, [locations.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill requirements when role is selected (unless user has manually edited)
  useEffect(() => {
    if (!watchedRoleId || requirementsEdited.current) return;
    const role = ROLES.find((r) => String(r.id) === String(watchedRoleId));
    if (role && ROLE_REQUIREMENTS[role.name]) {
      setValue('shift_requirements', ROLE_REQUIREMENTS[role.name]);
    }
  }, [watchedRoleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedFields = watch(['shift_start_date', 'shift_end_date', 'daily_start_time', 'daily_end_time', 'pay_rate', 'pay_type', 'crew_needed']);
  const [wStartDate, wEndDate, wStartTime, wEndTime, wPayRate, wPayType, wCrewNeeded] = watchedFields;

  const liveEarnings = calcShiftEarnings({
    startDate: wStartDate,
    endDate: wEndDate,
    startTime: wStartTime,
    endTime: wEndTime,
    payRate: Number(wPayRate),
    payType: wPayType,
    crewNeeded: Number(wCrewNeeded),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await businessApi.postShift({
        ...data,
        location_id: Number(data.location_id),
        role_id: Number(data.role_id),
        crew_needed: Number(data.crew_needed),
        pay_rate: Number(data.pay_rate),
      });
      toast.success('Shift posted successfully!');
      router.push('/business/shifts');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string } } };
      const msg = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to post shift';
      toast.error(msg);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Show loading spinner while checking subscription (always fresh fetch on mount)
  if (isCheckingSubscription || isSubscriptionFetching) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#15cb89] border-t-transparent" />
      </div>
    );
  }

  // Block access if subscription data loaded and has_access is false
  if (subscriptionData != null && !subscriptionData.has_access) {
    const statusMessages: Record<string, string> = {
      trial_expired: 'Your free trial has ended.',
      expired: 'Your subscription has expired.',
      cancelled: 'Your subscription has been cancelled.',
      past_due: 'Your payment is overdue.',
    };
    const msg = statusMessages[subscriptionData.status] || 'You don\'t have an active subscription.';

    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <CreditCard className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#132c64]">Subscription Required</h1>
          <p className="text-gray-500 text-sm mt-2">{msg} Subscribe to continue posting shifts.</p>
        </div>
        <div className="space-y-3">
          <Link href="/business/subscription">
            <Button className="w-full bg-[#15cb89] hover:bg-[#12b077]">
              <CreditCard className="h-4 w-4 mr-2" />
              View Subscription Plans
            </Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#132c64]">Post a Shift</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below to post a new shift</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shift Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <Select
              label="Location"
              options={locations.map((l: { location_id: number; location_name: string }) => ({
                value: l.location_id,
                label: l.location_name,
              }))}
              placeholder="Select a location"
              error={errors.location_id?.message}
              {...register('location_id')}
            />
            <Select
              label="Role"
              options={ROLES.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Select a role"
              error={errors.role_id?.message}
              {...register('role_id')}
            />
            <Input
              label="Shift Title"
              placeholder="e.g. Weekend Bartender"
              error={errors.shift_title?.message}
              {...register('shift_title')}
            />
            <Textarea
              label="Requirements"
              placeholder="Select a role above to auto-fill requirements, or type your own..."
              rows={5}
              error={errors.shift_requirements?.message}
              {...register('shift_requirements', {
                onChange: () => { requirementsEdited.current = true; },
              })}
            />
            <Input
              label="Crew Needed"
              type="number"
              min={1}
              error={errors.crew_needed?.message}
              {...register('crew_needed')}
            />
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                min={today}
                error={errors.shift_start_date?.message}
                {...register('shift_start_date')}
              />
              <Input
                label="End Date"
                type="date"
                min={today}
                error={errors.shift_end_date?.message}
                {...register('shift_end_date')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                error={errors.daily_start_time?.message}
                {...register('daily_start_time')}
              />
              <Input
                label="End Time"
                type="time"
                error={errors.daily_end_time?.message}
                {...register('daily_end_time')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pay */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pay Rate</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pay Rate (£)"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.pay_rate?.message}
                {...register('pay_rate')}
              />
              <Select
                label="Pay Type"
                options={[
                  { value: 'per_hour', label: 'Per Hour' },
                  { value: 'per_shift', label: 'Per Shift' },
                ]}
                error={errors.pay_type?.message}
                {...register('pay_type')}
              />
            </div>

            {/* Pay disclaimers */}
            <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  You are responsible for paying the correct National Minimum Wage based on
                  the worker&apos;s age and legal status.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  Payment should be made to the crew member within 24 hours of shift completion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings estimate */}
        {liveEarnings !== null && (
          <div className="flex items-center justify-between bg-[#132c64] rounded-2xl px-5 py-4">
            <div>
              <p className="text-sm text-white/70">Approximate total payout</p>
              <p className="text-xs text-white/50 mt-0.5">
                {wPayType === 'per_hour'
                  ? `£${Number(wPayRate).toFixed(2)}/hr × ${wCrewNeeded} crew`
                  : `£${Number(wPayRate).toFixed(2)}/shift × ${wCrewNeeded} crew`}
              </p>
            </div>
            <p className="text-2xl font-bold text-[#15cb89]">~{formatCurrency(liveEarnings)}</p>
          </div>
        )}

        {/* Perks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perks (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Controller
              name="perk_ids"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PERKS.map((perk) => {
                    const isSelected = field.value?.includes(perk.id);
                    return (
                      <button
                        key={perk.id}
                        type="button"
                        onClick={() => {
                          const current = field.value || [];
                          field.onChange(
                            isSelected
                              ? current.filter((id) => id !== perk.id)
                              : [...current, perk.id]
                          );
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                          isSelected
                            ? 'bg-[#15cb89]/10 border-[#15cb89] text-[#15cb89]'
                            : 'bg-white border-[#E5E7EB] text-gray-600 hover:border-[#15cb89]'
                        }`}
                      >
                        {perk.name}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              placeholder="Any additional information for crew members..."
              rows={3}
              {...register('additional_notes')}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            Post Shift
          </Button>
        </div>
      </form>
    </div>
  );
}
