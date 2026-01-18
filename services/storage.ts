
import { Doctor, Appointment, Feedback, AdminAction, AdminUser, DoctorStatus } from '../types';

const KEYS = {
  DOCTORS: 'duh_docs_doctors_v3',
  APPOINTMENTS: 'duh_docs_appointments_v3',
  FEEDBACKS: 'duh_docs_feedbacks_v3',
  ADMINS: 'duh_docs_admins_v3',
  ADMIN_ACTIONS: 'duh_docs_admin_actions_v3',
  AUTH: 'duh_docs_auth_v3'
};

const seedData = () => {
  const admins = JSON.parse(localStorage.getItem(KEYS.ADMINS) || '[]');
  if (admins.length === 0) {
    const defaultAdmin: AdminUser = {
      id: 'admin_001',
      fullName: 'Duhok Admin',
      email: 'admin@docbooking.duhok',
      passwordHash: 'admin123',
      role: 'super_admin',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.ADMINS, JSON.stringify([defaultAdmin]));
  }

  const doctors = JSON.parse(localStorage.getItem(KEYS.DOCTORS) || '[]');
  if (doctors.length === 0) {
    const initialDoctors: Doctor[] = [
      {
        id: 'doc_001',
        fullName: 'Karwan Ali',
        email: 'karwan@duhok.med',
        passwordHash: 'pass123',
        phoneNumber: '0750 445 1234',
        specialty: 'Cardiology',
        clinicName: 'Vajeen Private Hospital',
        bio: 'Senior cardiologist specializing in interventional procedures and heart failure management.',
        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
        timeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'],
        status: 'active',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'doc_002',
        fullName: 'Ahmed Zibari',
        email: 'ahmed@duhok.med',
        passwordHash: 'pass123',
        phoneNumber: '0750 112 3344',
        specialty: 'Pediatrics',
        clinicName: 'Zheen International Hospital',
        bio: 'Expert in pediatric infectious diseases and general childhood wellness.',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00'],
        status: 'active',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'doc_003',
        fullName: 'Shervan Bamerni',
        email: 'shervan@duhok.med',
        passwordHash: 'pass123',
        phoneNumber: '0751 998 7766',
        specialty: 'Dermatology',
        clinicName: 'SMC Medical Center',
        bio: 'Clinical dermatologist specializing in skin cancer screening and laser dermatology.',
        workingDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday'],
        timeSlots: ['17:00', '17:30', '18:00', '18:30', '19:00'],
        status: 'active',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'doc_004',
        fullName: 'Azad Duski',
        email: 'azad@duhok.med',
        passwordHash: 'pass123',
        phoneNumber: '0750 221 5566',
        specialty: 'Orthopedics',
        clinicName: 'Duhok Specialist Center',
        bio: 'Consultant orthopedic surgeon with a focus on sports injuries and joint replacement.',
        workingDays: ['Sunday', 'Monday', 'Wednesday'],
        timeSlots: ['16:00', '17:00', '18:00', '19:00'],
        status: 'active',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'doc_005',
        fullName: 'Helin Duhoki',
        email: 'helin@duhok.med',
        passwordHash: 'pass123',
        phoneNumber: '0750 778 9900',
        specialty: 'Dentistry',
        clinicName: 'Zheen Dental Clinic',
        bio: 'Expert in cosmetic dentistry, dental implants, and pediatric oral health.',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        timeSlots: ['09:00', '10:00', '11:00', '16:00', '17:00', '18:00'],
        status: 'active',
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify(initialDoctors));
  }
};

seedData();

export const StorageService = {
  getDoctors: (): Doctor[] => {
    const data = localStorage.getItem(KEYS.DOCTORS);
    return data ? JSON.parse(data) : [];
  },
  saveDoctor: (doctor: Doctor) => {
    const docs = StorageService.getDoctors();
    const index = docs.findIndex(d => d.id === doctor.id);
    if (index > -1) docs[index] = doctor;
    else docs.push(doctor);
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
  },
  saveDoctors: (newDocs: Doctor[]) => {
    const existing = StorageService.getDoctors();
    const filtered = newDocs.filter(n => !existing.some(e => e.fullName === n.fullName));
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify([...existing, ...filtered]));
  },
  getDoctorByEmail: (email: string): Doctor | undefined => {
    return StorageService.getDoctors().find(d => d.email.toLowerCase() === email.toLowerCase());
  },
  getDoctorById: (id: string): Doctor | undefined => {
    return StorageService.getDoctors().find(d => d.id === id);
  },
  getAdmins: (): AdminUser[] => {
    const data = localStorage.getItem(KEYS.ADMINS);
    return data ? JSON.parse(data) : [];
  },
  getAdminByEmail: (email: string): AdminUser | undefined => {
    return StorageService.getAdmins().find(a => a.email.toLowerCase() === email.toLowerCase());
  },
  getAppointments: (): Appointment[] => {
    const data = localStorage.getItem(KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },
  getAppointmentByToken: (token: string): Appointment | undefined => {
    return StorageService.getAppointments().find(a => a.cancelToken === token);
  },
  getAppointmentsByDoctor: (doctorId: string): Appointment[] => {
    return StorageService.getAppointments().filter(a => a.doctorId === doctorId);
  },
  saveAppointment: (appointment: Appointment) => {
    const apps = StorageService.getAppointments();
    apps.push(appointment);
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
  },
  updateAppointment: (appointment: Appointment) => {
    const apps = StorageService.getAppointments();
    const index = apps.findIndex(a => a.id === appointment.id);
    if (index > -1) {
      apps[index] = appointment;
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
    }
  },
  getFeedbacks: (): Feedback[] => {
    const data = localStorage.getItem(KEYS.FEEDBACKS);
    return data ? JSON.parse(data) : [];
  },
  getFeedbackByDoctor: (doctorId: string): Feedback[] => {
    return StorageService.getFeedbacks().filter(f => f.doctorId === doctorId);
  },
  saveFeedback: (feedback: Feedback) => {
    const fbs = StorageService.getFeedbacks();
    fbs.push(feedback);
    localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(fbs));
  },
  getAdminActions: (): AdminAction[] => {
    const data = localStorage.getItem(KEYS.ADMIN_ACTIONS);
    return data ? JSON.parse(data) : [];
  },
  logAdminAction: (action: AdminAction) => {
    const actions = StorageService.getAdminActions();
    actions.push(action);
    localStorage.setItem(KEYS.ADMIN_ACTIONS, JSON.stringify(actions));
  },
  setSession: (session: { role: 'admin' | 'doctor', id: string, name: string, adminRole?: any } | null) => {
    if (session) localStorage.setItem(KEYS.AUTH, JSON.stringify(session));
    else localStorage.removeItem(KEYS.AUTH);
  },
  getSession: () => {
    const data = localStorage.getItem(KEYS.AUTH);
    return data ? JSON.parse(data) : null;
  }
};
