
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { SPECIALTIES, DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { Doctor } from '../types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    specialty: '',
    clinicName: '',
    phoneNumber: '',
    bio: '',
    workingDays: [] as string[],
    timeSlots: [] as string[]
  });
  const [error, setError] = useState('');

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day) 
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const toggleSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot) 
        ? prev.timeSlots.filter(s => s !== slot)
        : [...prev.timeSlots, slot]
    }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (StorageService.getDoctorByEmail(formData.email)) {
      setError('Email already registered');
      return;
    }

    const newDoc: Doctor = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: formData.fullName,
      email: formData.email,
      passwordHash: formData.password, // In production, hash this
      phoneNumber: formData.phoneNumber,
      specialty: formData.specialty,
      clinicName: formData.clinicName,
      bio: formData.bio,
      workingDays: formData.workingDays,
      timeSlots: formData.timeSlots,
      status: 'pending',
      subscriptionStatus: 'free',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approvedByAdminId: null,
      notes: ''
    };

    StorageService.saveDoctor(newDoc);
    setStep(3); // Success state
  };

  if (step === 3) {
    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-2xl shadow-xl text-center border">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-hourglass-half text-4xl animate-pulse"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Registration Submitted</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">Thank you, Dr. {formData.fullName}. Your account is currently <strong>pending approval</strong> by our admin team in Duhok. You will be able to login once your clinic details are verified.</p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Doctor Registration</h2>
          <p className="text-gray-500 font-medium">Join the Duhok healthcare network</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-2xl">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-8">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

        {step === 1 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Dr. Karwan Ali"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Medical Specialty</label>
                <select 
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  value={formData.specialty}
                  onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                  required
                >
                  <option value="">Select Specialty</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="dr.karwan@gmail.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Clinic Name & Branch</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Zirka Specialist Center"
                  value={formData.clinicName}
                  onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Work Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="0750 XXX XXXX"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Brief Biography (Optional)</label>
              <textarea 
                className="w-full bg-gray-50 border-gray-100 rounded-3xl p-5 text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all h-32 leading-relaxed"
                placeholder="Share your background, qualifications, or specific services offered to patients..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <button 
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.fullName || !formData.email || !formData.password || !formData.clinicName || !formData.phoneNumber}
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-[24px] hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-100 disabled:opacity-30"
            >
              Continue to Schedule
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Working Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`p-4 text-xs rounded-2xl font-bold border transition-all ${
                      formData.workingDays.includes(day) 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-blue-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Available Time Slots</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`p-3 text-[10px] rounded-xl font-extrabold border transition-all ${
                      formData.timeSlots.includes(slot) 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-50' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-blue-400'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-100 text-gray-600 font-bold py-5 rounded-[24px] hover:bg-gray-200 transition-all"
              >
                Go Back
              </button>
              <button 
                type="submit"
                disabled={formData.workingDays.length === 0 || formData.timeSlots.length === 0}
                className="flex-grow bg-blue-600 text-white font-bold py-5 rounded-[24px] hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-100 disabled:opacity-30"
              >
                Complete Registration
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Register;
