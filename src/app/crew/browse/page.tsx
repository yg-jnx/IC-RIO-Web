'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { crewApi } from '@/lib/api';
import { Shift, Pagination } from '@/lib/types';
import { ROLES, PERKS } from '@/lib/constants';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Clock, MapPin, Filter, X, ChevronLeft, ChevronRight, Star, Users } from 'lucide-react';
import Link from 'next/link';

type BrowseShift = Shift;

interface FilterState {
  role_id: string;
  city: string;
  min_pay_rate: string;
  pay_type: string;
  start_date_from: string;
}

export default function BrowsePage() {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    role_id: '',
    city: '',
    min_pay_rate: '',
    pay_type: '',
    start_date_from: '',
  });
  const [activeFilters, setActiveFilters] = useState<FilterState>(filters);

  const { data, isLoading } = useQuery({
    queryKey: ['browse-shifts', page, activeFilters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, page_size: 20 };
      Object.entries(activeFilters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await crewApi.browseShifts(params);
      return res.data;
    },
  });

  const shifts: BrowseShift[] = data?.shifts || [];
  const pagination: Pagination = data?.pagination;

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const empty: FilterState = { role_id: '', city: '', min_pay_rate: '', pay_type: '', start_date_from: '' };
    setFilters(empty);
    setActiveFilters(empty);
    setPage(1);
  };

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#132c64]">Browse Shifts</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            hasActiveFilters ? 'border-[#ff8401] text-[#ff8401] bg-orange-50' : 'border-[#E5E7EB] text-gray-600 hover:border-[#ff8401]'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters{hasActiveFilters ? ` (${Object.values(activeFilters).filter(Boolean).length})` : ''}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Role"
                options={ROLES.map((r) => ({ value: String(r.id), label: r.name }))}
                placeholder="All roles"
                value={filters.role_id}
                onChange={(e) => setFilters((f) => ({ ...f, role_id: e.target.value }))}
              />
              <Input
                label="City"
                placeholder="e.g. London"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              />
              <Input
                label="Min Pay Rate (£)"
                type="number"
                placeholder="e.g. 12"
                value={filters.min_pay_rate}
                onChange={(e) => setFilters((f) => ({ ...f, min_pay_rate: e.target.value }))}
              />
              <Select
                label="Pay Type"
                options={[
                  { value: 'per_hour', label: 'Per Hour' },
                  { value: 'per_shift', label: 'Per Shift' },
                ]}
                placeholder="Any"
                value={filters.pay_type}
                onChange={(e) => setFilters((f) => ({ ...f, pay_type: e.target.value }))}
              />
              <Input
                label="Start From"
                type="date"
                value={filters.start_date_from}
                onChange={(e) => setFilters((f) => ({ ...f, start_date_from: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={applyFilters} className="bg-[#ff8401] hover:bg-[#e07501]">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      {pagination && (
        <p className="text-sm text-gray-500">
          {pagination.total_count} shift{pagination.total_count !== 1 ? 's' : ''} available
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#ff8401] border-t-transparent" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No shifts found</p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((shift) => {
              const businessName = (shift as any).business?.business_name || (shift as any).business_name;
              const businessRating = (shift as any).business?.average_rating;
              const businessReviews = (shift as any).business?.total_reviews;
              const locationCity = shift.location?.city || (shift as any).location_city;
              const locationPostcode = shift.location?.postcode || (shift as any).location_postcode;
              const locationStr = [locationCity, locationPostcode].filter(Boolean).join(', ');
              const slotsRemaining = (shift as any).slots_remaining ?? (shift.crew_needed - ((shift as any).assigned_count ?? 0));
              const isFull = (shift as any).is_full || slotsRemaining <= 0;

              return (
                <Card key={shift.shift_id} className={`hover:shadow-md transition-shadow h-full flex flex-col ${isFull ? 'opacity-75' : ''}`}>
                  <CardContent className="pt-4 pb-4 flex flex-col h-full">
                    {/* Title */}
                    <div className="mb-2">
                      <h3 className="font-semibold text-[#132c64] leading-tight">{shift.shift_title}</h3>
                    </div>

                    {/* Business name + rating */}
                    <div className="flex items-center justify-between mb-1">
                      {businessName && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <span className="text-gray-400 text-xs">🏢</span>
                          <span className="font-medium truncate">{businessName}</span>
                        </div>
                      )}
                      {businessRating != null && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0 ml-2">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{businessRating.toFixed(1)}</span>
                          {businessReviews != null && <span>({businessReviews})</span>}
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    {locationStr && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        <span>{locationStr}</span>
                      </div>
                    )}

                    {/* Date / Time / Pay grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 mx-auto mb-0.5" />
                        <p className="text-xs text-gray-600 font-medium">{formatDate(shift.shift_start_date)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <Clock className="h-3.5 w-3.5 text-gray-400 mx-auto mb-0.5" />
                        <p className="text-xs text-gray-600 font-medium leading-tight">
                          {formatTime(shift.daily_start_time)}-{formatTime(shift.daily_end_time)}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-2 text-center">
                        <span className="text-[10px] text-gray-400 block">💰</span>
                        <p className="text-xs text-[#ff8401] font-bold">
                          {formatCurrency(shift.pay_rate)}
                        </p>
                        <p className="text-[10px] text-gray-400">/{shift.pay_type === 'per_hour' ? 'hr' : 'shift'}</p>
                      </div>
                    </div>

                    {/* Estimated pay */}
                    {(() => {
                      const estPay = shift.shift_duration_hours && shift.pay_rate
                        ? (shift.pay_type === 'per_hour' ? shift.pay_rate * shift.shift_duration_hours : shift.pay_rate)
                        : null;
                      return estPay ? (
                        <p className="text-xs text-gray-500 mb-2">
                          Est. earnings: <span className="font-semibold text-[#ff8401]">{formatCurrency(estPay)}</span>
                          {shift.shift_duration_hours ? ` (${shift.shift_duration_hours}h)` : ''}
                        </p>
                      ) : null;
                    })()}

                    {/* Perks */}
                    {shift.perks?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-xs text-gray-400">🎁</span>
                        {shift.perks.slice(0, 3).map((perk: any) => (
                          <span
                            key={perk.perk_id ?? perk.id}
                            className="bg-orange-50 text-[#ff8401] text-xs px-2 py-0.5 rounded-full font-medium"
                          >
                            {perk.perk_name ?? perk.name}
                          </span>
                        ))}
                        {shift.perks.length > 3 && (
                          <span className="text-xs text-gray-400">+{shift.perks.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Slots remaining + action */}
                    <div className="mt-2 pt-3 border-t border-[#E5E7EB]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3 w-3 text-gray-400" />
                          {isFull ? (
                            <span className="text-red-500 font-medium">All positions filled</span>
                          ) : (
                            <span>{slotsRemaining} spot{slotsRemaining !== 1 ? 's' : ''} remaining</span>
                          )}
                        </div>
                      </div>
                      {isFull ? (
                        <div className="text-center py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500">
                          Fully Booked
                        </div>
                      ) : (
                        <Link href={`/crew/browse/${shift.shift_id}`}>
                          <button className="w-full py-2 rounded-lg bg-[#ff8401] hover:bg-[#e07501] text-white text-sm font-semibold transition-colors">
                            Apply Now →
                          </button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_previous}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
