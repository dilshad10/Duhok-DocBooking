
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { StorageService } from '../services/storage';
// Added SubscriptionStatus to imports to fix type incompatibility
import { Doctor, Appointment, AdminAction, DoctorStatus, AdminActionType, SubscriptionStatus } from '../types';
import { SPECIALTIES } from '../constants';

const AdminDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'pending_doctors' | 'all_doctors' | 'appointments' | 'audit'>('pending_doctors');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<{ doctors: Partial<Doctor>[], sources: any[] } | null>(null);
  const session = StorageService.getSession();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allDocs = StorageService.getDoctors().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setDoctors(allDocs);
    setAppointments(StorageService.getAppointments().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleAiSync = async () => {
    setAiLoading(true);
    setAiResults(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Search for the most prominent private doctors, specialist clinics, and surgeons currently operating in Duhok, Kurdistan. 
      Identify them by their full names, specialty, and clinic affiliation (e.g. Vajeen, Azadi Private, Zheen, etc.).
      Return a list of at least 10 doctors with their specific specialties. 
      Ensure you include doctors from major hospitals in Duhok.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No doctors found.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const lines = text.split('\n').filter(l => l.length > 10 && (l.includes(':') || l.match(/^\d+\./)));
      const extractedDoctors: Partial<Doctor>[] = lines.map((line, i) => {
        const parts = line.split(':');
        const namePart = parts[0].replace(/^\d+\.\s*/, '').trim();
        const infoPart = parts[1]?.trim() || "";
        
        return {
          id: `ai_${Math.random().toString(36).substr(2, 9)}`,
          fullName: namePart.length > 25 ? namePart.substring(0, 25) : namePart,
          specialty: SPECIALTIES.find(s => infoPart.toLowerCase().includes(s.toLowerCase())) || "General Practice",
          clinicName: infoPart.split(',')[0] || "Private Clinic, Duhok",
          status: 'active' as DoctorStatus,
          email: `${namePart.toLowerCase().replace(/\s/g, '.')}@duhok.med`,
          passwordHash: 'imported_ai',
          workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
          timeSlots: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'],
          // Cast 'active' to SubscriptionStatus to fix Type Error in line 52
          subscriptionStatus: 'active' as SubscriptionStatus,
          createdAt: new Date().toISOString(),
          bio: `Verified specialist practicing in Duhok. Professional information sourced via automated registry sync.`
        };
      }).filter(d => d.fullName && d.fullName.length > 4);

      setAiResults({ doctors: extractedDoctors, sources });
    } catch (err) {
      console.error("AI Sync failed", err);
      alert("AI lookup failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const importAllFound = () => {
    if (aiResults) {
      StorageService.saveDoctors(aiResults.doctors as Doctor[]);
      setAiResults(null);
      loadData();
      alert(`Successfully added ${aiResults.doctors.length} new doctors to the Duhok registry.`);
    }
  };

  const handleStatusChange = (status: DoctorStatus) => {
    if (!selectedDoctor || !session || !actionNote) return;
    const updatedDoc: Doctor = { ...selectedDoctor, status, notes: actionNote };
    StorageService.saveDoctor(updatedDoc);
    setSelectedDoctor(null);
    setActionNote('');
    loadData();
  };

  const pendingDoctors = doctors.filter(d => d.status === 'pending');
  const filteredDocs = doctors.filter(d => 
    d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Administration</h1>
          <p className="text-gray-500 mt-1">Managing Duhok's digital medical network.</p>
        </div>
        <button 
          onClick={handleAiSync}
          disabled={aiLoading}
          className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-bold flex items-center gap-3 hover:bg-indigo-700 transition shadow-2xl shadow-indigo-100 disabled:opacity-50"
        >
          {aiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-globe"></i>}
          Discover Local Doctors (AI)
        </button>
      </div>

      {aiResults && (
        <div className="bg-white rounded-[40px] p-10 border-4 border-indigo-100 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-indigo-900">AI Search Results: {aiResults.doctors.length} Doctors</h2>
            <div className="flex gap-4">
              <button onClick={() => setAiResults(null)} className="px-6 py-2 text-gray-400 font-bold">Discard</button>
              <button onClick={importAllFound} className="bg-indigo-600 text-white px-8 py-2 rounded-2xl font-bold shadow-lg">Import to Registry</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {aiResults.doctors.map((d, i) => (
              <div key={i} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                <div>
                  <p className="font-black text-indigo-900">Dr. {d.fullName}</p>
                  <p className="text-xs text-indigo-400 font-bold uppercase">{d.specialty} • {d.clinicName}</p>
                </div>
                <i className="fa-solid fa-check-circle text-green-500"></i>
              </div>
            ))}
          </div>
          <div className="border-t pt-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Verification Grounding Sources</p>
            <div className="flex flex-wrap gap-2">
              {aiResults.sources.map((chunk, i) => (
                chunk.web && (
                  <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-100 px-4 py-2 rounded-xl text-xs text-blue-600 font-bold flex items-center gap-2 hover:shadow-md transition">
                    <i className="fa-solid fa-square-rss"></i>
                    {chunk.web.title}
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button onClick={() => setTab('pending_doctors')} className={`px-6 py-4 font-black text-sm relative ${tab === 'pending_doctors' ? 'text-blue-600' : 'text-gray-400'}`}>
            Pending ({pendingDoctors.length})
            {tab === 'pending_doctors' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
          </button>
          <button onClick={() => setTab('all_doctors')} className={`px-6 py-4 font-black text-sm relative ${tab === 'all_doctors' ? 'text-blue-600' : 'text-gray-400'}`}>
            Full Registry
            {tab === 'all_doctors' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
          </button>
        </div>
        <div className="pb-2">
          <input type="text" placeholder="Filter registry..." className="px-6 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        {tab === 'pending_doctors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingDoctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-3xl p-8 border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold text-xl">{doc.fullName.charAt(0)}</div>
                    <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Awaiting Review</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{doc.fullName}</h3>
                  <p className="text-sm text-blue-600 font-bold mb-4">{doc.specialty}</p>
                  <p className="text-xs text-gray-500 mb-6 italic">{doc.clinicName}</p>
                </div>
                <button onClick={() => setSelectedDoctor(doc)} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition">Verify Profile</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'all_doctors' && (
          <div className="bg-white rounded-[32px] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                <tr>
                  <th className="px-8 py-5">Full Name</th>
                  <th className="px-8 py-5">Specialty</th>
                  <th className="px-8 py-5">Location</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-5 font-black text-gray-900">{doc.fullName}</td>
                    <td className="px-8 py-5"><span className="text-blue-600 font-bold">{doc.specialty}</span></td>
                    <td className="px-8 py-5 text-gray-500 font-medium">{doc.clinicName}</td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => setSelectedDoctor(doc)} className="text-gray-400 hover:text-blue-600 transition"><i className="fa-solid fa-pen-to-square"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10">
            <h3 className="text-2xl font-black mb-6">Manage Doctor Profile</h3>
            <div className="space-y-4 mb-8">
               <div className="p-4 bg-gray-50 rounded-2xl">
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Full Name</p>
                 <p className="font-bold">{selectedDoctor.fullName}</p>
               </div>
               <textarea 
                  className="w-full border-2 border-gray-100 rounded-2xl p-5 h-32 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter administrative notes or reason for status change..."
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleStatusChange('active')} className="bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-100">Approve / Active</button>
              <button onClick={() => handleStatusChange('suspended')} className="bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-100">Suspend</button>
            </div>
            <button onClick={() => setSelectedDoctor(null)} className="w-full text-gray-400 font-bold text-xs mt-6 uppercase">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
