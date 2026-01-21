
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage.ts';
import { Doctor, Appointment, DoctorStatus, Hospital } from '../types.ts';
import { translations } from '../translations';

const AdminDashboard: React.FC = () => {
  const lang = StorageService.getLanguage();
  const t = translations[lang];

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [tab, setTab] = useState<'pending_doctors' | 'all_doctors' | 'manage_site'>('pending_doctors');
  const [siteSubTab, setSiteSubTab] = useState<'hospitals' | 'specialties' | 'areas'>('hospitals');
  
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [newHosp, setNewHosp] = useState<Partial<Hospital>>({ name: '', area: '', coords: '' });
  const [newSpec, setNewSpec] = useState('');
  const [newArea, setNewArea] = useState('');

  const loadData = () => {
    const allDocs = StorageService.getDoctors();
    setDoctors(allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setHospitals(StorageService.getHospitals());
    setSpecialties(StorageService.getSpecialties());
    setAreas(StorageService.getAreas());
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('sync-complete', handleSync);
    return () => window.removeEventListener('sync-complete', handleSync);
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    await StorageService.syncWithCloud('pull');
    loadData();
    setIsSyncing(false);
  };

  const handleStatusChange = async (status: DoctorStatus) => {
    if (!selectedDoctor || !actionNote) return;
    setIsSyncing(true);
    
    // Save locally
    const updatedDoc = { ...selectedDoctor, status, notes: actionNote };
    await StorageService.saveDoctor(updatedDoc);
    
    // Clear modal
    setSelectedDoctor(null);
    setActionNote('');
    
    // Push and refresh
    await StorageService.syncWithCloud('push');
    await StorageService.syncWithCloud('pull');
    loadData();
    setIsSyncing(false);
    alert(`Doctor status set to ${status}. This change is now live for all users.`);
  };

  const handleAddHospital = async () => {
    if (!newHosp.name || !newHosp.area) return;
    const hosp: Hospital = {
      id: `hosp_${Date.now()}`,
      name: newHosp.name!,
      area: newHosp.area!,
      coords: newHosp.coords || ''
    };
    await StorageService.saveHospital(hosp);
    setNewHosp({ name: '', area: '', coords: '' });
    loadData();
  };

  const handleDeleteHospital = async (id: string) => {
    if (confirm("Delete this hospital?")) {
      await StorageService.deleteHospital(id);
      loadData();
    }
  };

  const handleAddSpecialty = async () => {
    if (!newSpec || specialties.includes(newSpec)) return;
    const updated = [...specialties, newSpec];
    await StorageService.saveSpecialties(updated);
    setNewSpec('');
    loadData();
  };

  const handleAddArea = async () => {
    if (!newArea || areas.includes(newArea)) return;
    const updated = [...areas, newArea];
    await StorageService.saveAreas(updated);
    setNewArea('');
    loadData();
  };

  const pendingDoctors = doctors.filter(d => d.status === 'pending');
  const filteredDocs = doctors.filter(d => d.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.adminTitle}</h1>
          <p className="text-gray-500 font-bold uppercase tracking-tighter text-xs">{t.fullControl}</p>
        </div>
        <button 
          onClick={handleForceSync}
          disabled={isSyncing}
          className="bg-blue-100 text-blue-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-200 transition-all shadow-lg disabled:opacity-50"
        >
          {isSyncing ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-down mr-2"></i>}
          {t.forceSync}
        </button>
      </div>

      <div className="flex gap-4 border-b rtl:space-x-reverse overflow-x-auto no-scrollbar">
        <button onClick={() => setTab('pending_doctors')} className={`px-4 py-3 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors ${tab === 'pending_doctors' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400'}`}>
          {t.pending} ({pendingDoctors.length})
        </button>
        <button onClick={() => setTab('all_doctors')} className={`px-4 py-3 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors ${tab === 'all_doctors' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400'}`}>
          {t.registry}
        </button>
        <button onClick={() => setTab('manage_site')} className={`px-4 py-3 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-colors ${tab === 'manage_site' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400'}`}>
          {t.manageSite}
        </button>
      </div>

      {tab === 'manage_site' && (
        <div className="bg-white rounded-[40px] border shadow-sm p-8 space-y-8">
           <div className="flex gap-4 mb-4 rtl:space-x-reverse">
             <button onClick={() => setSiteSubTab('hospitals')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${siteSubTab === 'hospitals' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>{t.hospitals}</button>
             <button onClick={() => setSiteSubTab('specialties')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${siteSubTab === 'specialties' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>{t.specialties}</button>
             <button onClick={() => setSiteSubTab('areas')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${siteSubTab === 'areas' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>{t.areas}</button>
           </div>

           {siteSubTab === 'hospitals' && (
             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-blue-50/50 p-6 rounded-3xl border border-dashed border-blue-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">{t.hospitals}</label>
                    <input placeholder="Name" className="w-full p-3 rounded-xl border border-blue-100 outline-none font-bold" value={newHosp.name} onChange={e => setNewHosp({...newHosp, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">{t.areas}</label>
                    <select className="w-full p-3 rounded-xl border border-blue-100 outline-none font-bold appearance-none bg-white" value={newHosp.area} onChange={e => setNewHosp({...newHosp, area: e.target.value})}>
                      <option value="">Select Area</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Coords</label>
                    <input placeholder="Lat, Long" className="w-full p-3 rounded-xl border border-blue-100 outline-none font-bold" value={newHosp.coords} onChange={e => setNewHosp({...newHosp, coords: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleAddHospital} className="w-full bg-blue-600 text-white font-black rounded-xl py-3 hover:bg-blue-700 transition-all">Add</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hospitals.map(h => (
                    <div key={h.id} className="p-6 bg-white border-2 border-gray-100 rounded-[32px] flex justify-between items-center group hover:border-blue-100 transition-all">
                      <div>
                        <p className="font-black text-gray-900 text-lg">{h.name}</p>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1 bg-blue-50 inline-block px-3 py-1 rounded-full">{h.area}</p>
                      </div>
                      <button onClick={() => handleDeleteHospital(h.id)} className="text-gray-300 hover:text-red-600 p-3 rounded-xl hover:bg-red-50 transition-all">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {siteSubTab === 'specialties' && (
             <div className="space-y-8">
                <div className="flex gap-4">
                  <input placeholder="New Specialty" className="flex-grow p-5 rounded-[24px] border border-gray-100 bg-gray-50 outline-none font-bold" value={newSpec} onChange={e => setNewSpec(e.target.value)} />
                  <button onClick={handleAddSpecialty} className="bg-blue-600 text-white font-black px-10 rounded-[24px] hover:bg-blue-700">Add</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {specialties.map(s => (
                    <div key={s} className="bg-white border-2 border-gray-100 px-5 py-3 rounded-2xl flex items-center gap-4 font-black text-sm">
                      {s}
                      <button onClick={() => StorageService.saveSpecialties(specialties.filter(x => x !== s)).then(loadData)} className="text-gray-300 hover:text-red-500">
                        <i className="fa-solid fa-circle-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {siteSubTab === 'areas' && (
             <div className="space-y-8">
                <div className="flex gap-4">
                  <input placeholder="New Area" className="flex-grow p-5 rounded-[24px] border border-gray-100 bg-gray-50 outline-none font-bold" value={newArea} onChange={e => setNewArea(e.target.value)} />
                  <button onClick={handleAddArea} className="bg-blue-600 text-white font-black px-10 rounded-[24px] hover:bg-blue-700">Add</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {areas.map(a => (
                    <div key={a} className="bg-white border-2 border-gray-100 px-5 py-3 rounded-2xl flex items-center gap-4 font-black text-sm">
                      {a}
                      <button onClick={() => StorageService.saveAreas(areas.filter(x => x !== a)).then(loadData)} className="text-gray-300 hover:text-red-500">
                        <i className="fa-solid fa-circle-xmark"></i>
                      </button>
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
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black">
                  {doc.fullName.charAt(0)}
                </div>
                <span className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase px-3 py-1 rounded-full">Pending</span>
              </div>
              <h3 className="font-black text-xl text-gray-900">{doc.fullName}</h3>
              <p className="text-blue-600 text-sm font-black uppercase tracking-widest mt-1">{doc.specialty}</p>
              <button onClick={() => setSelectedDoctor(doc)} className="mt-6 w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                Review Account
              </button>
            </div>
          )) : (
            <div className="col-span-full py-32 text-center">
               <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                 <i className="fa-solid fa-check-double"></i>
               </div>
               <p className="font-black text-gray-400 uppercase tracking-widest text-sm">All set! No pending approvals.</p>
            </div>
          )}
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-10 shadow-2xl">
            <h3 className="text-3xl font-black mb-1 text-gray-900">Dr. {selectedDoctor.fullName}</h3>
            <p className="text-sm font-bold text-blue-600 mb-6 uppercase tracking-widest">{selectedDoctor.specialty}</p>
            
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-[32px] space-y-2 border">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clinic: <span className="text-gray-900">{selectedDoctor.clinicName}</span></p>
              </div>
              <textarea 
                className="w-full border-2 border-gray-100 bg-white rounded-[32px] p-6 h-32 outline-none font-medium"
                placeholder="Reason for approval/rejection..."
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => handleStatusChange('active')} disabled={!actionNote || isSyncing} className="bg-green-600 text-white font-black py-5 rounded-3xl hover:bg-green-700 disabled:opacity-30">
                {isSyncing ? 'Pushing...' : 'Approve'}
              </button>
              <button onClick={() => handleStatusChange('suspended')} disabled={!actionNote || isSyncing} className="bg-red-500 text-white font-black py-5 rounded-3xl hover:bg-red-600 disabled:opacity-30">
                Suspend
              </button>
            </div>
            <button onClick={() => setSelectedDoctor(null)} className="w-full mt-6 text-gray-400 font-black text-sm uppercase">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
