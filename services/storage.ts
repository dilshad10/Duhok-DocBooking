
import { Doctor, Appointment, Feedback, AdminAction, AdminUser, DoctorStatus, Hospital } from '../types';
import { Language } from '../translations';
import { DEFAULT_SPECIALTIES, DEFAULT_DUHOK_AREAS, DEFAULT_HOSPITALS } from '../constants';

// Dedicated Shared Public Vault for Duhok Doc
// We use a fresh BIN and PUT method for reliable shared state.
const CLOUD_SYNC_URL = "https://api.npoint.io/7447663d8d648b26955d"; 

const KEYS = {
  DOCTORS: 'duh_docs_doctors_v5',
  APPOINTMENTS: 'duh_docs_appointments_v5',
  FEEDBACKS: 'duh_docs_feedbacks_v5',
  ADMINS: 'duh_docs_admins_v5',
  ADMIN_ACTIONS: 'duh_docs_admin_actions_v5',
  AUTH: 'duh_docs_auth_v5',
  LANG: 'duh_docs_lang_v5',
  HOSPITALS: 'duh_docs_hospitals_v5',
  SPECIALTIES: 'duh_docs_specialties_v5',
  AREAS: 'duh_docs_areas_v5',
  LAST_SYNC: 'duh_docs_last_sync_v5'
};

// Helper to merge two arrays of objects by an 'id' property
const mergeById = <T extends { id: string }>(local: T[], remote: T[]): T[] => {
  const map = new Map<string, T>();
  local.forEach(item => map.set(item.id, item));
  remote.forEach(item => {
    // Remote data usually takes precedence for shared state
    map.set(item.id, item); 
  });
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
        console.log("☁️ Attempting Pull...");
        const response = await fetch(CLOUD_SYNC_URL);
        
        // SELF-HEALING: If bin doesn't exist (404), create it by pushing local data
        if (response.status === 404) {
           console.warn("⚠️ Cloud bin not found (404). Initializing now...");
           return await StorageService.syncWithCloud('push');
        }

        if (!response.ok) {
           console.error("❌ Cloud pull failed:", response.status);
           return false;
        }

        const cloudData = await response.json();
        
        if (cloudData && typeof cloudData === 'object') {
          // Merge Doctors
          const localDocs = StorageService.getDoctors();
          const remoteDocs = cloudData.doctors || [];
          localStorage.setItem(KEYS.DOCTORS, JSON.stringify(mergeById(localDocs, remoteDocs)));

          // Merge Appointments
          const localApps = StorageService.getAppointments();
          const remoteApps = cloudData.appointments || [];
          localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(mergeById(localApps, remoteApps)));

          // Merge Admins
          const localAdmins = StorageService.getAdmins();
          const remoteAdmins = cloudData.admins || [];
          localStorage.setItem(KEYS.ADMINS, JSON.stringify(mergeById(localAdmins, remoteAdmins)));

          // Overwrite static management lists
          if (cloudData.hospitals) localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(cloudData.hospitals));
          if (cloudData.specialties) localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(cloudData.specialties));
          if (cloudData.areas) localStorage.setItem(KEYS.AREAS, JSON.stringify(cloudData.areas));
          
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          window.dispatchEvent(new CustomEvent('sync-complete'));
          console.log("✅ Pull complete.");
          return true;
        }
      } else {
        console.log("☁️ Attempting Push...");
        
        // To be safe, try to get existing data to merge before we overwrite
        let remoteData: any = {};
        try {
          const checkRes = await fetch(CLOUD_SYNC_URL);
          if (checkRes.ok) remoteData = await checkRes.json();
        } catch(e) { /* ignore pull error during push cycle */ }

        const payload = {
          doctors: mergeById(StorageService.getDoctors(), remoteData.doctors || []),
          appointments: mergeById(StorageService.getAppointments(), remoteData.appointments || []),
          admins: mergeById(StorageService.getAdmins(), remoteData.admins || []),
          hospitals: StorageService.getHospitals(),
          specialties: StorageService.getSpecialties(),
          areas: StorageService.getAreas(),
        };

        const response = await fetch(CLOUD_SYNC_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log("✅ Push complete.");
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        } else {
          console.error("❌ Push failed:", response.status);
        }
      }
    } catch (e) {
      console.error("❌ Sync Error:", e);
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
