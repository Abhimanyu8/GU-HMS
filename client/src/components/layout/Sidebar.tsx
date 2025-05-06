import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { 
  ChartLine, 
  CalendarCheck, 
  UserRound, 
  Stethoscope, 
  FileText, 
  Receipt, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';
import { DOCTOR_NAV_ITEMS, PATIENT_NAV_ITEMS, UserRole, APP_NAME } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';
import guLogoPath from '@/assets/gu-logo.png';

type NavItemProps = {
  path: string;
  icon: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
};

const NavItem = ({ path, icon, label, isActive, onClick }: NavItemProps) => {
  const { t } = useTranslation();
  
  const renderIcon = () => {
    switch (icon) {
      case 'ChartLine': return <ChartLine className="w-5 text-center mr-3" />;
      case 'CalendarCheck': return <CalendarCheck className="w-5 text-center mr-3" />;
      case 'UserRound': return <UserRound className="w-5 text-center mr-3" />;
      case 'Stethoscope': return <Stethoscope className="w-5 text-center mr-3" />;
      case 'FileText': return <FileText className="w-5 text-center mr-3" />;
      case 'Receipt': return <Receipt className="w-5 text-center mr-3" />;
      case 'Settings': return <Settings className="w-5 text-center mr-3" />;
      default: return <ChartLine className="w-5 text-center mr-3" />;
    }
  };

  return (
    <li>
      <Link href={path}>
        <div
          className={`flex items-center p-2 rounded cursor-pointer ${isActive ? 'bg-primary text-white' : 'hover:bg-neutral-400 transition text-white'}`}
          onClick={onClick}
        >
          {renderIcon()}
          <span>{t(`sidebar.${label}`)}</span>
        </div>
      </Link>
    </li>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Close sidebar on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  // Re-open sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = user?.role === UserRole.DOCTOR ? DOCTOR_NAV_ITEMS : PATIENT_NAV_ITEMS;

  return (
    <aside className="bg-neutral-500 text-white w-full md:w-64 flex-shrink-0">
      <div className="flex md:hidden items-center justify-between p-4 border-b border-neutral-400">
        <div className="flex items-center">
          <img src={guLogoPath} alt="Gauhati University Logo" className="h-8 mr-2" />
          <span className="font-heading font-bold text-xl">{APP_NAME}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-white"
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>
      
      <div className="hidden md:flex items-center p-4 border-b border-neutral-400">
        <img src={guLogoPath} alt="Gauhati University Logo" className="h-10 mr-3" />
        <div>
          <div className="font-heading font-bold text-xl">{APP_NAME}</div>
          <div className="text-xs opacity-80">Gauhati University Hospital</div>
        </div>
      </div>
      
      <div className={`${isMobile && !isOpen ? 'hidden' : 'block'} md:block`}>
        <nav className="p-4">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
                <span className="text-white font-bold">
                  {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="font-heading text-sm">{user?.fullName || 'User'}</div>
                <div className="text-xs text-neutral-200">{user?.specialization || user?.role}</div>
              </div>
            </div>
          </div>
          
          <ul className="space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                path={item.path}
                icon={item.icon}
                label={item.label}
                isActive={location === item.path}
                onClick={() => isMobile && setIsOpen(false)}
              />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
