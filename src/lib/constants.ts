export const API_BASE_URL = '/api/proxy';

export const COLORS = {
  green: '#15cb89',
  darkBlue: '#132c64',
  orange: '#ff8401',
  white: '#ffffff',
  black: '#000000',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const ROLES = [
  { id: 1, name: 'Waiter/Waitress' },
  { id: 2, name: 'Bartender' },
  { id: 3, name: 'Chef' },
  { id: 4, name: 'Kitchen Porter' },
  { id: 5, name: 'Barista' },
  { id: 6, name: 'Delivery Driver' },
  { id: 7, name: 'Host/Hostess' },
  { id: 8, name: 'Manager' },
  { id: 9, name: 'Cleaner' },
  { id: 10, name: 'Security Guard' },
];

export const ROLE_REQUIREMENTS: Record<string, string> = {
  'Waiter/Waitress': `• Minimum 1 year of waiting experience
• Excellent customer service skills
• Ability to work in fast-paced environment
• Knowledge of food service procedures
• Team player with positive attitude
• Flexible with evening/weekend shifts
• Professional appearance and communication`,

  'Bartender': `• Minimum 1 year bartending experience
• Knowledge of cocktails and beverages
• Excellent customer service skills
• Ability to work in busy environments
• Personal Licence (desirable)
• Must be 18+ years old`,

  'Chef': `• Minimum 2 years of commercial kitchen experience
• Food Safety Certificate (Level 2 or higher)
• Strong cooking and preparation skills
• Ability to work under pressure
• High hygiene and cleanliness standards
• Good communication and teamwork`,

  'Kitchen Porter': `• Previous kitchen experience preferred
• Physically fit for cleaning tasks
• Knowledge of hygiene standards
• Ability to work in fast-paced environment
• Team player with positive attitude
• Reliable and punctual`,

  'Barista': `• Coffee preparation experience preferred
• Knowledge of espresso machines
• Customer service skills
• Attention to detail
• Ability to work under pressure
• Food Safety Certificate (Level 1 or 2)`,

  'Delivery Driver': `• Valid UK driving licence (1+ year)
• Own vehicle with insurance
• Strong knowledge of local area
• Reliable smartphone for navigation
• Excellent time management skills
• Friendly and professional attitude
• Clean driving record preferred`,

  'Host/Hostess': `• Customer service experience preferred
• Excellent communication skills
• Professional appearance
• Ability to manage reservations
• Friendly and welcoming personality
• Ability to work under pressure`,

  'Manager': `• Minimum 2 years management experience
• Strong leadership and communication skills
• Knowledge of health and safety regulations
• Problem-solving abilities
• Ability to train and motivate staff
• Flexible with shift patterns`,

  'Cleaner': `• Previous cleaning experience preferred
• Strong attention to detail
• Ability to work independently
• Knowledge of cleaning products and tools
• Physically fit for routine tasks
• Reliable and trustworthy`,

  'Security Guard': `• Valid SIA Licence required
• Previous security experience
• Strong communication skills
• Ability to handle difficult situations
• Professional appearance
• Must be 18+ years old`,
};

export const PERKS = [
  { id: 1, name: 'Free Meal' },
  { id: 2, name: 'Free Parking' },
  { id: 3, name: 'Tips Included' },
  { id: 4, name: 'Per Delivery Pay' },
  { id: 5, name: 'Staff Discount' },
  { id: 6, name: 'Flexible Hours' },
  { id: 7, name: 'Training Provided' },
  { id: 8, name: 'Uniform Provided' },
];

export const BUSINESS_TYPES = [
  'Restaurant',
  'Cafe',
  'Hotel',
  'Retail',
  'Events',
  'Other',
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DRIVING_LICENSE_TYPES = [
  'Car (Category B)',
  'Motorcycle (Category A)',
  'Van (Category CT)',
  'Truck (Category C)',
];

// --- Shift status ---

/** Labels for Business Owner view (section 1.2 of STATUS_FLOW_DOCUMENTATION) */
export const SHIFT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  posted: 'Posted',
  pending_applications: 'Pending Review',
  filled: 'Fully Staffed',
  in_progress: 'In Progress',
  completed: 'Completed',
  bo_review: 'Review Pending',
  closed: 'Closed',
  expired: 'Expired',
  cancelled_by_bo: 'Cancelled',
  no_show: 'No Show',
  disputed: 'Disputed',
  archived: 'Archived',
};

/** Labels for Crew Member view (section 1.4) */
export const CREW_SHIFT_STATUS_LABELS: Record<string, string> = {
  posted: 'Available',
  pending_applications: 'Available',
  filled: 'Fully Booked',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled_by_bo: 'Cancelled',
  expired: 'Expired',
};

export const SHIFT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  posted: 'bg-green-100 text-green-800',
  pending_applications: 'bg-orange-100 text-orange-800',
  filled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  bo_review: 'bg-orange-100 text-orange-800',
  closed: 'bg-slate-100 text-slate-600',
  expired: 'bg-red-100 text-red-800',
  cancelled_by_bo: 'bg-red-100 text-red-800',
  no_show: 'bg-red-100 text-red-800',
  disputed: 'bg-orange-100 text-orange-900',
  archived: 'bg-gray-100 text-gray-500',
};

// --- Application status ---

/** Labels for Crew Member view (section 2.5) */
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  applied: 'Pending Review',
  accepted: 'Accepted',
  approved: 'Accepted',
  rejected: 'Not Selected',
  declined: 'Not Selected',
  withdrawn: 'Withdrawn',
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-800',
  applied: 'bg-orange-100 text-orange-800',
  accepted: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  declined: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
};

// --- Assignment status ---

/** Labels for Crew Member view (section 3.6) */
export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  assigned: 'Upcoming',
  confirmed: 'Confirmed',
  checked_in: 'Working',
  checked_out: 'Shift Ended',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  withdrawn: 'Withdrawn',
};

export const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  checked_in: 'bg-purple-100 text-purple-800',
  checked_out: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
};
