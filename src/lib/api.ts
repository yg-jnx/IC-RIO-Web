import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL } from './constants';

const TOKEN_KEY = 'instacrew_access_token';
const REFRESH_TOKEN_KEY = 'instacrew_refresh_token';
const USER_TYPE_KEY = 'instacrew_user_type';

export const getToken = () => Cookies.get(TOKEN_KEY);
export const getRefreshToken = () => Cookies.get(REFRESH_TOKEN_KEY);
export const getUserType = () => Cookies.get(USER_TYPE_KEY) as 'BO' | 'CREW' | undefined;

const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

export const setTokens = (
  accessToken: string,
  refreshToken: string,
  userType: 'BO' | 'CREW',
  expiresIn?: number
) => {
  const expires = expiresIn ? expiresIn / 86400 : 1;
  Cookies.set(TOKEN_KEY, accessToken, { expires, secure: isSecure, sameSite: 'lax' });
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 30, secure: isSecure, sameSite: 'lax' });
  Cookies.set(USER_TYPE_KEY, userType, { expires: 30, secure: isSecure, sameSite: 'lax' });
};

export const clearTokens = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(USER_TYPE_KEY);
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const isLoginRequest = originalRequest.url?.includes('/login');
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      const isProtectedRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/business');

      if (!refreshToken) {
        clearTokens();
        if (!isProtectedRoute) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const access = response.data.access_token;
        const userType = getUserType() || 'BO';
        setTokens(access, refreshToken, userType);
        processQueue(null, access);
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${access}`,
        };
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (!isProtectedRoute) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Auth APIs
export const authApi = {
  login: (data: {
    username: string;
    password: string;
    user_type: 'BO' | 'CREW';
    device_id?: string;
    device_type?: string;
    fcm_token?: string;
  }) => apiClient.post('/login', data),

  signupBusiness: (data: {
    full_name: string;
    email: string;
    phone_number: string;
    username: string;
    password: string;
  }) => apiClient.post('/business/accountcreation', data),

  signupCrew: (data: {
    full_name: string;
    email: string;
    phone_number: string;
    username: string;
    password: string;
  }) => apiClient.post('/crew/accountcreation', data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgotpassword', { email }),

  resetPassword: (token: string, new_password: string) =>
    apiClient.post('/auth/resetpassword', { token, new_password }),

  getOnboardingStatus: () => apiClient.get('/onboarding/status'),
};

// Business APIs
export const businessApi = {
  // Onboarding
  verifyCompany: (company_number: string) =>
    apiClient.post('/business/verifycompany', { company_number }),

  saveBasicProfile: (data: {
    business_registered_name: string;
    business_email: string;
    business_owner_name: string;
    business_type: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postcode: string;
    country: string;
  }) => apiClient.post('/business/profile/basic', data),

  saveBusinessDetails: (data: {
    business_display_name: string;
    business_member_size: number;
  }) => apiClient.post('/business/profile/details', data),

  saveLocation: (data: object) => apiClient.post('/business/profile/locations', data),

  uploadRegistrationDocs: (formData: FormData) =>
    apiClient.post('/business/profile/registration', formData),

  // Dashboard
  getDashboard: () => apiClient.get('/business/dashboard'),

  // Locations
  getLocations: () => apiClient.get('/business/profile/locations'),
  createLocation: (data: object) => apiClient.post('/business/profile/locations', data),
  updateLocation: (data: object) => apiClient.put('/business/profile/locations', data),
  deleteLocation: (locationId: number) =>
    apiClient.delete(`/business/profile/locations?location_id=${locationId}`),

  // Shifts
  postShift: (data: object) => apiClient.post('/business/shift/post', data),
  getAllShifts: (page = 1, pageSize = 20) =>
    apiClient.get(`/business/getallshifts?page=${page}&page_size=${pageSize}`),
  getShift: (shiftId: number) => apiClient.get(`/business/shift/${shiftId}`),
  updateShift: (shiftId: number, data: object) =>
    apiClient.put(`/business/shift/${shiftId}`, data),
  cancelShift: (shiftId: number, reason?: string) => apiClient.post(`/business/shifts/${shiftId}/cancel`, { cancellation_reason: reason || 'Cancelled by business owner' }),
  expireShift: (shiftId: number) => apiClient.post(`/business/shifts/${shiftId}/expire`, {}),

  // Applications
  getShiftApplications: (shiftId: number, status?: string) =>
    apiClient.get(
      `/business/shift/${shiftId}/applications${status ? `?status=${status}` : ''}`
    ),
  getApplication: (applicationId: number) =>
    apiClient.get(`/business/applications/${applicationId}`),
  reviewApplication: (applicationId: number, data: { is_approved: boolean; rejection_reason?: string }) =>
    apiClient.post(`/business/applications/${applicationId}/review`, data),
  rateCrewMember: (data: { shift_assignment_id: number; work_quality_rating: number; punctuality_rating: number; professionalism_rating: number; teamwork_rating: number; would_hire_again: boolean; followed_instructions: boolean; appropriate_attire: boolean; review_comment?: string; private_notes?: string }) =>
    apiClient.post(`/ratings/crew`, data),
  getCrewProfile: (userId: number) =>
    apiClient.get(`/crew/profile/${userId}`),
  getClockEvents: (assignmentId: number) =>
    apiClient.get(`/assignments/${assignmentId}/clockevents`),
};

// Crew APIs
export const crewApi = {
  // Onboarding
  savePersonalDetails: (formData: FormData) =>
    apiClient.post('/crew/onboarding/personaldetails', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  saveWorkPreferences: (data: object) =>
    apiClient.post('/crew/onboarding/workpreferences', data),

  saveSkillsExperience: (formData: FormData) =>
    apiClient.post('/crew/onboarding/skillsexperience', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadVerificationDocuments: (formData: FormData) =>
    apiClient.post('/crew/onboarding/verificationdocuments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Dashboard
  getDashboard: () => apiClient.get('/crew/dashboard'),

  // Browse Shifts
  browseShifts: (params: Record<string, string | number>) =>
    apiClient.get('/crew/shift/browse', { params }),

  // Applications
  applyToShift: (shiftId: number, data: { cover_message?: string }) =>
    apiClient.post(`/crew/shift/${shiftId}/apply`, data),
  getMyApplications: (page = 1, pageSize = 20) =>
    apiClient.get(`/crew/applications?page=${page}&page_size=${pageSize}`),
  withdrawApplication: (shiftId: number, reason = 'Personal reason') =>
    apiClient.post(`/crew/shift/${shiftId}/withdraw`, { reason }),

  // Assignments
  clockIn: (assignmentId: number, data: { gps_latitude?: number; gps_longitude?: number }) =>
    apiClient.post(`/crew/assignments/${assignmentId}/clockin`, data),
  clockOut: (assignmentId: number, data: { gps_latitude?: number; gps_longitude?: number }) =>
    apiClient.post(`/crew/assignments/${assignmentId}/clockout`, data),
  getClockEvents: (assignmentId: number) =>
    apiClient.get(`/assignments/${assignmentId}/clockevents`),

  // Ratings
  rateBusiness: (data: { shift_assignment_id: number; workplace_environment_rating: number; management_rating: number; payment_accuracy_rating: number; shift_description_accuracy_rating: number; perks_provided: boolean; paid_on_time: boolean; safe_working_conditions: boolean; would_work_again: boolean; shift_started_as_scheduled: boolean; review_comment?: string }) =>
    apiClient.post(`/ratings/business`, data),
};

// Subscription APIs
export const subscriptionApi = {
  getPlans: () => apiClient.get('/subscription/plans'),
  getStatus: () => apiClient.get('/subscription/status'),
  startTrial: () => apiClient.post('/subscription/trial'),
  createCheckout: (data: { plan_type: string; success_url: string; cancel_url: string }) =>
    apiClient.post('/subscription/checkout', data),
  cancel: () => apiClient.post('/subscription/cancel'),
  reactivate: () => apiClient.post('/subscription/reactivate'),
  getPortalUrl: (returnUrl?: string) => apiClient.post('/subscription/portal', { return_url: returnUrl || (typeof window !== 'undefined' ? window.location.href : '') }),
  getInvoices: () => apiClient.get('/subscription/invoices'),
  updatePaymentMethod: (data: object) => apiClient.put('/subscription/payment-method', data),
};
