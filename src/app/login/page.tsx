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
      // Use the user from context after login is done
      const Cookies = (await import('js-cookie')).default;
      const stored = Cookies.get('instacrew_user');
      const userData = stored ? JSON.parse(stored) : null;
      toast.success('Welcome back!');
      if (!userData?.signup_completed) {
        router.push('/business/onboarding');
      } else {
        // Check verification status — go straight to dashboard if already verified
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
              <Link
                href="/forgot-password"
                className="text-sm text-[#15cb89] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
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
