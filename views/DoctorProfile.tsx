
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { MessagingService } from '../services/MessagingService';
import { Doctor, Appointment } from '../types';
import { DAYS_OF_WEEK } from '../constants';

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState({ name: '', phone: '', date: '', time: '' });
  const [success, setSuccess] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const doc = StorageService.getDoctorById(id);
      if (doc && doc.status === 'active') {
        setDoctor(doc);
      }
    }
    setLoading(false);
  }, [id]);

  const getNextAvailableDays = () => {
    if (!doctor) return [];
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = DAYS_OF_WEEK[d.getDay()];
      if (doctor.workingDays.includes(dayName)) {
        days.push({
          fullDate: d.toISOString().split('T')[0],
          dayName: dayName.substring(0, 3),
          dayNum: d.getDate(),
          month: d.toLocaleString('en-US', { month: 'short' })
        });
      }
    }
    return days;
  };

  const getAvailableSlots = (dateStr: string) => {
    if (!doctor || !dateStr) return [];
    const existingApps = StorageService.getAppointments().filter(a => 
      a.doctorId === doctor.id && a.appointmentDate === dateStr && a.status !== 'cancelled'
    );
    return doctor.timeSlots.filter(slot => !existingApps.some(a => a.appointmentTime === slot));
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;
    if (!bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.time) {
      setError('Please select a date, time, and enter your details.');
      return;
    }
    const cancelToken = `can_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
    const newApp: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      clinicName: doctor.clinicName,
      patientName: bookingData.name,
      patientPhone: bookingData.phone,
      appointmentDate: bookingData.date,
      appointmentTime: bookingData.time,
      status: 'booked',
      createdAt: new Date().toISOString(),
      cancelToken
    };
    StorageService.saveAppointment(newApp);
    MessagingService.triggerAutomaticRedirect(newApp);
    setSuccess(newApp);
  };

  const availableSlots = getAvailableSlots(bookingData.date);
  const nextAvailableDays = getNextAvailableDays();

  if (loading) return <div className="p-20 text-center text-gray-400">Loading profile...</div>;
  if (!doctor) return <div className="p-20 text-center text-red-500 font-bold">Doctor profile not found or unavailable.</div>;

  if (success) {
    const waLink = MessagingService.getWhatsAppConfirmationLink(success);
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-[40px] shadow-2xl text-center border mt-10">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
           <i className="fa-solid fa-paper-plane text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Booking Initialized</h2>
        <p className="text-gray-500 mb-6">Your WhatsApp confirmation has been prepared. Please hit 'Send' in WhatsApp to notify the clinic.</p>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl mb-4 shadow-lg flex items-center justify-center gap-2">
           <i className="fa-brands fa-whatsapp text-xl"></i> Re-send Message
        </a>
        <button onClick={() => navigate('/')} className="text-blue-600 font-bold">Return to Search</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-blue-600 font-bold transition-colors">
        <i className="fa-solid fa-arrow-left mr-2"></i> Back to Search
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-8">
          <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="w-24 h-24 bg-blue-600 text-white rounded-[32px] flex items-center justify-center font-bold text-4xl shadow-2xl shadow-blue-100">
                {doctor.fullName.charAt(0)}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Dr. {doctor.fullName}</h1>
                <p className="text-blue-600 font-black text-xl mb-1 uppercase tracking-wider">{doctor.specialty}</p>
                <p className="text-gray-500 font-bold flex items-center justify-center md:justify-start gap-2">
                  <i className="fa-solid fa-location-dot text-blue-400"></i>
                  {doctor.clinicName}
                </p>
              </div>
            </div>
            
            <div className="relative z-10 border-t pt-8">
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-[0.2em] mb-4">About Doctor</h3>
              <p className="text-gray-600 leading-relaxed font-medium text-lg">
                {doctor.bio || `Specialist ${doctor.specialty} providing comprehensive care at ${doctor.clinicName} in Duhok.`}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-2xl sticky top-8">
            <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Book Visit</h3>
            
            <form onSubmit={handleBook} className="space-y-6">
              {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select Date</label>
                <div className="grid grid-cols-3 gap-3">
                  {nextAvailableDays.map(day => (
                    <button
                      key={day.fullDate}
                      type="button"
                      onClick={() => setBookingData({ ...bookingData, date: day.fullDate, time: '' })}
                      className={`p-3 rounded-2xl border transition-all text-center ${
                        bookingData.date === day.fullDate 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                          : 'bg-white border-gray-100 text-gray-500 hover:border-blue-400'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase">{day.dayName}</p>
                      <p className="text-lg font-black">{day.dayNum}</p>
                    </button>
                  ))}
                </div>
              </div>

              {bookingData.date && (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Select Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.length > 0 ? availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingData({ ...bookingData, time: slot })}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          bookingData.time === slot 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-blue-400'
                        }`}
                      >
                        {slot}
                      </button>
                    )) : <p className="col-span-3 text-xs text-orange-500 font-bold">No slots available for this date.</p>}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <input 
                  type="text" 
                  placeholder="Patient Full Name"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none"
                  value={bookingData.name}
                  onChange={e => setBookingData({ ...bookingData, name: e.target.value })}
                  required
                />
                <input 
                  type="tel" 
                  placeholder="WhatsApp Number (0750...)"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none"
                  value={bookingData.phone}
                  onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={!bookingData.time}
                className="w-full bg-gray-900 text-white font-black py-5 rounded-[24px] hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-30"
              >
                Confirm Visit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
