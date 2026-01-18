
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const session = StorageService.getSession();

  const handleLogout = () => {
    StorageService.setSession(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <i className="fa-solid fa-house-medical text-2xl mr-2"></i>
            <h1 className="text-xl font-bold tracking-tight">Duhok DocBooking</h1>
          </div>
          
          <nav className="flex items-center space-x-4">
            {!session ? (
              <>
                <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-blue-200">Doctor Login</button>
                <button onClick={() => navigate('/register')} className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">Join as Doctor</button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="hidden sm:inline text-sm opacity-80">Hello, {session.name}</span>
                <button 
                  onClick={() => navigate(session.role === 'admin' ? '/admin' : '/dashboard')}
                  className="text-sm font-medium hover:text-blue-200"
                >
                  Dashboard
                </button>
                <button onClick={handleLogout} className="text-sm font-medium bg-red-600 px-3 py-1 rounded hover:bg-red-700">Logout</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {title && <h2 className="text-2xl font-bold mb-6 text-gray-800">{title}</h2>}
        {children}
      </main>

      <footer className="bg-gray-100 border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Duhok DocBooking. Built for local clinics in Duhok, Kurdistan.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
