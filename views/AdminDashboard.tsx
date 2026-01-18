
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { StorageService } from '../services/storage.ts';
import { Doctor, Appointment, DoctorStatus, SubscriptionStatus } from '../types.ts';
import { SPECIALTIES } from '../constants.ts';

const AdminDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'pending_doctors' | 'all_doctors' | 'appointments'>('pending_doctors');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<{ doctors: Partial<Doctor>[], sources: any[] } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allDocs = StorageService.getDoctors().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setDoctors(allDocs);
    setAppointments(StorageService.getAppointments().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleAiSync = async () => {
    // Safety check for the API key in the environment
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
    
    if (!apiKey) {
      alert("API Key not detected. Please ensure you have added API_KEY to your environment variables.");
      return;
    }

    setAiLoading(true);
    setAiResults(null);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Find a list of 10 real private medical doctors and specialist clinics currently active in Duhok, Kurdistan. 
      Include their full name, specialty (choose from: ${SPECIALTIES.join(', ')}), and the hospital or clinic they work at.
      Format the output clearly for medical registration.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No doctors found.";
      
      const lines = text.split('\n').filter(l => l.length > 10);
      const extractedDoctors: Partial<Doctor>[] = lines.map((line) => {
        return {
          id: `ai_${Math.random().toString(36).substr(2, 9)}`,
          fullName: line.split(':')[0]?.replace(/^\d+\.\s*/, '').replace(/Dr\.\s*/i, '').trim() || "Unknown Doctor",
          specialty: SPECIALTIES.find(s => line.toLowerCase().includes(s.toLowerCase())) || "General Practice",
          clinicName: "Private Clinic, Duhok",
          status: 'active' as DoctorStatus,
          email: `info@duhok.med`,
          passwordHash: 'imported',
          workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          timeSlots: ['16:00', '17:00', '18:00'],
          subscriptionStatus: 'active' as SubscriptionStatus,
          createdAt: new Date().toISOString()
        };
      }).filter(d => d.fullName.length > 3);

      setAiResults({ doctors: extractedDoctors, sources: [] });
    } catch (err) {
      console.error("AI Sync failed", err);
      alert("Failed to connect to medical registry. Check your internet and API key.");
    } finally {
      setAiLoading(false);
    }
  };

  const importAllFound = () => {
    if (aiResults) {
      const newDocs = aiResults.doctors.map(d => ({
        ...d,
        phoneNumber: '0750 000 0000',
      })) as Doctor[];
      StorageService.saveDoctors(newDocs);
      setAiResults(null);
      loadData();
      alert(`Imported ${aiResults.doctors.length} doctors.`);
    }
  };

  const handleStatusChange = (status: DoctorStatus) => {
    if (!selectedDoctor || !actionNote) return;
    const updatedDoc: Doctor = { ...selectedDoctor, status, notes: actionNote };
    StorageService.saveDoctor(updatedDoc);
    setSelectedDoctor(null);
    setActionNote('');
    loadData();
  };

  const pendingDoctors = doctors.filter(d => d.status === 'pending');
  const filteredDocs = doctors.filter(d => 
    d.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Duhok Healthcare Management</p>
        </div>
        <button 
          onClick={handleAiSync}
          disabled={aiLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
        >
          {aiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-plus"></i>}
          AI Doctor Discovery
        </button>
      </div>

      {aiResults && (
        <div className="bg-white p-8 rounded-[32px] border-4 border-blue-50 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Found {aiResults.doctors.length} Doctors</h3>
            <button onClick={importAllFound} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold">Import All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiResults.doctors.map((d, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl border">
                <p className="font-bold">Dr. {d.fullName}</p>
                <p className="text-xs text-gray-500 uppercase font-bold">{d.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 border-b">
        <button onClick={() => setTab('pending_doctors')} className={`px-4 py-2 font-bold ${tab === 'pending_doctors' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}>Pending ({pendingDoctors.length})</button>
        <button onClick={() => setTab('all_doctors')} className={`px-4 py-2 font-bold ${tab === 'all_doctors' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}>Full Registry</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tab === 'pending_doctors' && pendingDoctors.map(doc => (
          <div key={doc.id} className="bg-white p-6 rounded-3xl border shadow-sm">
            <h3 className="font-bold text-lg">{doc.fullName}</h3>
            <p className="text-blue-600 text-sm font-bold">{doc.specialty}</p>
            <p className="text-gray-500 text-xs mt-2">{doc.clinicName}</p>
            <button onClick={() => setSelectedDoctor(doc)} className="mt-4 w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Manage</button>
          </div>
        ))}
      </div>

      {tab === 'all_doctors' && (
        <div className="bg-white rounded-3xl border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Specialty</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="border-t">
                  <td className="px-6 py-4 font-bold">{doc.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.specialty}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedDoctor(doc)} className="text-blue-600 font-bold">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-xl font-black mb-4">Manage Dr. {selectedDoctor.fullName}</h3>
            <textarea 
              className="w-full border-2 rounded-2xl p-4 h-32 outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="Internal notes..."
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button onClick={() => handleStatusChange('active')} className="bg-green-600 text-white font-bold py-4 rounded-xl">Activate</button>
              <button onClick={() => handleStatusChange('suspended')} className="bg-red-500 text-white font-bold py-4 rounded-xl">Suspend</button>
            </div>
            <button onClick={() => setSelectedDoctor(null)} className="w-full mt-4 text-gray-400 font-bold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
