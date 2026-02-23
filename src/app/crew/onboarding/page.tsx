'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { crewApi } from '@/lib/api';
import { DAYS_OF_WEEK, ROLES, DRIVING_LICENSE_TYPES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CheckCircle, User, Briefcase, Star, FileText, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const steps = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Work Preferences', icon: Briefcase },
  { id: 3, title: 'Skills & Experience', icon: Star },
  { id: 4, title: 'Verification', icon: FileText },
];

const step1Schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  address_line1: z.string().min(3, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postcode: z.string().min(3, 'Postcode is required'),
  country: z.string().min(1, 'Country is required'),
});

const step2Schema = z.object({
  role: z.string().min(1, 'Select a role'),
  work_type: z.string().min(1, 'Select work type'),
});

const step3Schema = z.object({
  previous_experience: z.string().min(1, 'Select experience level'),
  previous_employer: z.string().min(2, 'Previous employer is required'),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

type AvailabilitySlot = {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

const defaultAvailability: AvailabilitySlot[] = DAYS_OF_WEEK.map((day) => ({
  day_of_week: day,
  start_time: '09:00',
  end_time: '17:00',
  is_available: !['Saturday', 'Sunday'].includes(day),
}));

export default function CrewOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(defaultAvailability);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [passport, setPassport] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [isBritish, setIsBritish] = useState(true);
  const [shareCode, setShareCode] = useState('');
  const [hasDrivingLicense, setHasDrivingLicense] = useState(false);
  const [drivingLicenseType, setDrivingLicenseType] = useState('');
  const [visaDisclaimer, setVisaDisclaimer] = useState(false);
  const router = useRouter();
  const { setUser, user } = useAuth();

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { country: 'United Kingdom' } });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema) });

  const updateAvailability = (idx: number, field: keyof AvailabilitySlot, value: string | boolean) =>
    setAvailability((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));

  const submitStep1 = async (data: Step1) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, String(v)); });
      if (profilePhoto) formData.append('profile_photo', profilePhoto);
      await crewApi.savePersonalDetails(formData);
      setCurrentStep(2);
    } catch {
      toast.error('Failed to save personal details');
    }
  };

  const submitStep2 = async (data: Step2) => {
    try {
      await crewApi.saveWorkPreferences({ ...data, availability });
      setCurrentStep(3);
    } catch {
      toast.error('Failed to save work preferences');
    }
  };

  const submitStep3 = async (data: Step3) => {
    try {
      const formData = new FormData();
      formData.append('previous_experience', data.previous_experience);
      formData.append('previous_employer', data.previous_employer);
      await crewApi.saveSkillsExperience(formData);
      setCurrentStep(4);
    } catch {
      toast.error('Failed to save skills');
    }
  };

  const submitStep4 = async () => {
    if (!visaDisclaimer) {
      toast.error('Please accept the visa disclaimer');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('is_british_citizen', String(isBritish));
      formData.append('visa_disclaimer_accepted', String(visaDisclaimer));
      if (isBritish && passport) formData.append('passport', passport);
      if (!isBritish && shareCode) formData.append('share_code', shareCode);
      if (hasDrivingLicense) formData.append('has_driving_license', 'true');
      if (drivingLicenseType) formData.append('driving_license_type', drivingLicenseType);
      if (cv) formData.append('cv', cv);
      await crewApi.uploadVerificationDocuments(formData);
      toast.success('Profile complete!');
      if (user) setUser({ ...user, signup_completed: true });
      router.push('/crew/dashboard');
    } catch {
      toast.error('Failed to upload documents');
    }
  };

  const FileUploadArea = ({
    label,
    file,
    onChange,
    accept = '.pdf,.jpg,.jpeg,.png',
    id,
  }: {
    label: string;
    file: File | null;
    onChange: (f: File | null) => void;
    accept?: string;
    id: string;
  }) => (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-[#ff8401] transition-colors ${
          file ? 'border-[#ff8401] bg-orange-50' : 'border-[#E5E7EB]'
        }`}
        onClick={() => document.getElementById(id)?.click()}
      >
        <input id={id} type="file" className="hidden" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)} />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-[#ff8401]">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium truncate">{file.name}</span>
          </div>
        ) : (
          <div className="text-gray-400">
            <Upload className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs">Click to upload</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={form1.handleSubmit(submitStep1)} className="space-y-4">
            <Input label="Full Name" error={form1.formState.errors.full_name?.message} {...form1.register('full_name')} />
            <Input label="Date of Birth" type="date" error={form1.formState.errors.date_of_birth?.message} {...form1.register('date_of_birth')} />
            <Select
              label="Gender"
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
                { value: 'Prefer not to say', label: 'Prefer not to say' },
              ]}
              placeholder="Select gender"
              error={form1.formState.errors.gender?.message}
              {...form1.register('gender')}
            />
            <Input label="Address Line 1" placeholder="123 High Street" error={form1.formState.errors.address_line1?.message} {...form1.register('address_line1')} />
            <Input label="Address Line 2 (Optional)" {...form1.register('address_line2')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" error={form1.formState.errors.city?.message} {...form1.register('city')} />
              <Input label="Postcode" error={form1.formState.errors.postcode?.message} {...form1.register('postcode')} />
            </div>
            <FileUploadArea label="Profile Photo (Optional)" file={profilePhoto} onChange={setProfilePhoto} accept=".jpg,.jpeg,.png" id="profile-photo" />
            <Button type="submit" className="w-full bg-[#ff8401] hover:bg-[#e07501]" isLoading={form1.formState.isSubmitting}>
              Continue
            </Button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={form2.handleSubmit(submitStep2)} className="space-y-4">
            <Select
              label="Preferred Role"
              options={ROLES.map((r) => ({ value: r.name, label: r.name }))}
              placeholder="Select your main role"
              error={form2.formState.errors.role?.message}
              {...form2.register('role')}
            />
            <Select
              label="Work Type"
              options={[
                { value: 'on-demand', label: 'On-demand (Flexible shifts)' },
                { value: 'full-time', label: 'Full-time' },
                { value: 'part-time', label: 'Part-time' },
              ]}
              placeholder="Select work type"
              error={form2.formState.errors.work_type?.message}
              {...form2.register('work_type')}
            />

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Availability</p>
              <div className="border border-[#E5E7EB] rounded-lg divide-y overflow-hidden">
                {availability.map((slot, idx) => (
                  <div key={slot.day_of_week} className="flex items-center gap-3 px-4 py-2.5">
                    <label className="flex items-center gap-2 w-28">
                      <input
                        type="checkbox"
                        checked={slot.is_available}
                        onChange={(e) => updateAvailability(idx, 'is_available', e.target.checked)}
                        className="rounded accent-[#ff8401]"
                      />
                      <span className="text-sm text-gray-700">{slot.day_of_week}</span>
                    </label>
                    {slot.is_available && (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateAvailability(idx, 'start_time', e.target.value)}
                          className="border border-[#E5E7EB] rounded px-2 py-1 text-xs"
                        />
                        <span className="text-xs text-gray-400">to</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateAvailability(idx, 'end_time', e.target.value)}
                          className="border border-[#E5E7EB] rounded px-2 py-1 text-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#ff8401] hover:bg-[#e07501]" isLoading={form2.formState.isSubmitting}>
              Continue
            </Button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={form3.handleSubmit(submitStep3)} className="space-y-4">
            <Select
              label="Previous Experience"
              options={[
                { value: 'Less than 1 year', label: 'Less than 1 year' },
                { value: '1-2 years', label: '1-2 years' },
                { value: '3-5 years', label: '3-5 years' },
                { value: '5+ years', label: '5+ years' },
              ]}
              placeholder="Select experience"
              error={form3.formState.errors.previous_experience?.message}
              {...form3.register('previous_experience')}
            />
            <Input
              label="Previous Employer"
              placeholder="e.g. The Crown Restaurant"
              error={form3.formState.errors.previous_employer?.message}
              {...form3.register('previous_employer')}
            />
            <Button type="submit" className="w-full bg-[#ff8401] hover:bg-[#e07501]" isLoading={form3.formState.isSubmitting}>
              Continue
            </Button>
          </form>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">Right to Work Verification</p>
              <p>We need to verify your right to work in the UK.</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Citizenship Status</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBritish(true)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    isBritish ? 'bg-[#ff8401] text-white border-[#ff8401]' : 'border-[#E5E7EB] text-gray-600'
                  }`}
                >
                  British Citizen
                </button>
                <button
                  type="button"
                  onClick={() => setIsBritish(false)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    !isBritish ? 'bg-[#ff8401] text-white border-[#ff8401]' : 'border-[#E5E7EB] text-gray-600'
                  }`}
                >
                  Non-British
                </button>
              </div>
            </div>

            {isBritish ? (
              <FileUploadArea label="Passport" file={passport} onChange={setPassport} id="passport" />
            ) : (
              <Input
                label="UK Gov Share Code"
                placeholder="e.g. ABC-123-456"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
              />
            )}

            <div>
              <label className="flex items-center gap-2.5 mb-3">
                <input
                  type="checkbox"
                  checked={hasDrivingLicense}
                  onChange={(e) => setHasDrivingLicense(e.target.checked)}
                  className="rounded accent-[#ff8401]"
                />
                <span className="text-sm text-gray-700">I have a driving license</span>
              </label>
              {hasDrivingLicense && (
                <Select
                  label="Driving License Type"
                  options={DRIVING_LICENSE_TYPES.map((t) => ({ value: t, label: t }))}
                  placeholder="Select license type"
                  value={drivingLicenseType}
                  onChange={(e) => setDrivingLicenseType(e.target.value)}
                />
              )}
            </div>

            <FileUploadArea label="CV (Optional)" file={cv} onChange={setCv} id="cv-upload" />

            <div className="bg-yellow-50 rounded-lg p-4">
              <label className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={visaDisclaimer}
                  onChange={(e) => setVisaDisclaimer(e.target.checked)}
                  className="rounded accent-[#ff8401] mt-0.5"
                />
                <span className="text-xs text-yellow-700">
                  I confirm that the information provided regarding my right to work in the UK is
                  accurate. I understand that providing false information may result in immediate
                  removal from the platform and may be reported to relevant authorities.
                </span>
              </label>
            </div>

            <Button
              onClick={submitStep4}
              className="w-full bg-[#ff8401] hover:bg-[#e07501]"
              disabled={!visaDisclaimer}
            >
              Complete Setup
            </Button>
            <button
              type="button"
              onClick={() => router.push('/crew/dashboard')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Skip - I&apos;ll upload later
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#ff8401] flex items-center justify-center text-white font-bold">
              IC
            </div>
            <span className="font-bold text-[#132c64] text-xl">InstaCrew</span>
          </div>
          <h1 className="text-2xl font-bold text-[#132c64]">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Let&apos;s get you set up to start finding shifts</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, idx) => {
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      isComplete ? 'bg-[#ff8401] text-white' : isCurrent ? 'bg-[#132c64] text-white' : 'bg-white border-2 border-[#E5E7EB] text-gray-400'
                    }`}
                  >
                    {isComplete ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block text-gray-500 text-center w-16">{step.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-12 mx-1 ${currentStep > step.id ? 'bg-[#ff8401]' : 'bg-[#E5E7EB]'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#132c64]">
              Step {currentStep}: {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{currentStep} of {steps.length}</p>
          </div>
          {renderStep()}
        </div>

        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
          >
            ← Go back
          </button>
        )}
      </div>
    </div>
  );
}
