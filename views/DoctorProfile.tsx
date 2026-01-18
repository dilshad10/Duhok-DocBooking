
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage.ts';
import { MessagingService } from '../services/MessagingService.ts';
import { Doctor, Appointment } from '../types.ts';
import { DAYS_OF_WEEK } from '../constants.ts';
import { translations } from '../translations.ts';

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lang = StorageService.getLanguage();
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState({ name: '', phone: '', date: '', time: '' });
  const [isBooking, setIsBooking] = useState(false);
  const [success, setSuccess] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  const session = StorageService.getSession();
  const isOwner = session?.role === 'doctor' && session?.id === id;

  useEffect(() => {
    if (id) {
      const doc = StorageService.getDoctorById(id);
      if (doc && doc.status === 'active') setDoctor(doc);
    }
    setLoading(false);
  }, [id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doctor) return;

    if (file.size > 1024 * 1024) {
      alert("Image too large (>1MB)");
      return;
    }

    setIsUpdatingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updatedDoc = { ...doctor, profileImageUrl: base64String };
      StorageService.saveDoctor(updatedDoc);
      setDoctor(updatedDoc);
      setIsUpdatingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

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
          dayName: dayName.substring(0, 3).toUpperCase(),
          dayNum: d.getDate(),
          month: d.toLocaleString(lang, { month: 'short' })
        });
      }
    }
    return days;
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || isBooking) return;
    
    if (!bookingData.date || !bookingData.time) {
      setError('Select date/time');
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      const cancelToken = `can_${Math.random().toString(36).substr(2, 9)}`;
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
      const waLink = MessagingService.getWhatsAppConfirmationLink(newApp);
      setSuccess(newApp);

      setTimeout(() => {
        window.location.href = waLink;
      }, 1200);

    } catch (err) {
      setError('System error.');
      setIsBooking(false);
    }
  };

  const getAvailableSlots = (dateStr: string) => {
    if (!doctor || !dateStr) return [];
    const apps = StorageService.getAppointments().filter(a => a.doctorId === doctor.id && a.appointmentDate === dateStr && a.status !== 'cancelled');
    return doctor.timeSlots.filter(slot => !apps.some(a => a.appointmentTime === slot));
  };

  const availableDays = getNextAvailableDays();

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!doctor) return <div className="p-20 text-center">Not found.</div>;

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4">
        <div className="bg-white rounded-[40px] shadow-2xl border-2 border-gray-100 overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-blue-600 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-receipt text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black">{t.receiptTitle}</h2>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">{t.digitalRecipe}</p>
          </div>

          <div className="p-8 space-y-6">
             <div className="border-b border-dashed pb-6 space-y-2">
               <p className="text-center font-black text-gray-900 text-xl">Dr. {success.doctorName}</p>
               <p className="text-center text-gray-500 font-bold text-sm">{success.clinicName}</p>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold uppercase tracking-tighter">{t.patient}</span>
                   <span className="font-black text-gray-800">{success.patientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold uppercase tracking-tighter">{t.date}</span>
                   <span className="font-black text-gray-800">{success.appointmentDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold uppercase tracking-tighter">{t.time}</span>
                   <span className="font-black text-blue-600">{success.appointmentTime}</span>
                </div>
             </div>

             <div className="pt-6 border-t border-dashed">
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-bold text-center mb-6">
                   <i className="fa-brands fa-whatsapp mr-2"></i>
                   {t.openingWA}
                </div>
                <button 
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  {t.done}
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm self-start">
           <div className="flex items-center gap-6 mb-8">
             <div className="relative group">
               {doctor.profileImageUrl ? (
                 <img src={doctor.profileImageUrl} alt="" className="w-24 h-24 rounded-[32px] object-cover shadow-2xl border-4 border-white" />
               ) : (
                 <div className="w-24 h-24 bg-blue-600 text-white rounded-[32px] flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-white">
                   {doctor.fullName.charAt(0)}
                 </div>
               )}
               {isOwner && (
                 <>
                   <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                   <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                     {isUpdatingPhoto ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-camera"></i>}
                   </button>
                 </>
               )}
             </div>
             <div>
               <h1 className="text-3xl font-black text-gray-900">Dr. {doctor.fullName}</h1>
               <p className="text-blue-600 font-bold">{doctor.specialty}</p>
             </div>
           </div>
           <p className="text-gray-600 leading-relaxed italic">"{doctor.bio || 'Professional medical specialist in Duhok.'}"</p>
           
           <div className="mt-8 pt-8 border-t">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">{t.clinicLoc}</p>
              <p className="font-bold text-gray-800 flex items-center gap-2">
                <i className="fa-solid fa-location-dot text-blue-500"></i>
                {doctor.clinicName}
              </p>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl font-black mb-8 relative z-10">{t.bookApp}</h2>
          <form onSubmit={handleBook} className="space-y-6 relative z-10">
            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border">{error}</p>}
            
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t.fullName}</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-blue-100"
                value={bookingData.name}
                onChange={e => setBookingData({...bookingData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t.whatsappNum}</label>
              <input 
                type="tel" 
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-blue-100"
                value={bookingData.phone}
                onChange={e => setBookingData({...bookingData, phone: e.target.value})}
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t.selectDate}</label>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {availableDays.map(day => (
                  <button
                    key={day.fullDate}
                    type="button"
                    onClick={() => setBookingData({...bookingData, date: day.fullDate, time: ''})}
                    className={`flex-shrink-0 w-20 p-4 rounded-2xl border transition-all text-center ${
                      bookingData.date === day.fullDate 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-blue-400'
                    }`}
                  >
                    <p className="text-[10px] font-black">{day.dayName}</p>
                    <p className="text-xl font-black">{day.dayNum}</p>
                    <p className="text-[10px] font-bold">{day.month}</p>
                  </button>
                ))}
              </div>
            </div>

            {bookingData.date && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t.selectTime}</label>
                <div className="grid grid-cols-3 gap-3">
                  {getAvailableSlots(bookingData.date).length > 0 ? (
                    getAvailableSlots(bookingData.date).map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingData({...bookingData, time: slot})}
                        className={`py-3 px-4 rounded-xl border text-sm font-black transition-all shadow-sm ${
                          bookingData.time === slot ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' : 'bg-white border-gray-100 text-gray-800'
                        }`}
                      >
                        {slot}
                      </button>
                    ))
                  ) : (
                    <p className="col-span-3 text-xs text-orange-500 font-bold p-3 bg-orange-50 rounded-xl text-center">N/A</p>
                  )}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isBooking || !bookingData.time || !bookingData.date || !bookingData.name || !bookingData.phone}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-[24px] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 mt-4"
            >
              {isBooking ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-calendar-check"></i>}
              {t.confirmBtn}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
