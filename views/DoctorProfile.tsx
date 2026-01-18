
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage.ts';
import { MessagingService } from '../services/MessagingService.ts';
import { Doctor, Appointment } from '../types.ts';

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [bookingData, setBookingData] = useState({ name: '', phone: '', date: '', time: '' });
  const [isBooking, setIsBooking] = useState(false);
  const [success, setSuccess] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const doc = StorageService.getDoctorById(id);
      if (doc && doc.status === 'active') setDoctor(doc);
    }
    setLoading(false);
  }, [id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || isBooking) return;
    
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

      // 1. Save locally
      StorageService.saveAppointment(newApp);
      
      // 2. Generate the WhatsApp "Recipe" link
      const waLink = MessagingService.getWhatsAppConfirmationLink(newApp);
      
      // 3. Show the success UI
      setSuccess(newApp);

      // 4. AUTOMATIC STEP: Redirect to WhatsApp after 1 second
      // This gives the user time to see the "Success" screen before the app switches
      setTimeout(() => {
        window.location.href = waLink;
      }, 1200);

    } catch (err) {
      setError('System error. Try again.');
      setIsBooking(false);
    }
  };

  const getAvailableSlots = (dateStr: string) => {
    if (!doctor || !dateStr) return [];
    const apps = StorageService.getAppointments().filter(a => a.doctorId === doctor.id && a.appointmentDate === dateStr && a.status !== 'cancelled');
    return doctor.timeSlots.filter(slot => !apps.some(a => a.appointmentTime === slot));
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!doctor) return <div className="p-20 text-center">Doctor not found.</div>;

  // SUCCESS SCREEN (THE "RECIPE" VIEW)
  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4">
        <div className="bg-white rounded-[40px] shadow-2xl border-2 border-gray-100 overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-blue-600 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-receipt text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black">وەسلا وەرگرتنێ</h2>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Digital Recipe Generated</p>
          </div>

          <div className="p-8 space-y-6">
             <div className="border-b border-dashed pb-6 space-y-2">
               <p className="text-center font-black text-gray-900 text-xl">Dr. {success.doctorName}</p>
               <p className="text-center text-gray-500 font-bold text-sm">{success.clinicName}</p>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold uppercase tracking-tighter">Patient</span>
                   <span className="font-black text-gray-800">{success.patientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold uppercase tracking-tighter">Date</span>
                   <span className="font-black text-gray-800">{success.appointmentDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400 font-bold uppercase tracking-tighter">Time</span>
                   <span className="font-black text-blue-600">{success.appointmentTime}</span>
                </div>
             </div>

             <div className="pt-6 border-t border-dashed">
                <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-bold text-center mb-6">
                   <i className="fa-brands fa-whatsapp mr-2"></i>
                   Opening WhatsApp to send your recipe...
                </div>
                <button 
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  Done / تەمام
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
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
           <div className="flex items-center gap-6 mb-8">
             <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-black">{doctor.fullName.charAt(0)}</div>
             <div>
               <h1 className="text-3xl font-black text-gray-900">Dr. {doctor.fullName}</h1>
               <p className="text-blue-600 font-bold">{doctor.specialty}</p>
             </div>
           </div>
           <p className="text-gray-600 leading-relaxed italic">"{doctor.bio || 'Professional medical specialist in Duhok.'}"</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-2xl">
          <h2 className="text-2xl font-black mb-8">Book Appointment</h2>
          <form onSubmit={handleBook} className="space-y-6">
            <input 
              type="text" 
              placeholder="Full Name"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-blue-100"
              value={bookingData.name}
              onChange={e => setBookingData({...bookingData, name: e.target.value})}
              required
            />
            <input 
              type="tel" 
              placeholder="WhatsApp Number (0750...)"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none focus:ring-4 focus:ring-blue-100"
              value={bookingData.phone}
              onChange={e => setBookingData({...bookingData, phone: e.target.value})}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="date" 
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none"
                value={bookingData.date}
                onChange={e => setBookingData({...bookingData, date: e.target.value, time: ''})}
                required
              />
              <select 
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold outline-none"
                value={bookingData.time}
                onChange={e => setBookingData({...bookingData, time: e.target.value})}
                required
              >
                <option value="">Select Time</option>
                {getAvailableSlots(bookingData.date).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isBooking || !bookingData.time}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              {isBooking ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-calendar-check"></i>}
              Confirm & Get Recipe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
