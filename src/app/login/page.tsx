'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserType } from '@/lib/types';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  user_type: z.enum(['BO', 'CREW']),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { user_type: 'BO' },
  });

  const onSubmit = async (data: FormData) => {
    if (data.user_type === 'CREW') {
      toast.error('Crew member login is currently unavailable on web. Please use the mobile app.');
      return;
    }
    try {
      await login(data.username, data.password, data.user_type as UserType);
      const Cookies = (await import('js-cookie')).default;
      const stored = Cookies.get('instacrew_user');
      const userData = stored ? JSON.parse(stored) : null;
      toast.success('Welcome back!');
      if (!userData?.signup_completed) {
        router.push('/business/onboarding');
      } else {
        try {
          const res = await authApi.getOnboardingStatus();
          const status = res.data;
          const isVerified =
            status.is_verified === true ||
            status.is_verified === 1 ||
            status.is_verified === '1' ||
            status.is_verified === 'true';
          router.push(isVerified ? '/business/dashboard' : '/business/pending-verification');
        } catch {
          router.push('/business/pending-verification');
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string; error?: string } } };
      const raw =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        'Invalid credentials. Please try again.';

      if (raw.toLowerCase().includes('user type')) {
        toast.error(
          'This account is not registered as a Business Owner. If you just signed up, please contact support or register with a different username.',
          { duration: 6000 }
        );
      } else if (raw.toLowerCase().includes('verify your email') || raw.toLowerCase().includes('email')) {
        toast.error('Please verify your email before logging in. Check your inbox for the verification link.', { duration: 6000 });
      } else {
        toast.error(raw);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white"
        style={{ backgroundColor: '#132c64' }}
      >
        <Image src="/instacrew-logo.png" alt="InstaCrew" width={80} height={80} className="mb-8 rounded-2xl" />
        <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
        <p className="text-white/80 text-lg text-center max-w-sm">
          Sign in to manage your shifts, locations, and crew members.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/instacrew-logo.png" alt="InstaCrew" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-[#132c64] text-xl">InstaCrew</span>
          </div>

          <h2 className="text-2xl font-bold text-[#132c64] mb-2">Sign in to your account</h2>
          <p className="text-gray-500 mb-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#15cb89] font-medium hover:underline">
              Sign up for free
            </Link>
          </p>

          <input type="hidden" value="BO" {...register('user_type')} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              placeholder="Enter your username"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-[#15cb89] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/legal/terms" className="text-[#15cb89] hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-[#15cb89] hover:underline">Privacy Policy</Link>
          </p>

          {/* App download section */}
          <div className="mt-8">
            <div className="relative flex items-center mb-4">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-3 text-sm text-gray-400 whitespace-nowrap">Get the crew app</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* iOS card */}
              <a
                href="#" // TODO: replace with App Store link
                className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-[#132c64] hover:bg-[#132c64]/5 transition-all group"
              >
                <div className="shrink-0 text-gray-700 group-hover:text-[#132c64]">
                  {/* Apple icon SVG */}
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-tight">Download on the</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#132c64] leading-tight">App Store</p>
                </div>
              </a>

              {/* Android card */}
              <a
                href="https://play.google.com/store/apps/details?id=com.instacrew.app&hl=en" // TODO: replace with Play Store link
                className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-[#15cb89] hover:bg-[#15cb89]/5 transition-all group"
              >
                <div className="shrink-0 text-gray-700 group-hover:text-[#15cb89]">
                  {/* Google Play icon SVG */}
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.18 23.76c.3.17.64.22.99.14l.11-.06 10.59-6.1-2.29-2.29-9.4 8.31zm-1.1-20.4A1.5 1.5 0 0 0 2 4.5v15a1.5 1.5 0 0 0 .08.5l9.64-8.52-9.64-8.12zM20.49 10.5l-2.26-1.3-2.54 2.25 2.54 2.54 2.29-1.32a1.5 1.5 0 0 0 0-2.17zM4.17.24l.11-.06 10.59 6.1-2.29 2.29L3.18.26A1.5 1.5 0 0 1 4.17.24z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-tight">Get it on</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#15cb89] leading-tight">Google Play</p>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
