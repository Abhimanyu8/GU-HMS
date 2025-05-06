import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, User, Settings, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type HeaderProps = {
  title: string;
  toggleSidebar?: () => void;
};

export default function Header({ title, toggleSidebar }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage, languages } = useLanguage();

  const getLangDisplayText = (code: string) => {
    switch (code) {
      case 'en': return 'EN';
      case 'hi': return 'HI';
      case 'as': return 'AS';
      default: return code.toUpperCase();
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {toggleSidebar && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="md:hidden mr-4 text-neutral-500"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-heading font-medium text-neutral-500">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative bg-neutral-100 rounded-full p-2 text-neutral-400 hover:bg-neutral-200 transition"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent"></span>
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-1 text-neutral-400 hover:text-neutral-500"
              >
                <span>{getLangDisplayText(currentLanguage)}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)}>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center"
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user?.profileImage || ''} alt={user?.fullName || 'User'} />
                  <AvatarFallback className="bg-primary text-white">
                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium text-neutral-500 hidden sm:block">
                  {user?.fullName || 'User'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t('auth.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('auth.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('auth.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
