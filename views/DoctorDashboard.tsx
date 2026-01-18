
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Appointment, Feedback, Doctor } from '../types';

const DoctorDashboard: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');

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

  // Final check for suspended status if they were already logged in
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dr. {doctorProfile.fullName}</h2>
          <p className="text-sm text-gray-500">{doctorProfile.specialty} at {doctorProfile.clinicName}</p>
        </div>
        <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Active Portal
        </span>
      </div>

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
                          {app.status === 'cancelled' && app.cancelledAt && (
                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">
                              At: {new Date(app.cancelledAt).toLocaleString()}
                            </p>
                          )}
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
            <h3 className="font-bold text-lg mb-5 flex items-center">
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
    </div>
  );
};

export default DoctorDashboard;
