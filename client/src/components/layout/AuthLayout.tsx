import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/layout/Footer';

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If authenticated, redirect to dashboard
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
