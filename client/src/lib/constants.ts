// App information
export const APP_NAME = 'MediCare';

// Appointments status
export enum AppointmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Invoice status
export enum InvoiceStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  CANCELLED = 'cancelled'
}

// User roles
export enum UserRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient'
}

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'as', name: 'অসমীয়া' }
];

// Blood groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Gender options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

// Days of week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

// Time slots (30 minutes intervals from 8:00 AM to 8:00 PM)
export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

// Common medication frequencies
export const MEDICATION_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every morning',
  'Every night',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed'
];

// Common medication durations
export const MEDICATION_DURATIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '1 month',
  '2 months',
  '3 months',
  'Ongoing'
];

// Navigation items for sidebar
export const DOCTOR_NAV_ITEMS = [
  { path: '/dashboard', icon: 'ChartLine', label: 'dashboard' },
  { path: '/appointments', icon: 'CalendarCheck', label: 'appointments' },
  { path: '/patients', icon: 'UserRound', label: 'patients' },
  { path: '/prescriptions', icon: 'Stethoscope', label: 'prescriptions' },
  { path: '/medical-records', icon: 'FileText', label: 'medicalRecords' },
  { path: '/billing', icon: 'Receipt', label: 'billing' },
  { path: '/settings', icon: 'Settings', label: 'settings' }
];

export const PATIENT_NAV_ITEMS = [
  { path: '/dashboard', icon: 'ChartLine', label: 'dashboard' },
  { path: '/appointments', icon: 'CalendarCheck', label: 'appointments' },
  { path: '/prescriptions', icon: 'Stethoscope', label: 'prescriptions' },
  { path: '/medical-records', icon: 'FileText', label: 'medicalRecords' },
  { path: '/billing', icon: 'Receipt', label: 'billing' },
  { path: '/settings', icon: 'Settings', label: 'settings' }
];

// Dashboard statistics colors
export const STAT_COLORS = {
  appointments: {
    bg: 'bg-primary-light bg-opacity-20',
    icon: 'text-primary',
    trend: 'text-success'
  },
  patients: {
    bg: 'bg-secondary-light bg-opacity-20',
    icon: 'text-secondary',
    trend: 'text-success'
  },
  reports: {
    bg: 'bg-warning bg-opacity-20',
    icon: 'text-warning',
    trend: 'text-error'
  },
  totalPatients: {
    bg: 'bg-info bg-opacity-20',
    icon: 'text-info',
    trend: 'text-success'
  }
};
