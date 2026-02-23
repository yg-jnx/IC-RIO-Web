'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, CheckCircle, Lock, Mail, Shield, Timer, RefreshCw, LogOut, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function PendingVerificationPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'failed' | 'verified'>('pending');

  const checkStatus = useCallback(async (silent = false) => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const res = await authApi.getOnboardingStatus();
      const status = res.data;

      const isVerified =
        status.is_verified === true ||
        status.is_verified === 1 ||
        status.is_verified === '1' ||
        status.is_verified === 'true';

      const isFailed = status.is_verified === 'F';

      if (isVerified) {
        setVerificationStatus('verified');
        toast.success('Your account has been verified! Redirecting to dashboard...');
        setTimeout(() => router.push('/business/dashboard'), 1500);
      } else if (isFailed) {
        setVerificationStatus('failed');
        if (!silent) toast.error('Verification failed. Please contact support.');
      } else {
        if (!silent) toast.info('Still under review. We\'ll notify you by email when verified.', { duration: 4000 });
      }
    } catch {
      if (!silent) toast.error('Could not check status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, router]);

  // Auto-check on mount (silent)
  useEffect(() => {
    checkStatus(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout();
  };

  if (verificationStatus === 'verified') {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#15cb89]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-[#15cb89]" />
          </div>
          <h2 className="text-xl font-bold text-[#132c64]">Account Verified!</h2>
          <p className="text-gray-500 text-sm mt-1">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/instacrew-logo.png" alt="InstaCrew" width={28} height={28} className="rounded-lg" />
            <span className="font-bold text-[#132c64] text-sm">InstaCrew</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Main icon */}
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${verificationStatus === 'failed' ? 'bg-red-100' : 'bg-orange-100'}`}>
            {verificationStatus === 'failed' ? (
              <AlertCircle className="h-12 w-12 text-red-500" />
            ) : (
              <Clock className="h-12 w-12 text-orange-500 animate-pulse" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#132c64] mb-2">
            {verificationStatus === 'failed' ? 'Verification Failed' : 'Account Under Review'}
          </h1>
          <p className="text-[#15cb89] font-semibold mb-3">
            {verificationStatus === 'failed'
              ? 'Your application could not be verified'
              : 'Thank you for completing your registration!'}
          </p>
          <p className="text-gray-500 text-sm leading-relaxed">
            {verificationStatus === 'failed'
              ? 'Please contact our support team for assistance with your application.'
              : 'Our team is reviewing your business details and documents. This typically takes 24–48 hours.'}
          </p>
        </div>

        {/* Steps tracker */}
        {verificationStatus !== 'failed' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="space-y-0">
              {/* Step 1 - done */}
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-[#15cb89] flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 pb-6 border-l-2 border-[#E5E7EB] ml-0 pl-0">
                  <div className="ml-0">
                    <p className="font-semibold text-[#132c64] text-sm">Registration Complete</p>
                    <p className="text-xs text-gray-500 mt-0.5">Your account has been created successfully</p>
                  </div>
                </div>
              </div>

              {/* Step 2 - active */}
              <div className="flex items-start gap-4 -mt-6">
                <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 pb-6 border-l-2 border-[#E5E7EB]">
                  <div>
                    <p className="font-semibold text-orange-500 text-sm">Verification in Progress</p>
                    <p className="text-xs text-gray-500 mt-0.5">Our team is reviewing your documents</p>
                  </div>
                </div>
              </div>

              {/* Step 3 - pending */}
              <div className="flex items-start gap-4 -mt-6">
                <div className="w-9 h-9 rounded-full bg-[#F3F4F6] border-2 border-[#E5E7EB] flex items-center justify-center shrink-0">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-400 text-sm">Account Activation</p>
                  <p className="text-xs text-gray-400 mt-0.5">Full access once verification is complete</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4 border border-[#E5E7EB]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-[#132c64] text-sm">Check Your Email</p>
              <p className="text-xs text-gray-500 mt-0.5">We'll notify you at <span className="font-medium">{user?.email || 'your email'}</span> once your account is verified</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4 border border-[#E5E7EB]">
            <div className="w-10 h-10 rounded-xl bg-[#15cb89]/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-[#15cb89]" />
            </div>
            <div>
              <p className="font-semibold text-[#132c64] text-sm">Secure Review</p>
              <p className="text-xs text-gray-500 mt-0.5">We verify all businesses to ensure platform safety and quality</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4 border border-[#E5E7EB]">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Timer className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-[#132c64] text-sm">Processing Time</p>
              <p className="text-xs text-gray-500 mt-0.5">Most verifications are completed within 24–48 hours</p>
            </div>
          </div>
        </div>

        {/* What we're verifying */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="font-semibold text-[#132c64] text-sm mb-3">What We're Verifying</p>
          <ul className="space-y-2">
            {[
              'Business registration details',
              'Business location address',
              'Owner identity documents',
              'Contact information',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#132c64]">
                <CheckCircle className="h-4 w-4 text-[#15cb89] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => checkStatus(false)}
            className="w-full"
            size="lg"
            isLoading={isChecking}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isChecking ? 'Checking...' : 'Check Status'}
          </Button>

          <a
            href="mailto:support@instacrew.com?subject=Support%20Request%20-%20Business%20Verification"
            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-blue-400 rounded-xl text-sm font-semibold text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Having issues? Our support team is available 24/7 to help you
        </p>
      </div>
    </div>
  );
}
