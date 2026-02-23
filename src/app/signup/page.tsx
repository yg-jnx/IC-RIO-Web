'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Suspense } from 'react';

const schema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone_number: z.string().min(10, 'Enter a valid phone number'),
    username: z.string().min(3, 'Username must be at least 3 characters').regex(/^\S+$/, 'No spaces allowed'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number,
        username: data.username,
        password: data.password,
      };

      await authApi.signupBusiness(payload);

      toast.success('Account created! Please check your email to verify your account before logging in.');
      router.push('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string; error?: string } } };
      const raw =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        'Failed to create account. Please try again.';

      // Account exists but email not yet verified — treat as success and prompt to verify
      if (raw.toLowerCase().includes('pending verification')) {
        toast.success('Account already created. Please check your email to verify before logging in.');
        router.push('/login');
        return;
      }

      toast.error(raw);
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
        <h1 className="text-4xl font-bold mb-4">Join InstaCrew</h1>
        <p className="text-white/80 text-lg text-center max-w-sm">
          Start posting shifts today. 30-day free trial, no credit card required.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-xs text-center">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-2xl font-bold">30</p>
            <p className="text-white/70 text-sm">Day Free Trial</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-2xl font-bold">∞</p>
            <p className="text-white/70 text-sm">Shift Posts</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/instacrew-logo.png" alt="InstaCrew" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-[#132c64] text-xl">InstaCrew</span>
          </div>

          <h2 className="text-2xl font-bold text-[#132c64] mb-1">Create your Business account</h2>
          <p className="text-gray-500 mb-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#15cb89] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Smith"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+44 7700 900000"
              leftIcon={<Phone className="h-4 w-4" />}
              error={errors.phone_number?.message}
              {...register('phone_number')}
            />
            <Input
              label="Username"
              placeholder="johnsmith123"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
              Create Business Account
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            By creating an account, you agree to our{' '}
            <Link href="/legal/terms" className="underline hover:text-gray-600">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
