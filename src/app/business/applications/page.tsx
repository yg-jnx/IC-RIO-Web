'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { businessApi } from '@/lib/api';
import { Application } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Star } from 'lucide-react';
import Link from 'next/link';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
};

export default function ApplicationsPage() {
  // This page shows a high-level view; applications are per-shift
  // We redirect to shifts page for detailed management
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#132c64]">Applications</h1>
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 text-center">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 mb-2 font-medium">Applications are managed per shift</p>
        <p className="text-gray-400 text-sm mb-6">
          Go to your Shifts page and click on a shift to view and manage applications from crew members.
        </p>
        <Link
          href="/business/shifts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#15cb89] text-white rounded-lg text-sm font-medium hover:bg-[#12b578] transition-colors"
        >
          View My Shifts
        </Link>
      </div>
    </div>
  );
}
