'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, Suspense } from 'react';

const schema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

function ResetForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword(token, data.new_password);
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch {
      toast.error('Failed to reset password. Link may have expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-8">
          <Image src="/instacrew-logo.png" alt="InstaCrew" width={36} height={36} className="rounded-lg" />
          <span className="font-bold text-[#132c64] text-xl">InstaCrew</span>
        </div>
        <h2 className="text-2xl font-bold text-[#132c64] mb-2">Reset Password</h2>
        <p className="text-gray-500 text-sm mb-6">Choose a new password for your account.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.new_password?.message}
            {...register('new_password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />
          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
