'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { businessApi, authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, FileText, Upload, X, Info, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BUSINESS_TYPE_OPTIONS = [
  'Takeaway', 'Restaurant', 'Cafe', 'Retail Store', 'Grocery Store',
  'Delivery Service', 'Fast Food', 'Hotel', 'Bar/Pub', 'Barber', 'Carehome', 'Other',
];

const BUSINESS_SIZES = ['0-5 Staff', '6-10 Staff', '11-20 Staff', '20+ Staff'];

const DAYS = [
  { key: 'mon', label: 'Mon', fullName: 'Monday' },
  { key: 'tue', label: 'Tue', fullName: 'Tuesday' },
  { key: 'wed', label: 'Wed', fullName: 'Wednesday' },
  { key: 'thu', label: 'Thu', fullName: 'Thursday' },
  { key: 'fri', label: 'Fri', fullName: 'Friday' },
  { key: 'sat', label: 'Sat', fullName: 'Saturday' },
  { key: 'sun', label: 'Sun', fullName: 'Sunday' },
];

const extractBusinessSize = (sizeString: string): number => {
  const match = sizeString.match(/\d+/);
  if (!match) return 5;
  const num = parseInt(match[0]);
  return sizeString.includes('+') ? num : Math.max(num, 1);
};

type OperatingHours = {
  [key: string]: { enabled: boolean; open: string; close: string };
};

const defaultOperatingHours: OperatingHours = {
  mon: { enabled: true, open: '09:00', close: '17:00' },
  tue: { enabled: true, open: '09:00', close: '17:00' },
  wed: { enabled: true, open: '09:00', close: '17:00' },
  thu: { enabled: true, open: '09:00', close: '17:00' },
  fri: { enabled: true, open: '09:00', close: '17:00' },
  sat: { enabled: false, open: '09:00', close: '17:00' },
  sun: { enabled: false, open: '09:00', close: '17:00' },
};

const STEP_TITLES = [
  'Verify Your Business',
  'Basic Business Profile',
  'Business Details',
  'Location Setup',
  'Business Verification',
];

const STEP_SUBTITLES = [
  'Enter your Companies House registration number',
  'Tell us about your registered business',
  'Tell us about your business details',
  'Add your first branch',
  'Upload verification documents (optional)',
];

const ONBOARDING_STEP_KEY = 'instacrew_onboarding_step';
const ONBOARDING_DATA_KEY = 'instacrew_onboarding_data';

const defaultStep1 = {
  registeredBusinessName: '',
  businessEmail: '',
  ownerName: '',
  businessType: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postCode: '',
  country: 'United Kingdom',
};

const defaultStep2 = {
  businessDisplayName: '',
  businessSize: '',
};

const defaultStep3 = {
  locationName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postCode: '',
  country: 'United Kingdom',
  branchEmail: '',
  contactName: '',
  contactNumber: '',
};

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { setUser, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 0
  const [companyNumber, setCompanyNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCompany, setVerifiedCompany] = useState<{
    company_name: string;
    company_number: string;
    company_status: string;
    date_of_creation?: string;
    registered_office_address?: {
      address_line_1?: string;
      address_line_2?: string;
      locality?: string;
      postal_code?: string;
    };
  } | null>(null);

  const [step1, setStep1] = useState(defaultStep1);
  const [step2, setStep2] = useState(defaultStep2);
  const [step3, setStep3] = useState(defaultStep3);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(defaultOperatingHours);

  // Step 4 — files can't be persisted to sessionStorage
  const [registrationDoc, setRegistrationDoc] = useState<File | null>(null);
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [vatNumber, setVatNumber] = useState('');
  const regDocRef = useRef<HTMLInputElement>(null);
  const licenseDocRef = useRef<HTMLInputElement>(null);

  // Persist form data to sessionStorage whenever it changes
  useEffect(() => {
    if (isCheckingStatus) return; // don't overwrite before we've loaded
    const data = { companyNumber, verifiedCompany, step1, step2, step3, operatingHours, vatNumber };
    sessionStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
  }, [companyNumber, verifiedCompany, step1, step2, step3, operatingHours, vatNumber, isCheckingStatus]);

  const goToStep = (step: number) => {
    sessionStorage.setItem(ONBOARDING_STEP_KEY, String(step));
    setCurrentStep(step);
  };

  // Restore step and all form data from sessionStorage on mount
  useEffect(() => {
    const savedStep = sessionStorage.getItem(ONBOARDING_STEP_KEY);
    if (savedStep) setCurrentStep(parseInt(savedStep, 10));

    const savedData = sessionStorage.getItem(ONBOARDING_DATA_KEY);
    if (savedData) {
      try {
        const d = JSON.parse(savedData);
        if (d.companyNumber) setCompanyNumber(d.companyNumber);
        if (d.verifiedCompany) setVerifiedCompany(d.verifiedCompany);
        if (d.step1) setStep1(d.step1);
        if (d.step2) setStep2(d.step2);
        if (d.step3) setStep3(d.step3);
        if (d.operatingHours) setOperatingHours(d.operatingHours);
        if (d.vatNumber) setVatNumber(d.vatNumber);
      } catch {
        // ignore malformed data
      }
    }

    setIsCheckingStatus(false);
  }, []);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const verifyCompany = async () => {
    if (!companyNumber.trim()) {
      setErrors({ companyNumber: 'Please enter a company number' });
      return;
    }
    setIsVerifying(true);
    setErrors({});
    try {
      const res = await businessApi.verifyCompany(companyNumber.toUpperCase());
      const data = res.data;
      if (data.company_status !== 'active') {
        setErrors({
          companyNumber: `Company status is "${data.company_status}". Only active companies can register.`,
        });
        return;
      }
      setVerifiedCompany(data);
      // Pre-fill step 1
      const addr = data.registered_office_address || {};
      setStep1((prev) => ({
        ...prev,
        registeredBusinessName: data.company_name || '',
        addressLine1: addr.address_line_1 || '',
        addressLine2: addr.address_line_2 || '',
        city: addr.locality || '',
        postCode: addr.postal_code || '',
      }));
      setTimeout(() => goToStep(1), 500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string } } };
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        'Company not found. Please check the number.';
      setErrors({ companyNumber: msg });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStep1 = async () => {
    const newErrors: Record<string, string> = {};
    if (!step1.registeredBusinessName.trim()) newErrors.registeredBusinessName = 'Business name is required';
    if (!step1.businessEmail.trim()) newErrors.businessEmail = 'Business email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.businessEmail)) newErrors.businessEmail = 'Invalid email format';
    if (!step1.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!step1.businessType.trim()) newErrors.businessType = 'Business type is required';
    if (!step1.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!step1.city.trim()) newErrors.city = 'City is required';
    if (!step1.postCode.trim()) newErrors.postCode = 'Postcode is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await businessApi.saveBasicProfile({
        business_registered_name: step1.registeredBusinessName,
        business_email: step1.businessEmail,
        business_owner_name: step1.ownerName,
        business_type: step1.businessType,
        address_line1: step1.addressLine1,
        address_line2: step1.addressLine2 || undefined,
        city: step1.city,
        postcode: step1.postCode,
        country: step1.country,
      });
      goToStep(2);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string } } };
      toast.error(error?.response?.data?.message || error?.response?.data?.detail || 'Failed to save profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async () => {
    const newErrors: Record<string, string> = {};
    if (!step2.businessDisplayName.trim()) newErrors.businessDisplayName = 'Display name is required';
    if (!step2.businessSize.trim()) newErrors.businessSize = 'Business size is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      await businessApi.saveBusinessDetails({
        business_display_name: step2.businessDisplayName,
        business_member_size: extractBusinessSize(step2.businessSize),
      });
      goToStep(3);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string } } };
      toast.error(error?.response?.data?.message || error?.response?.data?.detail || 'Failed to save details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async () => {
    const newErrors: Record<string, string> = {};
    if (!step3.locationName.trim()) newErrors.locationName = 'Branch name is required';
    if (!step3.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!step3.city.trim()) newErrors.city = 'City is required';
    if (!step3.postCode.trim()) newErrors.postCode = 'Postcode is required';
    if (!step3.branchEmail.trim()) newErrors.branchEmail = 'Branch email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step3.branchEmail)) newErrors.branchEmail = 'Invalid email format';
    if (!step3.contactName.trim()) newErrors.contactName = 'Contact name is required';
    if (!step3.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      const openingHoursArray = DAYS.map((day) => {
        const d = operatingHours[day.key];
        return {
          day: day.fullName,
          open_time: d.open,
          close_time: d.close,
          is_closed: !d.enabled,
        };
      });

      await businessApi.saveLocation({
        location_name: step3.locationName.trim(),
        address_line1: step3.addressLine1,
        address_line2: step3.addressLine2 || undefined,
        city: step3.city,
        postcode: step3.postCode,
        country: step3.country,
        branch_email: step3.branchEmail,
        contact_name: step3.contactName,
        contact_number: step3.contactNumber,
        is_primary: true,
        opening_hours: openingHoursArray,
      });
      goToStep(4);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string } } };
      toast.error(error?.response?.data?.message || error?.response?.data?.detail || 'Failed to save location.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep4 = async (skip: boolean) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (skip) {
        formData.append('skip_documents', 'true');
        formData.append('vat_number', '');
      } else {
        formData.append('skip_documents', 'false');
        formData.append('vat_number', vatNumber || '');
        if (registrationDoc) formData.append('registration_document', registrationDoc);
        if (businessLicense) formData.append('license_document', businessLicense);
      }
      await businessApi.uploadRegistrationDocs(formData);
      toast.success('Setup complete! Welcome to InstaCrew.');
      try {
        const { subscriptionApi } = await import('@/lib/api');
        await subscriptionApi.startTrial();
      } catch {
        // Trial may already exist
      }
      sessionStorage.removeItem(ONBOARDING_STEP_KEY);
      sessionStorage.removeItem(ONBOARDING_DATA_KEY);
      if (user) setUser({ ...user, signup_completed: true });
      router.push('/business/pending-verification');
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string; detail?: string; error?: string } } };
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please log in again.', { duration: 5000 });
      } else {
        toast.error(error?.response?.data?.message || error?.response?.data?.detail || error?.response?.data?.error || 'Failed to complete setup.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (key: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const updateHour = (key: string, type: 'open' | 'close', value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], [type]: value },
    }));
  };

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#15cb89] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Checking your progress...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / 5) * 100;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            {currentStep > 0 && (
              <button
                onClick={() => goToStep(currentStep - 1)}
                className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-[#132c64]" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Image src="/instacrew-logo.png" alt="InstaCrew" width={28} height={28} className="rounded-lg" />
              <span className="font-bold text-[#132c64] text-sm">InstaCrew</span>
            </div>
            <span className="ml-auto text-xs text-gray-400">Step {currentStep + 1} of 5</span>
          </div>
          <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#15cb89] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-[#132c64]">{STEP_TITLES[currentStep]}</h1>
          <p className="text-sm text-gray-500 mt-1.5">{STEP_SUBTITLES[currentStep]}</p>
        </div>

        {/* Step 0: Company Verification */}
        {currentStep === 0 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-[#15cb89]/10 flex items-center justify-center mx-auto mb-5">
                <Shield className="h-10 w-10 text-[#15cb89]" />
              </div>
              <h2 className="text-xl font-bold text-[#132c64] mb-2">Verify Your Company</h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                Enter your Companies House registration number to verify your business and auto-fill your details
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Company Number</label>
                <input
                  type="text"
                  value={companyNumber}
                  onChange={(e) => {
                    setCompanyNumber(e.target.value.toUpperCase());
                    clearError('companyNumber');
                  }}
                  placeholder="e.g., 12345678 or SC123456"
                  maxLength={8}
                  disabled={isVerifying}
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${
                    errors.companyNumber ? 'border-red-400' : 'border-[#E5E7EB]'
                  }`}
                />
                {errors.companyNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.companyNumber}</p>
                )}
              </div>

              <div className="flex items-start gap-3 bg-[#132c64]/5 rounded-lg p-3">
                <Info className="h-4 w-4 text-[#132c64] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#132c64] mb-0.5">What is a Companies House number?</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Your company number is the unique identifier assigned by Companies House when your business was registered.
                    You can find it on your incorporation certificate or at companieshouse.gov.uk
                  </p>
                </div>
              </div>
            </div>

            {verifiedCompany && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#15cb89]">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-[#15cb89]" />
                  <span className="font-bold text-[#15cb89]">Company Verified!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company Name</span>
                    <span className="font-semibold text-[#132c64]">{verifiedCompany.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company Number</span>
                    <span className="font-semibold text-[#132c64]">{verifiedCompany.company_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="font-semibold text-[#15cb89] capitalize">{verifiedCompany.company_status}</span>
                  </div>
                  {verifiedCompany.date_of_creation && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Incorporated</span>
                      <span className="font-semibold text-[#132c64]">
                        {new Date(verifiedCompany.date_of_creation).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={verifyCompany}
              className="w-full"
              size="lg"
              isLoading={isVerifying}
              disabled={isVerifying}
            >
              Verify Company
            </Button>
          </div>
        )}

        {/* Step 1: Basic Business Profile */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Registered Business Name *</label>
              <input
                type="text"
                value={step1.registeredBusinessName}
                onChange={(e) => { setStep1({ ...step1, registeredBusinessName: e.target.value }); clearError('registeredBusinessName'); }}
                placeholder="Enter registered business name"
                className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.registeredBusinessName ? 'border-red-400' : 'border-[#E5E7EB]'}`}
              />
              {errors.registeredBusinessName && <p className="text-xs text-red-500 mt-1">{errors.registeredBusinessName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Business Email *</label>
              <input
                type="email"
                value={step1.businessEmail}
                onChange={(e) => { setStep1({ ...step1, businessEmail: e.target.value }); clearError('businessEmail'); }}
                placeholder="business@example.com"
                className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.businessEmail ? 'border-red-400' : 'border-[#E5E7EB]'}`}
              />
              {errors.businessEmail && <p className="text-xs text-red-500 mt-1">{errors.businessEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Owner Name *</label>
              <input
                type="text"
                value={step1.ownerName}
                onChange={(e) => { setStep1({ ...step1, ownerName: e.target.value }); clearError('ownerName'); }}
                placeholder="John Smith"
                className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.ownerName ? 'border-red-400' : 'border-[#E5E7EB]'}`}
              />
              {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Business Type *</label>
              <select
                value={step1.businessType}
                onChange={(e) => { setStep1({ ...step1, businessType: e.target.value }); clearError('businessType'); }}
                className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] bg-white ${errors.businessType ? 'border-red-400' : 'border-[#E5E7EB]'}`}
              >
                <option value="">Select business type</option>
                {BUSINESS_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Address Line 1 *</label>
              <input
                type="text"
                value={step1.addressLine1}
                onChange={(e) => { setStep1({ ...step1, addressLine1: e.target.value }); clearError('addressLine1'); }}
                placeholder="45 High Street"
                className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.addressLine1 ? 'border-red-400' : 'border-[#E5E7EB]'}`}
              />
              {errors.addressLine1 && <p className="text-xs text-red-500 mt-1">{errors.addressLine1}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={step1.addressLine2}
                onChange={(e) => setStep1({ ...step1, addressLine2: e.target.value })}
                placeholder="Ground Floor"
                className="w-full h-11 border border-[#E5E7EB] rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">City *</label>
                <input
                  type="text"
                  value={step1.city}
                  onChange={(e) => { setStep1({ ...step1, city: e.target.value }); clearError('city'); }}
                  placeholder="London"
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.city ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Postcode *</label>
                <input
                  type="text"
                  value={step1.postCode}
                  onChange={(e) => { setStep1({ ...step1, postCode: e.target.value }); clearError('postCode'); }}
                  placeholder="SW1A 1AA"
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.postCode ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                />
                {errors.postCode && <p className="text-xs text-red-500 mt-1">{errors.postCode}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Country</label>
              <div className="h-11 border border-[#E5E7EB] rounded-lg px-3 flex items-center text-sm text-[#132c64] bg-gray-50">
                {step1.country}
              </div>
            </div>

            <Button onClick={handleStep1} className="w-full" size="lg" isLoading={isLoading}>
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Business Details */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">Business Display Name *</label>
              <input
                type="text"
                value={step2.businessDisplayName}
                onChange={(e) => { setStep2({ ...step2, businessDisplayName: e.target.value }); clearError('businessDisplayName'); }}
                placeholder="Tasty Burgers"
                className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.businessDisplayName ? 'border-red-400' : 'border-[#E5E7EB]'}`}
              />
              {errors.businessDisplayName && <p className="text-xs text-red-500 mt-1">{errors.businessDisplayName}</p>}
              <p className="text-xs text-gray-400 mt-1">This is the name crew members will see</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#132c64] mb-3">Business Size *</label>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { setStep2({ ...step2, businessSize: size }); clearError('businessSize'); }}
                    className={`h-12 rounded-lg border text-sm font-medium transition-colors ${
                      step2.businessSize === size
                        ? 'bg-[#15cb89] border-[#15cb89] text-white'
                        : 'border-[#E5E7EB] text-[#132c64] hover:border-[#15cb89]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {errors.businessSize && <p className="text-xs text-red-500 mt-2">{errors.businessSize}</p>}
            </div>

            <Button onClick={handleStep2} className="w-full" size="lg" isLoading={isLoading}>
              Next
            </Button>
          </div>
        )}

        {/* Step 3: Location Setup */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-semibold text-[#132c64]">Primary Location</h3>

              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Branch Name *</label>
                <input
                  type="text"
                  value={step3.locationName}
                  onChange={(e) => { setStep3({ ...step3, locationName: e.target.value }); clearError('locationName'); }}
                  placeholder="e.g. Main Branch, City Centre, Westfield"
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.locationName ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                />
                {errors.locationName && <p className="text-xs text-red-500 mt-1">{errors.locationName}</p>}
                <p className="text-xs text-gray-400 mt-1">This name will appear in shift postings</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Address Line 1 *</label>
                <input
                  type="text"
                  value={step3.addressLine1}
                  onChange={(e) => { setStep3({ ...step3, addressLine1: e.target.value }); clearError('addressLine1'); }}
                  placeholder="45 High Street"
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.addressLine1 ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                />
                {errors.addressLine1 && <p className="text-xs text-red-500 mt-1">{errors.addressLine1}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={step3.addressLine2}
                  onChange={(e) => setStep3({ ...step3, addressLine2: e.target.value })}
                  placeholder="Apartment, suite"
                  className="w-full h-11 border border-[#E5E7EB] rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#132c64] mb-1.5">City *</label>
                  <input
                    type="text"
                    value={step3.city}
                    onChange={(e) => { setStep3({ ...step3, city: e.target.value }); clearError('city'); }}
                    placeholder="London"
                    className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.city ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#132c64] mb-1.5">Postcode *</label>
                  <input
                    type="text"
                    value={step3.postCode}
                    onChange={(e) => { setStep3({ ...step3, postCode: e.target.value }); clearError('postCode'); }}
                    placeholder="SW1A 1AA"
                    className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.postCode ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                  />
                  {errors.postCode && <p className="text-xs text-red-500 mt-1">{errors.postCode}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Branch Email *</label>
                <input
                  type="email"
                  value={step3.branchEmail}
                  onChange={(e) => { setStep3({ ...step3, branchEmail: e.target.value }); clearError('branchEmail'); }}
                  placeholder="branch@example.com"
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.branchEmail ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                />
                {errors.branchEmail && <p className="text-xs text-red-500 mt-1">{errors.branchEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Contact Name *</label>
                <input
                  type="text"
                  value={step3.contactName}
                  onChange={(e) => { setStep3({ ...step3, contactName: e.target.value }); clearError('contactName'); }}
                  placeholder="Sarah Mitchell"
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.contactName ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                />
                {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#132c64] mb-1.5">Contact Number *</label>
                <input
                  type="tel"
                  value={step3.contactNumber}
                  onChange={(e) => { setStep3({ ...step3, contactNumber: e.target.value }); clearError('contactNumber'); }}
                  placeholder="02071234567"
                  className={`w-full h-11 border rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89] ${errors.contactNumber ? 'border-red-400' : 'border-[#E5E7EB]'}`}
                />
                {errors.contactNumber && <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>}
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-[#132c64] mb-5">Operating Hours</h3>
              <div className="space-y-3">
                {DAYS.map((day) => {
                  const d = operatingHours[day.key];
                  return (
                    <div key={day.key} className="bg-[#F3F4F6] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[#132c64] w-10">{day.label}</span>
                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            d.enabled ? 'bg-[#15cb89]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              d.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {d.enabled ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">Open</label>
                            <input
                              type="time"
                              value={d.open}
                              onChange={(e) => updateHour(day.key, 'open', e.target.value)}
                              className="w-full h-9 border border-[#E5E7EB] rounded-lg px-2 text-sm text-[#132c64] bg-white focus:outline-none focus:ring-1 focus:ring-[#15cb89]"
                            />
                          </div>
                          <span className="text-gray-400 text-xs mt-4">→</span>
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">Close</label>
                            <input
                              type="time"
                              value={d.close}
                              onChange={(e) => updateHour(day.key, 'close', e.target.value)}
                              className="w-full h-9 border border-[#E5E7EB] rounded-lg px-2 text-sm text-[#132c64] bg-white focus:outline-none focus:ring-1 focus:ring-[#15cb89]"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Closed</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button onClick={handleStep3} className="w-full" size="lg" isLoading={isLoading}>
              Next
            </Button>
          </div>
        )}

        {/* Step 4: Documents */}
        {currentStep === 4 && (
          <div className="space-y-5">
            {/* Info banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Documents are optional at this stage. You can upload them now or later from your profile settings.
              </p>
            </div>

            {/* Registration Document */}
            <div className="bg-white rounded-2xl p-7 shadow-sm text-center">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <p className="text-base font-semibold text-[#132c64] mb-1">Registration Document (Optional)</p>
              <p className="text-xs text-gray-400 mb-5">Upload your business registration certificate</p>
              {registrationDoc ? (
                <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-lg px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-[#15cb89] shrink-0" />
                  <span className="text-sm text-[#132c64] flex-1 truncate text-left">{registrationDoc.name}</span>
                  <button onClick={() => setRegistrationDoc(null)} className="text-red-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => regDocRef.current?.click()}
                  className="flex items-center gap-2 bg-[#F3F4F6] hover:bg-gray-200 px-5 py-2.5 rounded-lg mx-auto transition-colors"
                >
                  <Upload className="h-4 w-4 text-[#15cb89]" />
                  <span className="text-sm font-semibold text-[#15cb89]">Upload Document</span>
                </button>
              )}
              <input
                ref={regDocRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setRegistrationDoc(e.target.files?.[0] || null)}
              />
            </div>

            {/* Business License */}
            <div className="bg-white rounded-2xl p-7 shadow-sm text-center">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <p className="text-base font-semibold text-[#132c64] mb-1">Business License (Optional)</p>
              <p className="text-xs text-gray-400 mb-5">Upload your business license</p>
              {businessLicense ? (
                <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-lg px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-[#15cb89] shrink-0" />
                  <span className="text-sm text-[#132c64] flex-1 truncate text-left">{businessLicense.name}</span>
                  <button onClick={() => setBusinessLicense(null)} className="text-red-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => licenseDocRef.current?.click()}
                  className="flex items-center gap-2 bg-[#F3F4F6] hover:bg-gray-200 px-5 py-2.5 rounded-lg mx-auto transition-colors"
                >
                  <Upload className="h-4 w-4 text-[#15cb89]" />
                  <span className="text-sm font-semibold text-[#15cb89]">Upload Document</span>
                </button>
              )}
              <input
                ref={licenseDocRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setBusinessLicense(e.target.files?.[0] || null)}
              />
            </div>

            {/* VAT Number */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-[#132c64] mb-1.5">VAT Number (Optional)</label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="GB123456789"
                className="w-full h-11 border border-[#E5E7EB] rounded-lg px-3 text-sm text-[#132c64] focus:outline-none focus:ring-2 focus:ring-[#15cb89]"
              />
            </div>

            <Button
              onClick={() => handleStep4(false)}
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Complete Setup
            </Button>

            <button
              type="button"
              onClick={() => handleStep4(true)}
              disabled={isLoading}
              className="w-full py-4 border border-dashed border-[#E5E7EB] rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              Skip for now — I&apos;ll upload documents later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
