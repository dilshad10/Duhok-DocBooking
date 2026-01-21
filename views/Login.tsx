
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { translations } from '../translations';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error', text: string } | null>(null);
  const navigate = useNavigate();
  const lang = StorageService.getLanguage();
  const t = translations[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage(null);
    
    // 1. Admin authentication check
    const admin = StorageService.getAdminByEmail(email);
    if (admin && admin.passwordHash === password) {
      StorageService.setSession({ 
        role: 'admin', 
        id: admin.id, 
        name: admin.fullName,
        adminRole: admin.role 
      });
      navigate('/admin');
      window.location.reload();
      return;
    }

    // 2. Doctor authentication check
    const doctor = StorageService.getDoctorByEmail(email);
    if (doctor && doctor.passwordHash === password) {
      if (doctor.status === 'pending') {
        setStatusMessage({ 
          type: 'info', 
          text: t.regPendingMsg 
        });
        return;
      }
      if (doctor.status === 'rejected') {
        setStatusMessage({ 
          type: 'error', 
          text: 'Your registration application was rejected.' 
        });
        return;
      }
      if (doctor.status === 'suspended') {
        setStatusMessage({ 
          type: 'error', 
          text: 'This doctor account is currently suspended.' 
        });
        return;
      }
      
      StorageService.setSession({ 
        role: 'doctor', 
        id: doctor.id, 
        name: doctor.fullName 
      });
      navigate('/dashboard');
      window.location.reload();
    } else {
      setError('Invalid credentials.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border mt-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{t.loginPortal}</h2>
        <p className="text-gray-500 mt-2">{t.signinSub}</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">{error}</div>}
        
        {statusMessage && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-start space-x-3 rtl:space-x-reverse border ${statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            <i className={`fa-solid ${statusMessage.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'} mt-1`}></i>
            <p>{statusMessage.text}</p>
          </div>
        )}
        
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">{t.email}</label>
          <input 
            type="text" 
            className="w-full border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 border outline-none transition-all"
            placeholder="doctor@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">{t.password}</label>
          <input 
            type="password" 
            className="w-full border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 border outline-none transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-100"
        >
          {t.loginBtn}
        </button>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">{t.newClinic} <button type="button" onClick={() => navigate('/register')} className="text-blue-600 font-bold hover:underline">{t.registerNow}</button></p>
        </div>
      </form>
    </div>
  );
};

export default Login;
