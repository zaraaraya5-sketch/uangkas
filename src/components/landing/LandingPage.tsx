import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { LiveCashOverview } from './LiveCashOverview';
import { PaymentProgressBar } from './PaymentProgressBar';
import { RecentTransactions } from './RecentTransactions';
import { TransparencySection } from './TransparencySection';
import { Footer } from './Footer';
import { LoginModal } from '../auth/LoginModal';

export const LandingPage: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleOpenLogin = () => {
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar onOpenLogin={handleOpenLogin} />
      <main className="flex-1">
        <HeroSection onOpenAdminLogin={handleOpenLogin} />
        <LiveCashOverview />
        <PaymentProgressBar />
        <RecentTransactions onOpenTransactions={handleOpenLogin} />
        <TransparencySection />
      </main>
      <Footer />

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
};
