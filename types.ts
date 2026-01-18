
export type DoctorStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type SubscriptionStatus = 'free' | 'active' | 'expired';
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled';
export type AdminRole = 'admin' | 'super_admin';
export type AdminActionType = 'approve_doctor' | 'reject_doctor' | 'suspend_doctor' | 'activate_doctor';

export interface Hospital {
  id: string;
  name: string;
  area: string;
  coords: string;
}

export interface Doctor {
  id: string; // primary key
  fullName: string;
  email: string; // unique
  passwordHash: string;
  phoneNumber: string;
  specialty: string;
  clinicName: string;
  profileImageUrl?: string; // Doctor's profile picture
  bio?: string; // Short biography for patients
  workingDays: string[]; // array/JSON
  timeSlots: string[]; // array/JSON
  status: DoctorStatus; // ENUM
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
  approvedAt?: string | null;
  approvedByAdminId?: string | null;
  notes?: string; // internal admin notes
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  createdAt: string;
}

export interface Appointment {
  id: string;
  doctorId: string; // foreign key -> doctors.id
  doctorName: string;
  clinicName: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus; // ENUM
  createdAt: string;
  cancelToken?: string; // Unique token for cancellation link
  cancelledAt?: string | null; // Timestamp of cancellation
}

export interface Feedback {
  id: string;
  appointmentId: string; // foreign key
  doctorId: string;
  success: boolean;
  comment?: string;
  createdAt: string;
}

export interface AdminAction {
  id: string;
  adminId: string;
  actionType: AdminActionType; // ENUM
  targetDoctorId: string;
  targetDoctorName: string; // Helper for logging
  actionNote: string;
  createdAt: string;
}

export interface UserSession {
  role: 'admin' | 'doctor';
  id: string;
  name: string;
  adminRole?: AdminRole;
}
