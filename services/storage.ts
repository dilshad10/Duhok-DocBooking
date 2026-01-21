
import { Doctor, Appointment, Feedback, AdminAction, AdminUser, DoctorStatus, Hospital } from '../types';
import { Language } from '../translations';
import { DEFAULT_SPECIALTIES, DEFAULT_DUHOK_AREAS, DEFAULT_HOSPITALS } from '../constants';

// Stable Cloud Bin ID for Version 11
const CLOUD_SYNC_URL = "https://api.npoint.io/73e86c0683411b012674"; 

const KEYS = {
  DOCTORS: 'duh_docs_doctors_v11',
  APPOINTMENTS: 'duh_docs_appointments_v11',
  FEEDBACKS: 'duh_docs_feedbacks_v11',
  ADMINS: 'duh_docs_admins_v11',
  ADMIN_ACTIONS: 'duh_docs_admin_actions_v11',
  AUTH: 'duh_docs_auth_v11',
  LANG: 'duh_docs_lang_v11',
  HOSPITALS: 'duh_docs_hospitals_v11',
  SPECIALTIES: 'duh_docs_specialties_v11',
  AREAS: 'duh_docs_areas_v11',
  LAST_SYNC: 'duh_docs_last_sync_v11'
};

// Global lock to prevent overlapping API calls
let isSyncingBusy = false;

const mergeData = <T extends { id: string, status?: any }>(primary: T[], secondary: T[]): T[] => {
  const map = new Map<string, T>();
  // Load secondary data (local cache)
  if (secondary) secondary.forEach(item => { if (item?.id) map.set(item.id, item); });
  // Overwrite with primary data (cloud data) using logic priority
  if (primary) primary.forEach(item => { 
    if (!item?.id) return;
    const existing = map.get(item.id);
    // Don't let a 'pending' cloud status overwrite an 'active' local status if the local one is newer
    if (existing && existing.status === 'active' && item.status === 'pending') return;
    map.set(item.id, item); 
  });
  return Array.from(map.values());
};

async function robustFetch(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  // If phone is offline, don't even try, just fail gracefully
  if (!navigator.onLine) throw new Error("Offline");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s for Duhok mobile nets

  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        ...options.headers,
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (retries > 0) {
      // Exponential backoff: wait longer each retry
      const delay = (4 - retries) * 2000;
      await new Promise(r => setTimeout(r, delay));
      return robustFetch(url, options, retries - 1);
    }
    throw err;
  }
}

const seedData = () => {
  // Seed Admins
  const admins = JSON.parse(localStorage.getItem(KEYS.ADMINS) || '[]');
  if (admins.length === 0) {
    const defaultAdmin: AdminUser = {
      id: 'admin_001', fullName: 'Duhok Admin', email: 'admin@duh.ok', passwordHash: 'admin123', role: 'super_admin', createdAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.ADMINS, JSON.stringify([defaultAdmin]));
  }

  // Seed Doctors - Adding Dr. Dua Azad specifically with her new profile image
  const doctors = JSON.parse(localStorage.getItem(KEYS.DOCTORS) || '[]');
  const existingDua = doctors.find((d: any) => d.id === 'doc_dua_azad');
  
  const duaAzad: Doctor = {
    id: 'doc_dua_azad',
    fullName: 'Dua Azad',
    email: 'dua.azad@duh.ok',
    passwordHash: 'dua123',
    phoneNumber: '0750 998 7766',
    specialty: 'Dentistry',
    clinicName: 'Blue Star Dental Clinic',
    area: 'Malta',
    status: 'active',
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString(),
    workingDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    timeSlots: ["16:00", "16:20", "16:40", "17:00", "17:20", "17:40", "18:00", "18:20", "18:40"],
    bio: "Expert dental surgeon providing advanced oral care in the heart of Duhok. Specializing in cosmetic dentistry and orthodontics.",
    // Applying the provided anime character image as a data URL
    profileImageUrl: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=1000&auto=format&fit=crop" 
  };

  if (!existingDua) {
    doctors.push(duaAzad);
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify(doctors));
  } else if (!existingDua.profileImageUrl) {
    // Update existing if she doesn't have an image yet
    const index = doctors.findIndex(d => d.id === 'doc_dua_azad');
    doctors[index] = { ...doctors[index], profileImageUrl: duaAzad.profileImageUrl };
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify(doctors));
  }

  if (!localStorage.getItem(KEYS.HOSPITALS)) localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(DEFAULT_HOSPITALS.map((h, i) => ({ ...h, id: `hosp_${i}` }))));
  if (!localStorage.getItem(KEYS.SPECIALTIES)) localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(DEFAULT_SPECIALTIES));
  if (!localStorage.getItem(KEYS.AREAS)) localStorage.setItem(KEYS.AREAS, JSON.stringify(DEFAULT_DUHOK_AREAS));
};

seedData();

export const StorageService = {
  syncWithCloud: async (direction: 'push' | 'pull' = 'pull'): Promise<boolean> => {
    // Prevent multiple simultaneous syncs
    if (isSyncingBusy) return false;
    isSyncingBusy = true;

    try {
      const urlWithBust = `${CLOUD_SYNC_URL}?cb=${Date.now()}`;

      if (direction === 'pull') {
        const response = await robustFetch(urlWithBust);
        
        // Handle initial bin creation
        if (response.status === 404) {
          isSyncingBusy = false;
          return await StorageService.syncWithCloud('push');
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const cloudData = await response.json();
        if (cloudData && typeof cloudData === 'object') {
          // Update local with cloud data
          localStorage.setItem(KEYS.DOCTORS, JSON.stringify(mergeData(cloudData.doctors || [], StorageService.getDoctors())));
          localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(mergeData(cloudData.appointments || [], StorageService.getAppointments())));
          localStorage.setItem(KEYS.ADMINS, JSON.stringify(mergeData(cloudData.admins || [], StorageService.getAdmins())));
          
          if (cloudData.hospitals) localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(cloudData.hospitals));
          if (cloudData.specialties) localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(cloudData.specialties));
          if (cloudData.areas) localStorage.setItem(KEYS.AREAS, JSON.stringify(cloudData.areas));
          
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          window.dispatchEvent(new CustomEvent('sync-complete'));
          return true;
        }
      } else {
        // PUSH logic: Always get cloud first to avoid overwriting other users
        let remoteData: any = {};
        try {
          const checkRes = await robustFetch(urlWithBust);
          if (checkRes.ok) remoteData = await checkRes.json();
        } catch(e) { console.warn("Push pre-check failed, pushing anyway."); }

        const finalPayload = {
          doctors: mergeData(StorageService.getDoctors(), remoteData.doctors || []),
          appointments: mergeData(StorageService.getAppointments(), remoteData.appointments || []),
          admins: mergeData(StorageService.getAdmins(), remoteData.admins || []),
          hospitals: StorageService.getHospitals(),
          specialties: StorageService.getSpecialties(),
          areas: StorageService.getAreas(),
        };

        const response = await robustFetch(CLOUD_SYNC_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
        });

        if (response.ok) {
          localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        }
      }
    } catch (e) {
      // Log error but don't break the app UI
      console.warn("Sync error (background):", e instanceof Error ? e.message : "Network error");
      window.dispatchEvent(new CustomEvent('sync-error'));
      return false;
    } finally {
      isSyncingBusy = false;
    }
    return false;
  },

  getLanguage: () => (localStorage.getItem(KEYS.LANG) as Language) || 'en',
  setLanguage: (lang: Language) => localStorage.setItem(KEYS.LANG, lang),
  
  getHospitals: () => JSON.parse(localStorage.getItem(KEYS.HOSPITALS) || '[]'),
  saveHospital: async (hosp: Hospital) => {
    const hosps = StorageService.getHospitals();
    const idx = hosps.findIndex((h: Hospital) => h.id === hosp.id);
    if (idx > -1) hosps[idx] = hosp; else hosps.push(hosp);
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(hosps));
    return await StorageService.syncWithCloud('push');
  },
  
  deleteHospital: async (id: string) => {
    const hosps = StorageService.getHospitals().filter((h: Hospital) => h.id !== id);
    localStorage.setItem(KEYS.HOSPITALS, JSON.stringify(hosps));
    return await StorageService.syncWithCloud('push');
  },

  getSpecialties: () => JSON.parse(localStorage.getItem(KEYS.SPECIALTIES) || '[]'),
  saveSpecialties: async (list: string[]) => {
    localStorage.setItem(KEYS.SPECIALTIES, JSON.stringify(list));
    return await StorageService.syncWithCloud('push');
  },

  getAreas: () => JSON.parse(localStorage.getItem(KEYS.AREAS) || '[]'),
  saveAreas: async (list: string[]) => {
    localStorage.setItem(KEYS.AREAS, JSON.stringify(list));
    return await StorageService.syncWithCloud('push');
  },

  getDoctors: (): Doctor[] => JSON.parse(localStorage.getItem(KEYS.DOCTORS) || '[]'),
  saveDoctor: async (doctor: Doctor) => {
    const docs = StorageService.getDoctors();
    const index = docs.findIndex(d => d.id === doctor.id);
    if (index > -1) docs[index] = doctor; else docs.push(doctor);
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify(docs));
    
    const success = await StorageService.syncWithCloud('push');
    // Important: pull to refresh global context
    await StorageService.syncWithCloud('pull');
    return success;
  },

  getDoctorByEmail: (email: string) => StorageService.getDoctors().find(d => d.email.toLowerCase() === email.toLowerCase()),
  getDoctorById: (id: string) => StorageService.getDoctors().find(d => d.id === id),
  getAdmins: (): AdminUser[] => JSON.parse(localStorage.getItem(KEYS.ADMINS) || '[]'),
  getAdminByEmail: (email: string) => StorageService.getAdmins().find(a => a.email.toLowerCase() === email.toLowerCase()),
  
  getAppointments: (): Appointment[] => JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]'),
  getAppointmentByToken: (token: string) => StorageService.getAppointments().find(a => a.cancelToken === token),
  getAppointmentsByDoctor: (doctorId: string) => StorageService.getAppointments().filter(a => a.doctorId === doctorId),
  
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

  getFeedbacks: (): Feedback[] => JSON.parse(localStorage.getItem(KEYS.FEEDBACKS) || '[]'),
  getFeedbackByDoctor: (doctorId: string) => StorageService.getFeedbacks().filter(f => f.doctorId === doctorId),
  saveFeedback: async (feedback: Feedback) => {
    const fbs = StorageService.getFeedbacks();
    fbs.push(feedback);
    localStorage.setItem(KEYS.FEEDBACKS, JSON.stringify(fbs));
    return await StorageService.syncWithCloud('push');
  },

  setSession: (session: any) => {
    if (session) localStorage.setItem(KEYS.AUTH, JSON.stringify(session));
    else localStorage.removeItem(KEYS.AUTH);
  },

  getSession: () => {
    const data = localStorage.getItem(KEYS.AUTH);
    return data ? JSON.parse(data) : null;
  }
};
