import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null, currency = 'GBP'): string {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function calcShiftEarnings({
  startDate,
  endDate,
  startTime,
  endTime,
  payRate,
  payType,
  crewNeeded,
}: {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  payRate: number;
  payType: string;
  crewNeeded: number;
}): number | null {
  if (!startDate || !endDate || !startTime || !endTime || !payRate || !crewNeeded) return null;
  const days = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
  if (hours <= 0) return null;
  if (payType === 'per_hour') {
    return payRate * hours * crewNeeded * days;
  }
  return payRate * crewNeeded * days;
}
