
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Appointment } from '../types';
import { translations } from '../translations';

const CancelAppointment: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const lang = StorageService.getLanguage();
  const t = translations[lang];

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [phoneVerify, setPhoneVerify] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      const app = StorageService.getAppointmentByToken(token);
      if (app) setAppointment(app);
      else setError('Invalid link.');
    }
    setLoading(false);
  }, [token]);

  const handleConfirmCancel = () => {
    if (!appointment) return;
    const last4 = appointment.patientPhone.slice(-4);
    if (phoneVerify !== last4) {
      setError('Verification failed.');
      return;
    }
    StorageService.updateAppointment({ ...appointment, status: 'cancelled' });
    setSuccess(true);
  };

  if (loading) return <div className="p-20 text-center">...</div>;

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl text-center border mt-10">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-calendar-xmark text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">{t.visitCancelled}</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">{t.cancelSub}</p>
        <button onClick={() => navigate('/')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">{t.done}</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.cancelConfirm}</h2>
      <div className="bg-gray-50 p-6 rounded-2xl mb-8 space-y-3 border">
        <p className="text-sm">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.doctor}</span>
          <span className="font-bold text-gray-800">Dr. {appointment?.doctorName}</span>
        </p>
      </div>
      <div className="space-y-4">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t.last4}</label>
        <input type="text" className="w-full border-gray-200 rounded-xl p-4 text-center text-lg font-bold" maxLength={4} value={phoneVerify} onChange={(e) => setPhoneVerify(e.target.value.replace(/\D/g, ''))} />
        <button onClick={handleConfirmCancel} disabled={phoneVerify.length < 4} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl">{t.cancelConfirm}</button>
        <button onClick={() => navigate('/')} className="w-full text-gray-400 text-xs font-bold uppercase py-2">{t.keepApp}</button>
      </div>
    </div>
  );
};

export default CancelAppointment;
