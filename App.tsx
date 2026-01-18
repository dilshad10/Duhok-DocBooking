
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PatientHome from './views/PatientHome';
import Login from './views/Login';
import Register from './views/Register';
import DoctorDashboard from './views/DoctorDashboard';
import AdminDashboard from './views/AdminDashboard';
import CancelAppointment from './views/CancelAppointment';
import DoctorProfile from './views/DoctorProfile';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  const session = StorageService.getSession();

  // Simple route guard for doctors
  const DoctorRoute = ({ children }: { children: React.ReactNode }) => {
    if (!session || session.role !== 'doctor') return <Navigate to="/login" />;
    return <>{children}</>;
  };

  // Simple route guard for admin
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!session || session.role !== 'admin') return <Navigate to="/login" />;
    return <>{children}</>;
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PatientHome />} />
          <Route path="/login" element={session ? <Navigate to={session.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cancel/:token" element={<CancelAppointment />} />
          <Route path="/doctor/:id" element={<DoctorProfile />} />
          <Route path="/dashboard" element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
