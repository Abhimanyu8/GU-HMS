import { useTranslation } from 'react-i18next';
import { 
  CalendarDays, 
  UserPlus, 
  ClipboardList, 
  Users, 
  ArrowUp, 
  ArrowDown, 
  ChartLine 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  type: 'appointments' | 'patients' | 'reports' | 'totalPatients';
  value: number;
  change?: { value: number; isPositive: boolean };
  suffix?: string;
};

export default function StatCard({ type, value, change, suffix }: StatCardProps) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'appointments':
        return <CalendarDays className="text-primary" />;
      case 'patients':
        return <UserPlus className="text-secondary" />;
      case 'reports':
        return <ClipboardList className="text-warning" />;
      case 'totalPatients':
        return <Users className="text-info" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'appointments':
        return t('dashboard.todaysAppointments');
      case 'patients':
        return t('dashboard.newPatients');
      case 'reports':
        return t('dashboard.pendingReports');
      case 'totalPatients':
        return t('dashboard.totalPatients');
    }
  };

  const getChangeSuffix = () => {
    switch (type) {
      case 'appointments':
        return t('dashboard.fromLastWeek');
      case 'patients':
        return t('dashboard.fromLastMonth');
      case 'reports':
        return t('dashboard.needUrgentReview');
      case 'totalPatients':
        return t('dashboard.lifetimePatients');
    }
  };

  let bgColorClass = '';
  let textColorClass = '';
  
  switch (type) {
    case 'appointments':
      bgColorClass = 'bg-primary-light bg-opacity-20';
      textColorClass = 'text-primary';
      break;
    case 'patients':
      bgColorClass = 'bg-secondary-light bg-opacity-20';
      textColorClass = 'text-secondary';
      break;
    case 'reports':
      bgColorClass = 'bg-warning bg-opacity-20';
      textColorClass = 'text-warning';
      break;
    case 'totalPatients':
      bgColorClass = 'bg-info bg-opacity-20';
      textColorClass = 'text-info';
      break;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-neutral-400 text-sm">{getTitle()}</div>
          <div className="text-2xl font-heading font-medium mt-1">{value}</div>
        </div>
        <div className={cn("p-3 rounded-full", bgColorClass)}>
          {getIcon()}
        </div>
      </div>
      <div className="flex items-center mt-3 text-sm">
        {change ? (
          <>
            <span className={cn("mr-1", change.isPositive ? "text-success" : "text-error")}>
              {change.isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </span>
            <span className={cn("font-medium", change.isPositive ? "text-success" : "text-error")}>
              {change.isPositive ? '+' : ''}{change.value}{suffix}
            </span>
          </>
        ) : (
          <span className={cn("mr-1", textColorClass)}><ChartLine className="h-4 w-4" /></span>
        )}
        <span className="text-neutral-400 ml-1">{getChangeSuffix()}</span>
      </div>
    </div>
  );
}
