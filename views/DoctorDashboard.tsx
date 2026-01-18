
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Appointment, Feedback, Doctor } from '../types';
import { translations } from '../translations';

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const lang = StorageService.getLanguage();
  const t = translations[lang];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'profile'>('appointments');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const s = StorageService.getSession();
    if (s && s.role === 'doctor') {
      setSession(s);
      const profile = StorageService.getDoctorById(s.id);
      if (profile) {
        setDoctorProfile(profile);
        loadData(s.id);
      }
    }
  }, []);

  const loadData = (docId: string) => {
    const apps = StorageService.getAppointmentsByDoctor(docId);
    const fbs = StorageService.getFeedbackByDoctor(docId);
    setAppointments(apps.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()));
    setFeedbacks(fbs);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doctorProfile) return;

    if (file.size > 1024 * 1024) {
      alert("Image is too large (<1MB)");
      return;
    }

    setIsUpdating(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updated = { ...doctorProfile, profileImageUrl: base64String };
      StorageService.saveDoctor(updated);
      setDoctorProfile(updated);
      setIsUpdating(false);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doctorProfile) return;
    StorageService.saveDoctor(doctorProfile);
    alert("Profile updated!");
  };

  const handleStatus = (appId: string, status: 'completed' | 'cancelled') => {
    const apps = StorageService.getAppointments();
    const app = apps.find(a => a.id === appId);
    if (app) {
      app.status = status;
      StorageService.updateAppointment(app);
      if (session) loadData(session.id);
    }
  };

  if (!session || !doctorProfile) return <div className="p-20 text-center">Loading...</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredApps = appointments.filter(a => {
    if (filter === 'today') return a.appointmentDate === todayStr;
    if (filter === 'upcoming') return new Date(a.appointmentDate) >= new Date(todayStr) && a.status === 'booked';
    return true;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'booked').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {doctorProfile.profileImageUrl ? (
              <img src={doctorProfile.profileImageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
            ) : (
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg border-2 border-white">{doctorProfile.fullName.charAt(0)}</div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dr. {doctorProfile.fullName}</h2>
            <p className="text-sm text-gray-500">{doctorProfile.specialty}</p>
          </div>
        </div>
        <nav className="flex bg-gray-100 p-1 rounded-xl rtl:space-x-reverse">
           <button onClick={() => setActiveTab('appointments')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'appointments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{t.bookApp}</button>
           <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>{t.profileSettings}</button>
        </nav>
      </div>

      {activeTab === 'appointments' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-calendar-check"></i></div>
              <div><p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.total}</p><p className="text-2xl font-bold">{stats.total}</p></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-clock"></i></div>
              <div><p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.upcoming}</p><p className="text-2xl font-bold text-orange-600">{stats.pending}</p></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-circle-check"></i></div>
              <div><p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.done}</p><p className="text-2xl font-bold text-green-600">{stats.completed}</p></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl shrink-0"><i className="fa-solid fa-calendar-xmark"></i></div>
              <div><p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.cancelled}</p><p className="text-2xl font-bold text-red-600">{stats.cancelled}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg">{t.globalList}</h3>
            </div>
            <div className="divide-y overflow-x-auto">
              {filteredApps.length > 0 ? filteredApps.map(app => (
                <div key={app.id} className="px-6 py-5 flex items-center justify-between min-w-[500px]">
                  <div className="flex items-center space-x-6 rtl:space-x-reverse">
                    <div className="text-center bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 min-w-[85px]">
                      <p className="text-sm font-bold text-blue-700">{app.appointmentTime}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{app.patientName}</p>
                      <p className="text-xs font-medium text-gray-500"><i className={`fa-solid fa-phone ${lang === 'en' ? 'mr-2' : 'ml-2'} text-blue-400`}></i> {app.patientPhone}</p>
                    </div>
                  </div>
                  {app.status === 'booked' && (
                    <button onClick={() => handleStatus(app.id, 'completed')} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold">{t.markDone}</button>
                  )}
                </div>
              )) : (
                <div className="py-24 text-center text-gray-400 font-bold">{t.noDocs}</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border p-10">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
             <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t.fullName}</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none" value={doctorProfile.fullName} onChange={e => setDoctorProfile({ ...doctorProfile, fullName: e.target.value })} />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t.clinicBranch}</label>
                  <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none" value={doctorProfile.clinicName} onChange={e => setDoctorProfile({ ...doctorProfile, clinicName: e.target.value })} />
               </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t.bio}</label>
                <textarea className="w-full bg-gray-50 border-none rounded-2xl p-4 font-medium outline-none h-32" value={doctorProfile.bio || ''} onChange={e => setDoctorProfile({ ...doctorProfile, bio: e.target.value })} />
             </div>
             <button type="submit" className="bg-blue-600 text-white font-black px-10 py-4 rounded-2xl">{t.saveChanges}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
