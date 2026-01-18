
import { Doctor, Appointment, Feedback, AdminAction, AdminUser, DoctorStatus, Hospital } from '../types';
import { Language } from '../translations';
import { DEFAULT_SPECIALTIES, DEFAULT_DUHOK_AREAS, DEFAULT_HOSPITALS } from '../constants';

const KEYS = {
  DOCTORS: 'duh_docs_doctors_v3',
  APPOINTMENTS: 'duh_docs_appointments_v3',
  FEEDBACKS: 'duh_docs_feedbacks_v3',
  ADMINS: 'duh_docs_admins_v3',
  ADMIN_ACTIONS: 'duh_docs_admin_actions_v3',
  AUTH: 'duh_docs_auth_v3',
  LANG: 'duh_docs_lang_v3',
  HOSPITALS: 'duh_docs_hospitals_v3',
  SPECIALTIES: 'duh_docs_specialties_v3',
  AREAS: 'duh_docs_areas_v3'
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

  // Seed Dynamic Content if empty
  if (!localStorage.getItem(KEYS.HOSPITALS)) {
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(DEFAULT_HOSPITALS.map((h, i) => ({ ...h, id: `hosp_${i}` }))));
  }
  if (!localStorage.getItem(KEYS.SPECIALTIES)) {
    localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(DEFAULT_SPECIALTIES));
  }
  if (!localStorage.getItem(KEYS.AREAS)) {
    localStorage.setItem(KEYS.AREAS, JSON.stringify(DEFAULT_DUHOK_AREAS));
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
        profileImageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
        bio: 'Senior cardiologist specializing in interventional procedures and heart failure management.',
        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
        timeSlots: ['16:00', '16:20', '16:40', '17:00', '17:20', '17:40', '18:00', '18:20', '18:40'],
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
        profileImageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200',
        bio: 'Expert in pediatric infectious diseases and general childhood wellness.',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        timeSlots: ['09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00'],
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
  getLanguage: (): Language => {
    return (localStorage.getItem(KEYS.LANG) as Language) || 'en';
  },
  setLanguage: (lang: Language) => {
    localStorage.setItem(KEYS.LANG, lang);
  },
  
  // Dynamic Content Methods
  getHospitals: (): Hospital[] => {
    const data = localStorage.getItem(KEYS.HOSPITALS);
    return data ? JSON.parse(data) : [];
  },
  saveHospital: (hosp: Hospital) => {
    const hosps = StorageService.getHospitals();
    const idx = hosps.findIndex(h => h.id === hosp.id);
    if (idx > -1) hosps[idx] = hosp;
    else hosps.push(hosp);
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(hosps));
  },
  deleteHospital: (id: string) => {
    const hosps = StorageService.getHospitals().filter(h => h.id !== id);
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(hosps));
  },
  
  getSpecialties: (): string[] => {
    const data = localStorage.getItem(KEYS.SPECIALTIES);
    return data ? JSON.parse(data) : [];
  },
  saveSpecialties: (list: string[]) => {
    localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(list));
  },
  
  getAreas: (): string[] => {
    const data = localStorage.getItem(KEYS.AREAS);
    return data ? JSON.parse(data) : [];
  },
  saveAreas: (list: string[]) => {
    localStorage.setItem(KEYS.AREAS, JSON.stringify(list));
  },

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
