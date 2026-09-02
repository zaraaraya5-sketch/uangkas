import React, { useState } from 'react';
import { KasProvider, useKas } from './context/KasContext';
import { LandingPage } from './components/landing/LandingPage';
import { StudentDashboard } from './components/student/StudentDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginModal } from './components/auth/LoginModal';

const AppContent: React.FC = () => {
  const { currentView, currentUser, setCurrentView } = useKas();
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);

  // Security guard for Admin View: only authenticated admin or ketua_kelas can access
  if (currentView === 'admin' && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'ketua_kelas'))) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
        <LandingPage />
        <ToastContainer />
        <LoginModal
          isOpen={true}
          defaultRole="admin"
          onClose={() => setCurrentView('landing')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-brand-500 selection:text-white">
      {/* Primary Views */}
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'student' && <StudentDashboard />}
      {currentView === 'admin' && <AdminDashboard />}

      {/* Global Toast System */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <KasProvider>
      <AppContent />
    </KasProvider>
  );
}

export default App;
