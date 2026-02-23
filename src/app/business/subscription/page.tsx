'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api';
import { SubscriptionStatus, SubscriptionPlan } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  CheckCircle, XCircle, Clock, CreditCard, AlertCircle,
  Zap, Receipt, ExternalLink, ShieldCheck, Lock, Star,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  trial_active: { label: 'Free Trial Active', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  trial_expired: { label: 'Trial Expired', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-orange-600', bg: 'bg-orange-100', icon: Clock },
  expired: { label: 'Expired', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  past_due: { label: 'Payment Due', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'text-gray-600', bg: 'bg-gray-100', icon: XCircle },
};

const FAQ_ITEMS = [
  {
    q: 'Can I cancel at any time?',
    a: 'Yes, you can cancel your subscription at any time. You\'ll retain access to all features until the end of your billing period.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'After your free trial ends, you\'ll need to subscribe to one of our plans to continue posting shifts. You won\'t be charged automatically.',
  },
  {
    q: 'Can I switch between plans?',
    a: 'Yes, you can upgrade or change your plan at any time. Our team will help with any prorated billing adjustments.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Absolutely. All payments are processed securely through Stripe, the world\'s leading payment platform. We never store your card details.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="flex items-center justify-between w-full py-4 text-left gap-2"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-[#132c64]">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </button>
      {open && (
        <p className="text-sm text-gray-500 pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  currentStatus,
  onSelect,
  isLoading,
}: {
  plan: SubscriptionPlan;
  currentStatus?: string;
  onSelect: (planType: string) => void;
  isLoading: boolean;
}) {
  const isSixMonth = plan.plan_type === 'six_month';
  const isCurrentPlan = currentStatus === 'active';

  return (
    <div className={`relative rounded-2xl p-6 border-2 transition-all ${
      isSixMonth
        ? 'border-[#15cb89] bg-green-50 shadow-md'
        : 'border-[#E5E7EB] bg-white'
    }`}>
      {isSixMonth && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#15cb89] text-white text-xs px-4 py-1.5 rounded-full font-bold tracking-wide shadow-sm">
          ⭐ BEST VALUE
        </div>
      )}

      <div className="text-center mb-5">
        <h3 className="text-lg font-bold text-[#132c64]">
          {plan.plan_type === 'six_month' ? '6-Month Plan' : 'Monthly Plan'}
        </h3>
        <div className="mt-3">
          <span className="text-4xl font-bold text-[#132c64]">
            {formatCurrency(plan.price, plan.currency)}
          </span>
          <span className="text-gray-500 text-sm">/{plan.interval}</span>
        </div>
        {plan.savings && (
          <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
            <Zap className="h-3 w-3" />
            Save {formatCurrency(plan.savings, plan.currency)}!
          </div>
        )}
        {isSixMonth && (
          <p className="text-xs text-gray-500 mt-1">
            Just {formatCurrency(plan.price / 6, plan.currency)}/month
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-[#15cb89] shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        className={`w-full font-semibold ${isSixMonth ? 'bg-[#15cb89] hover:bg-[#12b077]' : ''}`}
        onClick={() => onSelect(plan.plan_type)}
        isLoading={isLoading}
      >
        {isCurrentPlan ? 'Current Plan' : 'Subscribe Now'}
      </Button>
    </div>
  );
}

export default function SubscriptionPage() {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check success param from Stripe redirect
  const isSuccess = typeof window !== 'undefined' && window.location.search.includes('success=true');

  const { data: status, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await subscriptionApi.getStatus();
      return res.data;
    },
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await subscriptionApi.getPlans();
      return res.data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['subscription-invoices'],
    queryFn: async () => {
      const res = await subscriptionApi.getInvoices();
      return res.data as Array<{
        id: string;
        invoice_number: string;
        amount_paid: number;
        currency: string;
        status: string;
        invoice_date: string;
        invoice_url: string;
        description: string;
      }>;
    },
  });

  const trialMutation = useMutation({
    mutationFn: () => subscriptionApi.startTrial(),
    onSuccess: () => {
      toast.success('🎉 Free trial started! Enjoy all features for free.');
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    },
    onError: () => toast.error('Failed to start trial'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      toast.success('Subscription cancelled. Access continues until period end.');
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    },
    onError: () => toast.error('Failed to cancel subscription'),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => subscriptionApi.reactivate(),
    onSuccess: () => {
      toast.success('🎉 Subscription reactivated!');
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    },
    onError: () => toast.error('Failed to reactivate'),
  });

  const handleCheckout = async (planType: string) => {
    setCheckoutLoading(planType);
    setShowPaymentConfirm(null);
    try {
      const origin = window.location.origin;
      const res = await subscriptionApi.createCheckout({
        plan_type: planType,
        success_url: `${origin}/business/subscription?success=true`,
        cancel_url: `${origin}/business/subscription`,
      });
      window.location.href = res.data.checkout_url;
    } catch {
      toast.error('Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      const res = await subscriptionApi.getPortalUrl();
      const url = res.data.url || res.data.portal_url || res.data.portal_link;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Billing portal URL not available');
      }
    } catch {
      toast.error('Failed to open billing portal');
    }
  };

  if (statusLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#15cb89] border-t-transparent" />
      </div>
    );
  }

  const statusInfo = status ? STATUS_INFO[status.status] : null;
  const StatusIcon = statusInfo?.icon || CheckCircle;
  const plans: SubscriptionPlan[] = plansData?.plans || status?.available_plans || [];
  const trialInfo = plansData?.trial;
  const isActive = status?.status === 'active';
  const isTrial = status?.status === 'trial_active';
  const isCancelled = status?.status === 'cancelled';
  const isWarning = ['past_due', 'expired', 'trial_expired'].includes(status?.status || '');

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">

      {/* Success banner */}
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700 font-medium">Payment successful! Your subscription is now active.</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-[#132c64]">Subscription Plans</h1>
        <p className="text-gray-500 text-sm mt-1">Unlock all features and start hiring crew members</p>
      </div>

      {/* Warning banner */}
      {isWarning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">
            {status?.status === 'past_due' ? 'Your payment is overdue. Update your payment method to restore access.' :
             status?.status === 'trial_expired' ? 'Your free trial has ended. Subscribe to continue posting shifts.' :
             'Your subscription has expired. Renew to continue posting shifts.'}
          </p>
          {status?.status === 'past_due' && (
            <button onClick={handlePortal} className="text-xs font-medium text-red-600 shrink-0 hover:underline">
              Update →
            </button>
          )}
        </div>
      )}

      {/* Current Plan Status */}
      {status && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Current Plan</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusInfo?.bg || 'bg-gray-100'}`}>
                <StatusIcon className={`h-6 w-6 ${statusInfo?.color || 'text-gray-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#132c64]">{statusInfo?.label || status.status}</p>
                {status.plan_type && (
                  <p className="text-sm text-gray-500">
                    {status.plan_type === 'six_month' ? '6-Month Plan' :
                     status.plan_type === 'monthly' ? 'Monthly Plan' :
                     status.plan_type}
                  </p>
                )}
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                status.has_access ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {status.has_access ? '✓ Active Access' : '✗ No Access'}
              </span>
            </div>

            {/* Trial info */}
            {isTrial && (
              <div className="mt-4 bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Free Trial</span>
                  <span className="text-sm font-bold text-blue-700">{status.trial_days_remaining} days left</span>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, ((status.trial_days_remaining || 0) / 14) * 100))}%` }}
                  />
                </div>
                {status.trial_end_date && (
                  <p className="text-xs text-blue-600 mt-1.5">Trial ends {formatDate(status.trial_end_date)}</p>
                )}
              </div>
            )}

            {/* Active plan info */}
            {isActive && status.current_period_end && (
              <div className="mt-4 bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    {status.plan_type === 'six_month' ? '6-Month Plan' : 'Monthly Plan'}
                  </span>
                  <span className="text-sm font-bold text-green-700">
                    {Math.max(0, Math.ceil((new Date(status.current_period_end).getTime() - Date.now()) / 86400000))} days left
                  </span>
                </div>
                <div className="w-full bg-green-200/50 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, (Math.ceil((new Date(status.current_period_end).getTime() - Date.now()) / 86400000) / (status.plan_type === 'six_month' ? 180 : 30)) * 100))}%` }}
                  />
                </div>
                <p className="text-xs text-green-600 mt-1.5">Renews {formatDate(status.current_period_end)}</p>
              </div>
            )}

            {/* Cancelled info */}
            {isCancelled && status.current_period_end && (
              <div className="mt-4 bg-orange-50 rounded-xl p-3.5">
                <p className="text-sm text-orange-700">
                  Access continues until <strong>{formatDate(status.current_period_end)}</strong>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-4">
              {isActive && (
                <>
                  <Button variant="outline" onClick={handlePortal} className="border-[#15cb89] text-[#15cb89] hover:bg-green-50">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => cancelMutation.mutate()}
                    isLoading={cancelMutation.isPending}
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
              {isCancelled && (
                <Button className="bg-[#15cb89] hover:bg-[#12b077]" onClick={() => reactivateMutation.mutate()} isLoading={reactivateMutation.isPending}>
                  <Zap className="h-4 w-4 mr-2" />
                  Reactivate Subscription
                </Button>
              )}
              {status.trial_eligible && !isTrial && (
                <Button className="bg-[#15cb89] hover:bg-[#12b077]" onClick={() => trialMutation.mutate()} isLoading={trialMutation.isPending}>
                  Start Free Trial
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trial Card */}
      {trialInfo && status?.trial_eligible && !isTrial && (
        <div className="bg-white rounded-2xl border-2 border-green-300 overflow-hidden shadow-sm">
          <div className="bg-green-500 px-4 py-2 text-center">
            <span className="text-white text-xs font-bold tracking-widest">FREE TRIAL</span>
          </div>
          <div className="p-6">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-[#132c64]">Try InstaCrew Free</p>
              <div className="mt-2">
                <span className="text-5xl font-black text-[#15cb89]">{trialInfo.duration_days}</span>
                <span className="text-lg text-gray-500 ml-2">Days FREE</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">No credit card required</p>
            </div>
            <ul className="space-y-2.5 mb-6">
              {(trialInfo.features || [
                'Post unlimited shifts during trial',
                'Access to all crew applications',
                'Full crew management tools',
                'No commitment, cancel anytime',
              ]).map((f: string) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-[#15cb89] shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-[#15cb89] hover:bg-[#12b077] font-semibold text-base py-3"
              onClick={() => trialMutation.mutate()}
              isLoading={trialMutation.isPending}
            >
              Start Free Trial →
            </Button>
          </div>
        </div>
      )}

      {/* Plans */}
      {plans.length > 0 && !isActive && (
        <div>
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-[#132c64]">Choose Your Plan</h2>
            <p className="text-gray-500 text-sm mt-1">Transparent pricing, no hidden fees</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.plan_type}
                plan={plan}
                currentStatus={status?.status}
                onSelect={(planType) => setShowPaymentConfirm(planType)}
                isLoading={checkoutLoading === plan.plan_type}
              />
            ))}
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#132c64]">Order Summary</h3>
            </div>
            <div className="p-5 space-y-3">
              {plans.filter(p => p.plan_type === showPaymentConfirm).map(plan => (
                <div key={plan.plan_type}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {plan.plan_type === 'six_month' ? '6-Month Plan' : 'Monthly Plan'}
                    </span>
                    <span className="font-bold text-[#132c64]">{formatCurrency(plan.price, plan.currency)}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-xs text-green-600 mt-1">You save {formatCurrency(plan.savings, plan.currency)}</p>
                  )}
                </div>
              ))}
              <div className="pt-2 text-xs text-gray-400 flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Processed securely via Stripe
              </div>
            </div>
            <div className="p-5 space-y-3">
              <Button
                className="w-full bg-[#15cb89] hover:bg-[#12b077] font-semibold"
                onClick={() => handleCheckout(showPaymentConfirm)}
                isLoading={!!checkoutLoading}
              >
                Continue to Payment →
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPaymentConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History */}
      {invoices && invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Billing History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#132c64] truncate">
                    {inv.description || `Invoice ${inv.invoice_number}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(inv.invoice_date)} · #{inv.invoice_number}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#132c64]">{formatCurrency(inv.amount_paid, inv.currency)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                  {inv.invoice_url && (
                    <a
                      href={inv.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#15cb89] transition-colors"
                      title="View Invoice"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Frequently Asked Questions</h2>
        </div>
        <div className="px-5">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, label: 'Secure Payment', desc: 'Bank-grade security' },
          { icon: Lock, label: 'SSL Encrypted', desc: '256-bit encryption' },
          { icon: Star, label: 'Stripe Powered', desc: 'Trusted worldwide' },
        ].map((badge) => (
          <div key={badge.label} className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex flex-col items-center text-center gap-1.5">
            <badge.icon className="h-5 w-5 text-[#15cb89]" />
            <p className="text-xs font-semibold text-[#132c64]">{badge.label}</p>
            <p className="text-[10px] text-gray-400">{badge.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
