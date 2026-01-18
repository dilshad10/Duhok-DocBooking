
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { StorageService } from '../services/storage.ts';
import { Doctor, Appointment, DoctorStatus, SubscriptionStatus, Hospital } from '../types.ts';

const AdminDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  
  const [tab, setTab] = useState<'pending_doctors' | 'all_doctors' | 'manage_site'>('pending_doctors');
  const [siteSubTab, setSiteSubTab] = useState<'hospitals' | 'specialties' | 'areas'>('hospitals');
  
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<{ doctors: Partial<Doctor>[], sources: any[] } | null>(null);

  // Form states for management
  const [newHosp, setNewHosp] = useState<Partial<Hospital>>({ name: '', area: '', coords: '' });
  const [newSpec, setNewSpec] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDoctors(StorageService.getDoctors().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setAppointments(StorageService.getAppointments().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setHospitals(StorageService.getHospitals());
    setSpecialties(StorageService.getSpecialties());
    setAreas(StorageService.getAreas());
  };

  const handleAiSync = async () => {
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
    if (!apiKey) {
      alert("API Key not detected.");
      return;
    }

    setAiLoading(true);
    setAiResults(null);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Find a list of 10 real private medical doctors and specialist clinics currently active in Duhok, Kurdistan. 
      Include their full name, specialty (choose from current list: ${specialties.join(', ')}), and the hospital or clinic they work at.
      Format the output clearly for medical registration.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      const text = response.text || "No doctors found.";
      const lines = text.split('\n').filter(l => l.length > 10);
      const extractedDoctors: Partial<Doctor>[] = lines.map((line) => {
        return {
          id: `ai_${Math.random().toString(36).substr(2, 9)}`,
          fullName: line.split(':')[0]?.replace(/^\d+\.\s*/, '').replace(/Dr\.\s*/i, '').trim() || "Unknown Doctor",
          specialty: specialties.find(s => line.toLowerCase().includes(s.toLowerCase())) || "General Practice",
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
      alert("Failed to connect to medical registry.");
    } finally {
      setAiLoading(false);
    }
  };

  const importAllFound = () => {
    if (aiResults) {
      const newDocs = aiResults.doctors.map(d => ({ ...d, phoneNumber: '0750 000 0000' })) as Doctor[];
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

  // Site Management Handlers
  const addHospital = () => {
    if (!newHosp.name || !newHosp.area) return;
    const hosp: Hospital = {
      id: `hosp_${Date.now()}`,
      name: newHosp.name!,
      area: newHosp.area!,
      coords: newHosp.coords || ''
    };
    StorageService.saveHospital(hosp);
    setNewHosp({ name: '', area: '', coords: '' });
    loadData();
  };

  const deleteHospital = (id: string) => {
    if (confirm("Delete this hospital?")) {
      StorageService.deleteHospital(id);
      loadData();
    }
  };

  const addSpecialty = () => {
    if (!newSpec || specialties.includes(newSpec)) return;
    const updated = [...specialties, newSpec];
    StorageService.saveSpecialties(updated);
    setNewSpec('');
    loadData();
  };

  const deleteSpecialty = (s: string) => {
    const updated = specialties.filter(item => item !== s);
    StorageService.saveSpecialties(updated);
    loadData();
  };

  const addArea = () => {
    if (!newArea || areas.includes(newArea)) return;
    const updated = [...areas, newArea];
    StorageService.saveAreas(updated);
    setNewArea('');
    loadData();
  };

  const deleteArea = (a: string) => {
    const updated = areas.filter(item => item !== a);
    StorageService.saveAreas(updated);
    loadData();
  };

  const pendingDoctors = doctors.filter(d => d.status === 'pending');
  const filteredDocs = doctors.filter(d => d.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 font-bold uppercase tracking-tighter text-xs">Full System Control</p>
        </div>
        <button 
          onClick={handleAiSync}
          disabled={aiLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100 hover:scale-105 transition-transform"
        >
          {aiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-plus"></i>}
          AI Doctor Discovery
        </button>
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setTab('pending_doctors')} className={`px-4 py-3 font-black text-sm uppercase tracking-widest ${tab === 'pending_doctors' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400'}`}>Pending ({pendingDoctors.length})</button>
        <button onClick={() => setTab('all_doctors')} className={`px-4 py-3 font-black text-sm uppercase tracking-widest ${tab === 'all_doctors' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400'}`}>Full Registry</button>
        <button onClick={() => setTab('manage_site')} className={`px-4 py-3 font-black text-sm uppercase tracking-widest ${tab === 'manage_site' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400'}`}>Manage Site</button>
      </div>

      {tab === 'manage_site' && (
        <div className="bg-white rounded-[40px] border shadow-sm p-8 space-y-8">
           <div className="flex gap-4 mb-4">
             <button onClick={() => setSiteSubTab('hospitals')} className={`px-4 py-2 rounded-xl text-xs font-bold ${siteSubTab === 'hospitals' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Hospitals</button>
             <button onClick={() => setSiteSubTab('specialties')} className={`px-4 py-2 rounded-xl text-xs font-bold ${siteSubTab === 'specialties' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Specialties</button>
             <button onClick={() => setSiteSubTab('areas')} className={`px-4 py-2 rounded-xl text-xs font-bold ${siteSubTab === 'areas' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Areas</button>
           </div>

           {siteSubTab === 'hospitals' && (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-3xl border border-dashed">
                  <input placeholder="Hospital Name" className="p-3 rounded-xl border" value={newHosp.name} onChange={e => setNewHosp({...newHosp, name: e.target.value})} />
                  <select className="p-3 rounded-xl border" value={newHosp.area} onChange={e => setNewHosp({...newHosp, area: e.target.value})}>
                    <option value="">Select Area</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <input placeholder="Coords (optional)" className="p-3 rounded-xl border" value={newHosp.coords} onChange={e => setNewHosp({...newHosp, coords: e.target.value})} />
                  <button onClick={addHospital} className="bg-blue-600 text-white font-bold rounded-xl py-3">Add Hospital</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hospitals.map(h => (
                    <div key={h.id} className="p-6 bg-white border-2 rounded-[32px] flex justify-between items-center group">
                      <div>
                        <p className="font-black text-gray-900">{h.name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase">{h.area}</p>
                      </div>
                      <button onClick={() => deleteHospital(h.id)} className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {siteSubTab === 'specialties' && (
             <div className="space-y-6">
                <div className="flex gap-4">
                  <input placeholder="New Specialty (e.g. Oncology)" className="flex-grow p-4 rounded-2xl border" value={newSpec} onChange={e => setNewSpec(e.target.value)} />
                  <button onClick={addSpecialty} className="bg-blue-600 text-white font-bold px-8 rounded-2xl">Add</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {specialties.map(s => (
                    <div key={s} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs border border-blue-100 group">
                      {s}
                      <button onClick={() => deleteSpecialty(s)} className="text-blue-300 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {siteSubTab === 'areas' && (
             <div className="space-y-6">
                <div className="flex gap-4">
                  <input placeholder="New Area (e.g. Malta)" className="flex-grow p-4 rounded-2xl border" value={newArea} onChange={e => setNewArea(e.target.value)} />
                  <button onClick={addArea} className="bg-blue-600 text-white font-bold px-8 rounded-2xl">Add</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {areas.map(a => (
                    <div key={a} className="bg-gray-50 text-gray-700 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs border border-gray-200 group">
                      {a}
                      <button onClick={() => deleteArea(a)} className="text-gray-300 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      )}

      {tab === 'pending_doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingDoctors.length > 0 ? pendingDoctors.map(doc => (
            <div key={doc.id} className="bg-white p-8 rounded-[40px] border shadow-sm group hover:border-blue-200 transition-all">
              <h3 className="font-black text-xl text-gray-900">{doc.fullName}</h3>
              <p className="text-blue-600 text-sm font-black uppercase tracking-widest mt-1">{doc.specialty}</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-gray-400">CLINIC: {doc.clinicName}</p>
                <p className="text-xs font-bold text-gray-400">PHONE: {doc.phoneNumber}</p>
              </div>
              <button onClick={() => setSelectedDoctor(doc)} className="mt-6 w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-blue-600 transition-all">Review Application</button>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-30">
               <i className="fa-solid fa-circle-check text-4xl mb-4"></i>
               <p className="font-bold">No pending doctor applications.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'all_doctors' && (
        <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
          <div className="p-6 bg-gray-50 border-b flex items-center gap-4">
            <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
            <input placeholder="Search registry..." className="bg-transparent border-none outline-none font-bold text-sm w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialty</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-gray-900">{doc.fullName}</td>
                  <td className="px-8 py-5 text-sm font-bold text-blue-600">{doc.specialty}</td>
                  <td className="px-8 py-5">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                      doc.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => setSelectedDoctor(doc)} className="text-gray-900 font-black text-xs hover:text-blue-600">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black mb-2 text-gray-900">Dr. {selectedDoctor.fullName}</h3>
            <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">Administrative Actions</p>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Notes / Reason</label>
              <textarea 
                className="w-full border-none bg-gray-50 rounded-[32px] p-6 h-32 outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                placeholder="Describe why you are changing this doctor's status..."
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => handleStatusChange('active')} 
                disabled={!actionNote}
                className="bg-green-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-green-100 hover:bg-green-700 transition active:scale-95 disabled:opacity-30"
              >
                Approve & Activate
              </button>
              <button 
                onClick={() => handleStatusChange('suspended')} 
                disabled={!actionNote}
                className="bg-red-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-red-100 hover:bg-red-600 transition active:scale-95 disabled:opacity-30"
              >
                Suspend Account
              </button>
            </div>
            <button onClick={() => setSelectedDoctor(null)} className="w-full mt-6 text-gray-400 font-black text-sm hover:text-gray-900">Close Window</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
