
import { Doctor, Appointment, Feedback, AdminAction, AdminUser, DoctorStatus, Hospital } from '../types';
import { Language } from '../translations';
import { DEFAULT_SPECIALTIES, DEFAULT_DUHOK_AREAS, DEFAULT_HOSPITALS } from '../constants';

// Dedicated Shared Public Vault for this Duhok Healthcare Instance
const CLOUD_SYNC_URL = "https://api.npoint.io/89e5a51356e9c490a6d5"; 

const KEYS = {
  DOCTORS: 'duh_docs_doctors_v4',
  APPOINTMENTS: 'duh_docs_appointments_v4',
  FEEDBACKS: 'duh_docs_feedbacks_v4',
  ADMINS: 'duh_docs_admins_v4',
  ADMIN_ACTIONS: 'duh_docs_admin_actions_v4',
  AUTH: 'duh_docs_auth_v4',
  LANG: 'duh_docs_lang_v4',
  HOSPITALS: 'duh_docs_hospitals_v4',
  SPECIALTIES: 'duh_docs_specialties_v4',
  AREAS: 'duh_docs_areas_v4',
  LAST_SYNC: 'duh_docs_last_sync_v4'
};

const seedData = () => {
  const admins = JSON.parse(localStorage.getItem(KEYS.ADMINS) || '[]');
  if (admins.length === 0) {
    const defaultAdmin: AdminUser = {
      id: 'admin_001',
      fullName: 'Duhok Admin',
      email: 'admin@docbooking.duhok',
      passwordHash: '(11223344$$&&@@)',
      role: 'super_admin',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.ADMINS, JSON.stringify([defaultAdmin]));
  }

  if (!localStorage.getItem(KEYS.HOSPITALS)) {
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(DEFAULT_HOSPITALS.map((h, i) => ({ ...h, id: `hosp_${i}` }))));
  }
  if (!localStorage.getItem(KEYS.SPECIALTIES)) {
    localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(DEFAULT_SPECIALTIES));
  }
  if (!localStorage.getItem(KEYS.AREAS)) {
    localStorage.setItem(KEYS.AREAS, JSON.stringify(DEFAULT_DUHOK_AREAS));
  }
};

seedData();

export const StorageService = {
  syncWithCloud: async (direction: 'push' | 'pull' = 'pull'): Promise<boolean> => {
    try {
      if (direction === 'pull') {
        const response = await fetch(CLOUD_SYNC_URL);
        if (!response.ok) return false;

        const text = await response.text();
        if (!text || text.trim() === "" || text === "{}") {
          // If remote is empty, push our local seed
          await StorageService.syncWithCloud('push');
          return true;
        }

        const cloudData = JSON.parse(text);
        if (cloudData && typeof cloudData === 'object') {
          // Merge Strategy: Prefer remote data for shared entities
          if (cloudData.doctors) localStorage.setItem(KEYS.DOCTORS, JSON.stringify(cloudData.doctors));
          if (cloudData.appointments) localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(cloudData.appointments));
          if (cloudData.hospitals) localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(cloudData.hospitals));
          if (cloudData.specialties) localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(cloudData.specialties));
          if (cloudData.areas) localStorage.setItem(KEYS.AREAS, JSON.stringify(cloudData.areas));
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        }
      } else {
        const payload = {
          doctors: StorageService.getDoctors(),
          appointments: StorageService.getAppointments(),
          hospitals: StorageService.getHospitals(),
          specialties: StorageService.getSpecialties(),
          areas: StorageService.getAreas(),
        };

        const response = await fetch(CLOUD_SYNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        }
      }
    } catch (e) {
      console.error("Cloud sync error:", e);
      return false;
    }
    return false;
  },

  getLanguage: (): Language => {
    return (localStorage.getItem(KEYS.LANG) as Language) || 'en';
  },
  setLanguage: (lang: Language) => {
    localStorage.setItem(KEYS.LANG, lang);
  },
  
  getHospitals: (): Hospital[] => {
    const data = localStorage.getItem(KEYS.HOSPITALS);
    return data ? JSON.parse(data) : [];
  },
  saveHospital: async (hosp: Hospital) => {
    const hosps = StorageService.getHospitals();
    const idx = hosps.findIndex(h => h.id === hosp.id);
    if (idx > -1) hosps[idx] = hosp;
    else hosps.push(hosp);
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(hosps));
    return await StorageService.syncWithCloud('push');
  },
  deleteHospital: async (id: string) => {
    const hosps = StorageService.getHospitals().filter(h => h.id !== id);
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(hosps));
    return await StorageService.syncWithCloud('push');
  },
  
  getSpecialties: (): string[] => {
    const data = localStorage.getItem(KEYS.SPECIALTIES);
    return data ? JSON.parse(data) : [];
  },
  saveSpecialties: async (list: string[]) => {
    localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(list));
    return await StorageService.syncWithCloud('push');
  },
  
  getAreas: (): string[] => {
    const data = localStorage.getItem(KEYS.AREAS);
    return data ? JSON.parse(data) : [];
  },
  saveAreas: async (list: string[]) => {
    localStorage.setItem(KEYS.AREAS, JSON.stringify(list));
    return await StorageService.syncWithCloud('push');
  },

  getDoctors: (): Doctor[] => {
    const data = localStorage.getItem(KEYS.DOCTORS);
    return data ? JSON.parse(data) : [];
  },
  saveDoctor: async (doctor: Doctor) => {
    const docs = StorageService.getDoctors();
    const index = docs.findIndex(d => d.id === doctor.id);
    if (index > -1) docs[index] = doctor;
    else docs.push(doctor);
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
    return await StorageService.syncWithCloud('push');
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
  saveAppointment: async (appointment: Appointment) => {
    const apps = StorageService.getAppointments();
    apps.push(appointment);
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
    return await StorageService.syncWithCloud('push');
  },
  updateAppointment: async (appointment: Appointment) => {
    const apps = StorageService.getAppointments();
    const index = apps.findIndex(a => a.id === appointment.id);
    if (index > -1) {
      apps[index] = appointment;
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
      return await StorageService.syncWithCloud('push');
    }
    return false;
  },
  getFeedbacks: (): Feedback[] => {
    const data = localStorage.getItem(KEYS.FEEDBACKS);
    return data ? JSON.parse(data) : [];
  },
  getFeedbackByDoctor: (doctorId: string): Feedback[] => {
    return StorageService.getFeedbacks().filter(f => f.doctorId === doctorId);
  },
  saveFeedback: async (feedback: Feedback) => {
    const fbs = StorageService.getFeedbacks();
    fbs.push(feedback);
    localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(fbs));
    return await StorageService.syncWithCloud('push');
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
