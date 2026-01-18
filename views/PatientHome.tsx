
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Doctor } from '../types';
import { SPECIALTIES, DUHOK_HOSPITALS } from '../constants';

const PatientHome: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const all = StorageService.getDoctors().filter(d => d.status === 'active');
    setDoctors(all);
  }, []);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => {
      const matchesSearch = d.fullName.toLowerCase().includes(search.toLowerCase()) || 
                            d.clinicName.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty = !specialtyFilter || d.specialty === specialtyFilter;
      const matchesHospital = !hospitalFilter || d.clinicName.toLowerCase().includes(hospitalFilter.toLowerCase());
      return matchesSearch && matchesSpecialty && matchesHospital;
    });
  }, [doctors, search, specialtyFilter, hospitalFilter]);

  const openInMap = (term: string) => {
    window.open(`https://www.google.com/maps/search/Duhok+${encodeURIComponent(term)}`, '_blank');
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="text-center py-24 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-[80px] px-8 border-b-8 border-blue-900/20 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-indigo-400 rounded-full blur-3xl"></div>
        </div>
        
        <h1 className="text-6xl font-black text-white mb-6 tracking-tight relative z-10 leading-none drop-shadow-lg">Duhok Healthcare</h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto opacity-90 font-medium relative z-10">
          Find and book top-rated specialists across Duhok. Fast, reliable, and verified.
        </p>
        
        <div className="mt-12 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 relative z-10">
          <div className="flex-grow relative group">
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Search doctor or clinic..."
              className="w-full pl-16 pr-8 py-6 rounded-[32px] border-none shadow-2xl focus:ring-8 focus:ring-blue-400/20 text-gray-900 font-bold text-lg placeholder:text-gray-400 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="md:w-72 px-8 py-6 rounded-[32px] border-none shadow-2xl focus:ring-8 focus:ring-blue-400/20 bg-white font-black text-gray-700 text-lg appearance-none cursor-pointer"
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="">All Specialties</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </section>

      {/* Medical Centers Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end px-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hospitals & Centers</h2>
            <p className="text-gray-500 font-bold text-sm">Select a facility to see its medical team</p>
          </div>
          {hospitalFilter && (
            <button 
              onClick={() => setHospitalFilter('')}
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar snap-x px-4">
          {DUHOK_HOSPITALS.map((hosp) => (
            <div 
              key={hosp.name}
              onClick={() => setHospitalFilter(hosp.name === hospitalFilter ? '' : hosp.name)}
              className={`flex-shrink-0 w-72 p-6 rounded-[32px] border-2 transition-all cursor-pointer snap-start relative group overflow-hidden ${
                hospitalFilter === hosp.name 
                ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-100' 
                : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
              }`}
            >
              <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); openInMap(hosp.name); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    hospitalFilter === hosp.name ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <i className="fa-solid fa-map-location-dot text-xs"></i>
                </button>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4 ${
                hospitalFilter === hosp.name ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
              }`}>
                <i className="fa-solid fa-hospital"></i>
              </div>
              <h3 className={`font-bold text-lg leading-tight mb-1 ${hospitalFilter === hosp.name ? 'text-white' : 'text-gray-900'}`}>{hosp.name}</h3>
              <p className={`text-xs font-bold uppercase tracking-widest ${hospitalFilter === hosp.name ? 'text-blue-100' : 'text-gray-400'}`}>{hosp.area}, Duhok</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Results Grid */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Available Doctors</h2>
          <div className="h-0.5 flex-grow bg-gray-100 rounded-full"></div>
          <span className="text-gray-400 font-bold text-sm uppercase tracking-widest">{filteredDoctors.length} found</span>
        </div>
        
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {filteredDoctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all flex flex-col group relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center font-bold text-2xl shadow-xl shadow-blue-100">
                    {doc.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                      {doc.specialty}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openInMap(`${doc.fullName} ${doc.clinicName}`); }}
                      className="text-blue-400 hover:text-blue-600 transition-colors text-xs flex items-center gap-1 font-bold"
                    >
                      <i className="fa-solid fa-map-location-dot"></i> Map
                    </button>
                  </div>
                </div>
                <h3 className="relative z-10 text-2xl font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight">Dr. {doc.fullName}</h3>
                <p className="relative z-10 text-gray-500 flex items-center mt-2 text-sm font-medium">
                  <i className="fa-solid fa-location-dot mr-2 text-blue-400"></i>
                  {doc.clinicName}
                </p>
                <div className="mt-4 flex items-center gap-1 text-yellow-400 text-sm">
                  {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                  <span className="text-gray-400 font-bold ml-2 text-xs">Verified</span>
                </div>
                <button 
                  onClick={() => navigate(`/doctor/${doc.id}`)}
                  className="relative z-10 mt-8 w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[48px] border-2 border-dashed border-gray-200 mx-4">
             <i className="fa-solid fa-user-doctor text-4xl text-gray-300 mb-4"></i>
             <p className="text-gray-500 font-bold">No specialists matching your criteria were found in Duhok.</p>
          </div>
        )}
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PatientHome;
