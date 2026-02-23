'use client';

import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/lib/api';
import { SHIFT_STATUS_COLORS, SHIFT_STATUS_LABELS } from '@/lib/constants';
import { formatDate, formatTime, formatCurrency, calcShiftEarnings } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Clock, AlertCircle, Gift } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Shift } from '@/lib/types';

const STATUS_FILTERS = [
  { value: '', label: 'All Shifts' },
  { value: 'posted', label: 'Open' },
  { value: 'pending_applications', label: 'Has Applicants' },
  { value: 'filled', label: 'Filled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

function ShiftCard({ shift }: { shift: any }) {
  const statusClass = SHIFT_STATUS_COLORS[shift.shift_status] || 'bg-gray-100 text-gray-700';
  const statusLabel = SHIFT_STATUS_LABELS[shift.shift_status] || shift.shift_status;
  const roleName = shift.role?.role_name || shift.role?.name || 'Unknown Role';
  const locationName = shift.location?.location_name || shift.location?.city || '';
  const assignedCount = shift.metrics?.assigned_count ?? shift.assigned_count ?? 0;
  const pendingApplications = shift.metrics?.pending_applications ?? 0;
  const applicationsCount = shift.metrics?.applications_count ?? shift.applications_count ?? 0;
  const canCancel = ['posted', 'pending_applications'].includes(shift.shift_status);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-4">
        {/* Title row */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-[#132c64] truncate">{shift.shift_title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {roleName}{locationName ? ` • ${locationName}` : ''}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* 4-col metrics grid */}
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          <div className="bg-gray-50 rounded-lg py-2 px-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 font-medium leading-tight">{formatDate(shift.shift_start_date)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg py-2 px-1">
            <Clock className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 font-medium leading-tight">
              {formatTime(shift.daily_start_time)}-{formatTime(shift.daily_end_time)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg py-2 px-1">
            <Users className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 font-medium leading-tight">{assignedCount}/{shift.crew_needed}</p>
            <p className="text-[10px] text-gray-400">filled</p>
          </div>
          <div className="bg-gray-50 rounded-lg py-2 px-1">
            <span className="text-xs text-gray-400 block mb-1">💰</span>
            <p className="text-xs text-[#15cb89] font-semibold leading-tight">
              {formatCurrency(shift.pay_rate)}
            </p>
            <p className="text-[10px] text-gray-400">/{shift.pay_type === 'per_hour' ? 'hr' : 'shift'}</p>
          </div>
        </div>

        {/* Perks */}
        {shift.perks?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {shift.perks.slice(0, 3).map((perk: any) => (
              <span
                key={perk.perk_id ?? perk.id}
                className="inline-flex items-center gap-1 bg-[#15cb89]/10 text-[#15cb89] text-[10px] font-medium px-2 py-0.5 rounded-full"
              >
                <Gift className="h-2.5 w-2.5" />
                {perk.perk_name ?? perk.name}
              </span>
            ))}
            {shift.perks.length > 3 && (
              <span className="text-[10px] text-gray-400 font-medium px-1 py-0.5">
                +{shift.perks.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Pending applications banner */}
        {pendingApplications > 0 && (
          <Link href={`/business/shifts/${shift.shift_id}`}>
            <div className="mt-3 flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 hover:bg-orange-100 transition-colors">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-medium text-orange-700">
                  {pendingApplications} pending application{pendingApplications !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-orange-500">→</span>
            </div>
          </Link>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-2">
          {canCancel && (
            <Link href={`/business/shifts/${shift.shift_id}`} className="flex-1">
              <button className="w-full text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
                Cancel Shift
              </button>
            </Link>
          )}
          <Link href={`/business/shifts/${shift.shift_id}`} className="flex-1">
            <button className="w-full text-xs px-3 py-1.5 rounded-lg bg-[#132c64] text-white hover:bg-[#0f2150] transition-colors font-medium">
              {applicationsCount > 0 ? `View Applications (${applicationsCount})` : 'View Details'}
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShiftsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['business-shifts', page],
    queryFn: async () => {
      const res = await businessApi.getAllShifts(page, 20);
      return res.data;
    },
  });

  const shifts: Shift[] = data?.shifts || data || [];

  const filtered = statusFilter
    ? shifts.filter((s) => s.shift_status === statusFilter)
    : shifts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#132c64]">Shifts</h1>
        <Link href="/business/shifts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Post Shift
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-[#132c64] text-white'
                : 'bg-white border border-[#E5E7EB] text-gray-600 hover:border-[#15cb89]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#15cb89] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-gray-500">Failed to load shifts</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No shifts found</p>
          <Link href="/business/shifts/new">
            <Button>Post Your First Shift</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shift) => (
            <ShiftCard key={shift.shift_id} shift={shift} />
          ))}
        </div>
      )}
    </div>
  );
}
