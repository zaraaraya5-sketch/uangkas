import React, { useState } from 'react';
import { useKas } from '../../context/KasContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminDashboardHome } from './AdminDashboardHome';
import { StudentManagement } from './StudentManagement';
import { PaymentManagement } from './PaymentManagement';
import { ExpenseManagement } from './ExpenseManagement';
import { TransactionLedger } from './TransactionLedger';
import { ReportRecap } from './ReportRecap';
import { SettingsPanel } from './SettingsPanel';
import { PaymentModal } from './modals/PaymentModal';
import { ExpenseModal } from './modals/ExpenseModal';

export const AdminDashboard: React.FC = () => {
  const { activeAdminTab } = useKas();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Quick Action Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <AdminSidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Backdrop for Mobile Sidebar */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {activeAdminTab === 'dashboard' && (
            <AdminDashboardHome
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            />
          )}

          {activeAdminTab === 'students' && (
            <StudentManagement
              onQuickPayForStudent={() => setIsPaymentModalOpen(true)}
            />
          )}

          {activeAdminTab === 'payments' && (
            <PaymentManagement
              onOpenAddModal={() => setIsPaymentModalOpen(true)}
            />
          )}

          {activeAdminTab === 'expenses' && (
            <ExpenseManagement
              onOpenAddModal={() => setIsExpenseModalOpen(true)}
            />
          )}

          {activeAdminTab === 'transactions' && <TransactionLedger />}

          {activeAdminTab === 'reports' && <ReportRecap />}

          {activeAdminTab === 'settings' && <SettingsPanel />}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
};
