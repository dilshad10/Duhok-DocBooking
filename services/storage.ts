
import { Doctor, Appointment, Feedback, AdminAction, AdminUser, DoctorStatus, Hospital } from '../types';
import { Language } from '../translations';
import { DEFAULT_SPECIALTIES, DEFAULT_DUHOK_AREAS, DEFAULT_HOSPITALS } from '../constants';

// Shared Global Storage Bin
const CLOUD_SYNC_URL = "https://api.npoint.io/615a9954497e889a24c5"; 

const KEYS = {
  DOCTORS: 'duh_docs_doctors_v6',
  APPOINTMENTS: 'duh_docs_appointments_v6',
  FEEDBACKS: 'duh_docs_feedbacks_v6',
  ADMINS: 'duh_docs_admins_v6',
  ADMIN_ACTIONS: 'duh_docs_admin_actions_v6',
  AUTH: 'duh_docs_auth_v6',
  LANG: 'duh_docs_lang_v6',
  HOSPITALS: 'duh_docs_hospitals_v6',
  SPECIALTIES: 'duh_docs_specialties_v6',
  AREAS: 'duh_docs_areas_v6',
  LAST_SYNC: 'duh_docs_last_sync_v6'
};

const mergeById = <T extends { id: string }>(local: T[], remote: T[]): T[] => {
  const map = new Map<string, T>();
  // Local data first
  local.forEach(item => map.set(item.id, item));
  // Remote data overwrites or adds
  remote.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
};

const seedData = () => {
  const admins = JSON.parse(localStorage.getItem(KEYS.ADMINS) || '[]');
  if (admins.length === 0) {
    const defaultAdmin: AdminUser = {
      id: 'admin_001',
      fullName: 'Duhok Admin',
      email: 'admin@duh.ok',
      passwordHash: 'admin123',
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
        
        if (response.status === 404) {
           return await StorageService.syncWithCloud('push');
        }

        if (!response.ok) return false;

        const cloudData = await response.json();
        
        if (cloudData && typeof cloudData === 'object') {
          // Merge Doctors
          const mergedDocs = mergeById(StorageService.getDoctors(), cloudData.doctors || []);
          localStorage.setItem(KEYS.DOCTORS, JSON.stringify(mergedDocs));

          // Merge Appointments
          const mergedApps = mergeById(StorageService.getAppointments(), cloudData.appointments || []);
          localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(mergedApps));

          // Merge Admins
          const mergedAdmins = mergeById(StorageService.getAdmins(), cloudData.admins || []);
          localStorage.setItem(KEYS.ADMINS, JSON.stringify(mergedAdmins));

          // Static management lists
          if (cloudData.hospitals) localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(cloudData.hospitals));
          if (cloudData.specialties) localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(cloudData.specialties));
          if (cloudData.areas) localStorage.setItem(KEYS.AREAS, JSON.stringify(cloudData.areas));
          
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          window.dispatchEvent(new CustomEvent('sync-complete'));
          return true;
        }
      } else {
        // PUSH logic: Get latest cloud data first to avoid overwriting others
        let cloudData: any = {};
        try {
          const checkRes = await fetch(CLOUD_SYNC_URL);
          if (checkRes.ok) cloudData = await checkRes.json();
        } catch(e) {}

        const finalData = {
          doctors: mergeById(StorageService.getDoctors(), cloudData.doctors || []),
          appointments: mergeById(StorageService.getAppointments(), cloudData.appointments || []),
          admins: mergeById(StorageService.getAdmins(), cloudData.admins || []),
          hospitals: StorageService.getHospitals(),
          specialties: StorageService.getSpecialties(),
          areas: StorageService.getAreas(),
        };

        const response = await fetch(CLOUD_SYNC_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData)
        });

        if (response.ok) {
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        }
      }
    } catch (e) {
      console.error("Sync Error:", e);
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
