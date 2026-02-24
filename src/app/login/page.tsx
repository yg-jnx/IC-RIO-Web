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

        {/* App download cards */}
        <div className="mt-12 w-full max-w-sm space-y-3">
          <p className="text-white/60 text-sm text-center uppercase tracking-widest font-medium mb-4">
            Crew members? Get the app
          </p>

          {/* iOS card */}
          <a
            href="#" // TODO: replace with App Store link
            className="flex items-center gap-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-5 py-4 border border-white/20 cursor-pointer"
          >
            <div className="flex-shrink-0">
              {/* Apple icon SVG */}
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-xs">Download on the</p>
              <p className="text-white font-semibold text-base leading-tight">App Store</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white/40 ml-auto" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </a>

          {/* Android card */}
          <a
            href="https://play.google.com/store/apps/details?id=com.instacrew.app&hl=en" // TODO: replace with Play Store link
            className="flex items-center gap-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-5 py-4 border border-white/20 cursor-pointer"
          >
            <div className="flex-shrink-0">
              {/* Google Play icon SVG */}
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.18 23.76c.3.17.65.19.98.06l11.65-6.73-2.48-2.49-10.15 9.16zM.1 1.09C.04 1.3 0 1.53 0 1.79v20.42c0 .26.04.49.1.7l.06.06 11.44-11.44v-.27L.16 1.03l-.06.06zM20.01 10.4l-2.68-1.55-2.78 2.78 2.78 2.78 2.7-1.56c.77-.45.77-1.01-.02-1.45zM3.18.24l10.15 9.16 2.48-2.49L4.16.18C3.83.05 3.48.07 3.18.24z" />
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-xs">Get it on</p>
              <p className="text-white font-semibold text-base leading-tight">Google Play</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white/40 ml-auto" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="max-w-md w-full mx-auto">
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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
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
        </div>
      </div>
    </div>
  );
}
