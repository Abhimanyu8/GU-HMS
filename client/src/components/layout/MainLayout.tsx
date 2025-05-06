import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/use-mobile';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getPageTitle = () => {
    const path = location.split('/')[1];
    switch (path) {
      case '':
      case 'dashboard':
        return t('dashboard.dashboard');
      case 'appointments':
        return t('appointments.appointments');
      case 'patients':
        return t('patients.patients');
      case 'prescriptions':
        return t('prescriptions.prescriptions');
      case 'medical-records':
        return t('records.medicalRecords');
      case 'billing':
        return t('billing.billing');
      case 'settings':
        return t('settings.settings');
      default:
        return t('common.appName');
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100 font-sans">
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        <Header title={getPageTitle()} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
