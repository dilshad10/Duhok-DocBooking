
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import PatientHome from './views/PatientHome.tsx';
import Login from './views/Login.tsx';
import Register from './views/Register.tsx';
import DoctorDashboard from './views/DoctorDashboard.tsx';
import AdminDashboard from './views/AdminDashboard.tsx';
import CancelAppointment from './views/CancelAppointment.tsx';
import DoctorProfile from './views/DoctorProfile.tsx';
import { StorageService } from './services/storage.ts';

const App: React.FC = () => {
  // Simple route guard for doctors
  const DoctorRoute = ({ children }: { children: React.ReactNode }) => {
    const s = StorageService.getSession();
    if (!s || s.role !== 'doctor') return <Navigate to="/login" />;
    return <>{children}</>;
  };

  // Simple route guard for admin
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const s = StorageService.getSession();
    if (!s || s.role !== 'admin') return <Navigate to="/login" />;
    return <>{children}</>;
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PatientHome />} />
          <Route path="/login" element={<Login />} />
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
