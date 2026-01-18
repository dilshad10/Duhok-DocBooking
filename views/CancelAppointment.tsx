
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Appointment } from '../types';

const CancelAppointment: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [phoneVerify, setPhoneVerify] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      const app = StorageService.getAppointmentByToken(token);
      if (app) {
        setAppointment(app);
      } else {
        setError('Invalid or expired cancellation link.');
      }
    }
    setLoading(false);
  }, [token]);

  const handleConfirmCancel = () => {
    if (!appointment) return;

    // Validation: Match last 4 digits of phone
    const last4 = appointment.patientPhone.slice(-4);
    if (phoneVerify !== last4) {
      setError('Phone verification failed. Please enter the last 4 digits of the phone number used for booking.');
      return;
    }

    // Validation: Cutoff time (2 hours)
    const now = new Date();
    const appDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    const diffMs = appDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2 && diffHours > 0) {
      setError('Appointments cannot be cancelled online less than 2 hours before the scheduled time. Please contact the clinic directly.');
      return;
    }

    if (appointment.status === 'cancelled') {
      setError('This appointment has already been cancelled.');
      return;
    }

    // Perform Cancellation
    const updatedApp: Appointment = {
      ...appointment,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };

    StorageService.updateAppointment(updatedApp);
    setSuccess(true);
    setError('');
  };

  if (loading) return <div className="p-20 text-center text-gray-400">Verifying link...</div>;

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl text-center border border-green-50 mt-10">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-calendar-xmark text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Visit Cancelled</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">Your appointment has been successfully removed from the schedule. The doctor has been notified.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl text-center border border-red-50 mt-10">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-circle-exclamation text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">{error || 'Something went wrong.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancel Appointment?</h2>
      <p className="text-gray-500 mb-8 text-sm">Please confirm your details to remove this slot from the doctor's schedule.</p>

      <div className="bg-gray-50 p-6 rounded-2xl mb-8 space-y-3 border">
        <p className="text-sm">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doctor</span>
          <span className="font-bold text-gray-800">Dr. {appointment.doctorName}</span>
        </p>
        <div className="flex gap-4">
          <p className="text-sm flex-1">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
            <span className="font-bold text-gray-800">{appointment.appointmentDate}</span>
          </p>
          <p className="text-sm flex-1">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</span>
            <span className="font-bold text-gray-800">{appointment.appointmentTime}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Verify Identity (Last 4 Digits of Phone)</label>
          <input 
            type="text" 
            placeholder="e.g. 5566"
            className="w-full border-gray-200 rounded-xl p-4 text-center text-lg font-bold focus:ring-2 focus:ring-red-500 outline-none transition-all"
            maxLength={4}
            value={phoneVerify}
            onChange={(e) => setPhoneVerify(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <button 
          onClick={handleConfirmCancel}
          disabled={phoneVerify.length < 4}
          className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-100 disabled:opacity-30"
        >
          Confirm Cancellation
        </button>
        <button 
          onClick={() => navigate('/')}
          className="w-full text-gray-400 text-xs font-bold uppercase tracking-widest py-2"
        >
          Keep Appointment
        </button>
      </div>
    </div>
  );
};

export default CancelAppointment;
