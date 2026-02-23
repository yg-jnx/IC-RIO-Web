export type UserType = 'BO' | 'CREW';

export interface User {
  user_id: number;
  user_type: UserType;
  username: string;
  email: string;
  signup_completed: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  user_type: UserType;
  signup_completed: boolean;
  username: string;
  email: string;
}

export interface ApiError {
  error: string;
  message?: string;
  detail?: string;
  status: number;
}

export interface Perk {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface OpeningHour {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface Location {
  location_id: number;
  location_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postcode: string;
  country: string;
  gps_latitude?: number;
  gps_longitude?: number;
  branch_email: string;
  contact_name: string;
  contact_number: string;
  is_primary: boolean;
  opening_hours: OpeningHour[];
}

export interface Shift {
  shift_id: number;
  shift_title: string;
  crew_needed: number;
  shift_start_date: string;
  shift_end_date: string;
  daily_start_time: string;
  daily_end_time: string;
  shift_duration_hours: number;
  pay_rate: number;
  currency: string;
  pay_type: string;
  shift_status: string;
  published_at: string;
  created_at: string;
  perks: Perk[];
  applications_count: number;
  assigned_count: number;
  slots_remaining: number;
  location?: Location;
  role?: Role;
  additional_notes?: string;
  shift_requirements?: string;
}

export interface Application {
  application_id: number;
  shift_id: number;
  crew_id: number;
  status: 'pending' | 'applied' | 'approved' | 'accepted' | 'rejected' | 'withdrawn' | 'cancelled';
  cover_message?: string;
  applied_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  assignment_id?: number | null;
  assignment_status?: string | null;
  has_bo_rated?: boolean;
  rating_submitted?: boolean;
  crew?: CrewProfile;
  shift?: Shift;
}

export interface CrewProfile {
  user_id: number;
  full_name: string;
  profile_photo?: string;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  postcode?: string;
  previous_experience?: string;
  previous_employer?: string;
  rating?: number;
  review_count?: number;
}

export interface DashboardStats {
  activeShiftPosts: number;
  totalApplicants: number;
  filledPositions: number;
  pendingReviews: number;
}

export interface BusinessDashboard {
  stats: DashboardStats;
  todays_shifts: Shift[];
  upcoming_shifts: Shift[];
  completed_shifts: Shift[];
}

export interface CrewDashboard {
  todays_shifts: CrewShift[];
  upcoming_shifts: CrewShift[];
  completed_shifts: CrewShift[];
  summary: {
    active_applications: number;
    upcoming_shifts: number;
    completed_shifts: number;
    total_earnings?: number;
  };
}

export interface CrewShift {
  assignment_id: number;
  shift: Shift;
  clock_in_time?: string;
  clock_out_time?: string;
  is_clocked_in: boolean;
}

export interface SubscriptionPlan {
  plan_type: 'monthly' | 'six_month';
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
  stripe_price_id: string;
  description: string;
  savings?: number;
  features: string[];
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  has_access: boolean;
  status:
    | 'trial_active'
    | 'trial_expired'
    | 'active'
    | 'cancelled'
    | 'expired'
    | 'refunded'
    | 'past_due';
  plan_type?: 'trial' | 'monthly' | 'six_month';
  trial_end_date?: string;
  trial_days_remaining?: number;
  current_period_end?: string;
  amount_paid?: number;
  cancelled_at?: string;
  message?: string;
  trial_eligible?: boolean;
  available_plans?: SubscriptionPlan[];
}

export interface Pagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}
