
import React, { useState, useEffect, useRef } from 'react';
// Import useNavigate from react-router-dom to handle navigation
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Appointment, Feedback, Doctor } from '../types';

const DoctorDashboard: React.FC = () => {
  // Initialize navigate function
  const navigate = useNavigate();
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
      alert("Image is too large. Please select a photo smaller than 1MB.");
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
    alert("Profile updated successfully!");
  };

  const handleStatus = (appId: string, status: 'completed' | 'cancelled') => {
    const apps = StorageService.getAppointments();
    const app = apps.find(a => a.id === appId);
    if (app) {
      app.status = status;
      if (status === 'cancelled') {
        app.cancelledAt = new Date().toISOString();
      }
      StorageService.updateAppointment(app);
      if (session) loadData(session.id);
    }
  };

  if (!session || !doctorProfile) return <div className="p-20 text-center">Loading dashboard...</div>;

  if (doctorProfile.status !== 'active') {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl text-center border border-red-50 mt-10">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-lock text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
        <p className="text-gray-600 mb-8 leading-relaxed italic">"Your portal access is currently {doctorProfile.status}. Please contact the Duhok administration team for clarification."</p>
        <button 
          onClick={() => { StorageService.setSession(null); window.location.reload(); }}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg"
        >Back to Login</button>
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {doctorProfile.profileImageUrl ? (
              <img 
                src={doctorProfile.profileImageUrl} 
                alt={doctorProfile.fullName} 
                className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg border-2 border-white">
                {doctorProfile.fullName.charAt(0)}
              </div>
            )}
            <button 
              onClick={() => setActiveTab('profile')}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity"
            >
              <i className="fa-solid fa-pen"></i>
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dr. {doctorProfile.fullName}</h2>
            <p className="text-sm text-gray-500">{doctorProfile.specialty} at {doctorProfile.clinicName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('appointments')}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'appointments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Appointments
             </button>
             <button 
               onClick={() => setActiveTab('profile')}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Profile Settings
             </button>
          </nav>
          <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Active
          </span>
        </div>
      </div>

      {activeTab === 'appointments' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-clock"></i>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Upcoming</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Done</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-calendar-xmark"></i>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                  <h3 className="font-bold text-lg">Global Patient List</h3>
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border">
                    <button 
                      onClick={() => setFilter('all')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                    >All</button>
                    <button 
                      onClick={() => setFilter('today')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'today' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                    >Today</button>
                    <button 
                      onClick={() => setFilter('upcoming')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${filter === 'upcoming' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
                    >Upcoming</button>
                  </div>
                </div>

                <div className="divide-y overflow-x-auto">
                  {filteredApps.length > 0 ? (
                    filteredApps.map(app => (
                      <div key={app.id} className="px-6 py-5 hover:bg-gray-50 transition-colors flex items-center justify-between min-w-[500px]">
                        <div className="flex items-center space-x-6">
                          <div className="text-center bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 min-w-[85px]">
                            <p className="text-[10px] uppercase font-bold text-blue-400">{app.appointmentDate.split('-')[1]}/{app.appointmentDate.split('-')[2]}</p>
                            <p className="text-sm font-bold text-blue-700">{app.appointmentTime}</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{app.patientName}</p>
                            <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
                              <i className="fa-solid fa-phone text-blue-400"></i> {app.patientPhone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {app.status === 'booked' ? (
                            <>
                              <button 
                                onClick={() => handleStatus(app.id, 'completed')}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-sm"
                              >Mark Done</button>
                              <button 
                                onClick={() => handleStatus(app.id, 'cancelled')}
                                className="text-gray-400 hover:text-red-500 p-2"
                                title="Cancel Appointment"
                              ><i className="fa-solid fa-calendar-xmark"></i></button>
                            </>
                          ) : (
                            <div className="text-right">
                              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                                app.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center text-gray-400">
                      <i className="fa-solid fa-folder-open text-4xl mb-4 opacity-10"></i>
                      <p className="text-sm">No medical appointments found for this period.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:w-1/3 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="font-bold text-lg mb-5 flex items-center text-gray-800">
                  <i className="fa-solid fa-comments text-blue-600 mr-2"></i>
                  Private Feedback
                </h3>
                <div className="space-y-4">
                  {feedbacks.length > 0 ? (
                    feedbacks.map(fb => (
                      <div key={fb.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${fb.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {fb.success ? 'Success' : 'Follow-up Req'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium uppercase">{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{fb.comment}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-30">
                      <i className="fa-solid fa-message text-3xl mb-3"></i>
                      <p className="text-xs font-bold uppercase tracking-widest">No Feedback</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border p-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-12">
            <div className="w-1/3 space-y-6">
               <div className="relative group mx-auto w-48 h-48">
                 <div className={`w-full h-full rounded-[48px] overflow-hidden border-4 border-gray-50 shadow-2xl relative ${isUpdating ? 'opacity-50' : ''}`}>
                    {doctorProfile.profileImageUrl ? (
                      <img 
                        src={doctorProfile.profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-600 flex items-center justify-center text-6xl text-white font-black">
                        {doctorProfile.fullName.charAt(0)}
                      </div>
                    )}
                 </div>
                 <input 
                   type="file" 
                   className="hidden" 
                   ref={fileInputRef} 
                   accept="image/*" 
                   onChange={handleImageUpload} 
                 />
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="absolute bottom-4 right-4 bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl hover:bg-blue-700 transition active:scale-95"
                 >
                   {isUpdating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-camera"></i>}
                 </button>
               </div>
               <div className="text-center">
                 <p className="text-sm font-bold text-gray-900">Dr. {doctorProfile.fullName}</p>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{doctorProfile.specialty}</p>
               </div>
               <button 
                 onClick={() => navigate(`/doctor/${doctorProfile.id}`)}
                 className="w-full bg-gray-50 text-gray-600 font-bold py-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition text-sm"
               >
                 View Public Profile
               </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="flex-grow space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-blue-100"
                      value={doctorProfile.fullName}
                      onChange={e => setDoctorProfile({ ...doctorProfile, fullName: e.target.value })}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Clinic Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-blue-100"
                      value={doctorProfile.clinicName}
                      onChange={e => setDoctorProfile({ ...doctorProfile, clinicName: e.target.value })}
                    />
                 </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Biography / About You</label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-medium outline-none focus:ring-4 focus:ring-blue-100 h-32 leading-relaxed"
                    value={doctorProfile.bio || ''}
                    placeholder="Tell patients about your background, years of experience, and services..."
                    onChange={e => setDoctorProfile({ ...doctorProfile, bio: e.target.value })}
                  />
               </div>

               <div className="pt-4 border-t flex justify-end">
                  <button 
                    type="submit"
                    className="bg-blue-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
                  >
                    Save Changes
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
