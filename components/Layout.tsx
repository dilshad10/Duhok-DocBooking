
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { translations, Language } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>(StorageService.getLanguage());
  const t = translations[lang];
  const session = StorageService.getSession();

  useEffect(() => {
    // Set direction based on language
    const dir = (lang === 'ku' || lang === 'ar') ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    StorageService.setLanguage(lang);
  }, [lang]);

  const handleLogout = () => {
    StorageService.setSession(null);
    navigate('/');
    window.location.reload();
  };

  const changeLang = (l: Language) => {
    setLang(l);
    window.location.reload(); // Refresh to update all components and constants
  };

  return (
    <div className="min-h-screen flex flex-col font-medium">
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <i className={`fa-solid fa-house-medical text-2xl ${lang === 'en' ? 'mr-2' : 'ml-2'}`}></i>
            <h1 className="text-xl font-bold tracking-tight">Duhok Doc</h1>
          </div>
          
          <nav className="flex items-center space-x-2 sm:space-x-6">
            {/* Language Switcher */}
            <div className="flex bg-blue-800 p-1 rounded-xl border border-blue-600">
              {(['en', 'ku', 'ar'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                    lang === l ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-100 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {!session ? (
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button onClick={() => navigate('/login')} className="hidden sm:inline text-xs font-bold uppercase tracking-widest hover:text-blue-200">{t.login}</button>
                <button onClick={() => navigate('/register')} className="bg-white text-blue-700 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20">{t.join}</button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button 
                  onClick={() => navigate(session.role === 'admin' ? '/admin' : '/dashboard')}
                  className="text-xs font-black uppercase tracking-widest hover:text-blue-200"
                >
                  {t.dashboard}
                </button>
                <button onClick={handleLogout} className="text-xs font-black uppercase tracking-widest bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 shadow-lg shadow-red-900/20">{t.logout}</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {title && <h2 className="text-2xl font-black mb-6 text-gray-800">{title}</h2>}
        {children}
      </main>

      <footer className="bg-gray-100 border-t py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 mb-8 opacity-40 grayscale">
             <i className="fa-solid fa-hand-holding-medical text-3xl"></i>
             <i className="fa-solid fa-hospital-user text-3xl"></i>
             <i className="fa-solid fa-user-doctor text-3xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-bold opacity-70">&copy; {new Date().getFullYear()} Duhok DocBooking. {t.footer}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
