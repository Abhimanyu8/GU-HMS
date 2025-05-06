import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, addMonths, subMonths, getDay, getDaysInMonth, isToday, isBefore, startOfToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';

type CalendarDayProps = {
  date: Date;
  isCurrentMonth: boolean;
  dayStatus: 'past' | 'today' | 'available' | 'booked';
  onClick?: () => void;
};

type Appointment = {
  id: number;
  date: string;
  time: string;
  patient: { fullName: string };
};

const CalendarDay = ({ date, isCurrentMonth, dayStatus, onClick }: CalendarDayProps) => {
  const dayClasses = {
    'calendar-day': true,
    'h-9 rounded-full flex items-center justify-center': true,
    'opacity-50 cursor-not-allowed': dayStatus === 'past',
    'bg-primary-light hover:bg-primary text-white cursor-pointer': dayStatus === 'available',
    'bg-neutral-200 text-neutral-400 cursor-not-allowed': dayStatus === 'booked',
    'bg-primary text-white': dayStatus === 'today',
    'text-neutral-300': !isCurrentMonth,
  };

  return (
    <div 
      className={cn(Object.entries(dayClasses)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join(' ')
      )}
      onClick={dayStatus !== 'past' && dayStatus !== 'booked' ? onClick : undefined}
    >
      {date.getDate()}
    </div>
  );
};

export default function Calendar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = startOfToday();

  const { data: appointmentsData } = useQuery<{ appointments: Appointment[] }>({
    queryKey: ['/api/appointments', { doctorId: user?.id, date: format(currentDate, 'yyyy-MM-dd') }],
    enabled: user?.role === UserRole.DOCTOR,
  });

  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startingDayOfWeek = getDay(firstDayOfMonth); // 0 for Sunday, 1 for Monday, etc.
    
    // Calculate days from previous month to display
    const daysFromPrevMonth = startingDayOfWeek;
    const prevMonth = subMonths(currentDate, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    
    const calendarDays = [];
    
    // Add days from previous month
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i);
      calendarDays.push({
        date,
        isCurrentMonth: false,
        dayStatus: 'past' as const
      });
    }
    
    // Get booked dates
    const bookedDates = new Set();
    appointmentsData?.appointments.forEach(appointment => {
      bookedDates.add(appointment.date);
    });
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      let dayStatus: 'past' | 'today' | 'available' | 'booked';
      
      if (isToday(date)) {
        dayStatus = 'today';
      } else if (isBefore(date, today)) {
        dayStatus = 'past';
      } else if (bookedDates.has(format(date, 'yyyy-MM-dd'))) {
        dayStatus = 'booked';
      } else {
        dayStatus = 'available';
      }
      
      calendarDays.push({
        date,
        isCurrentMonth: true,
        dayStatus
      });
    }
    
    // Fill in the rest of the calendar with days from the next month
    const daysNeeded = 42 - calendarDays.length; // 6 rows of 7 days
    const nextMonth = addMonths(currentDate, 1);
    
    for (let i = 1; i <= daysNeeded; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
      calendarDays.push({
        date,
        isCurrentMonth: false,
        dayStatus: 'available' as const
      });
    }
    
    return calendarDays;
  };

  const calendarDays = generateCalendarDays();

  // Get today's appointments
  const todaysAppointments = appointmentsData?.appointments
    .filter(appointment => appointment.date === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-neutral-200">
        <h2 className="font-heading font-medium">{t('dashboard.upcomingSchedule')}</h2>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToPreviousMonth}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-heading font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToNextMonth}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 text-center text-xs font-medium text-neutral-400 mb-2">
          <div>SU</div>
          <div>MO</div>
          <div>TU</div>
          <div>WE</div>
          <div>TH</div>
          <div>FR</div>
          <div>SA</div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-sm">
          {calendarDays.map((day, index) => (
            <CalendarDay
              key={index}
              date={day.date}
              isCurrentMonth={day.isCurrentMonth}
              dayStatus={day.dayStatus}
            />
          ))}
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2">{t('sidebar.todaysSchedule')}</h4>
          
          <div className="space-y-2">
            {todaysAppointments && todaysAppointments.length > 0 ? (
              todaysAppointments.map((appointment) => (
                <div key={appointment.id} className="p-2 bg-neutral-100 rounded flex items-center">
                  <div className="bg-primary w-1.5 h-1.5 rounded-full mr-2"></div>
                  <span className="text-xs font-medium">{appointment.time}</span>
                  <span className="text-xs text-neutral-400 ml-2">{appointment.patient?.fullName}</span>
                </div>
              ))
            ) : (
              <div className="p-2 bg-neutral-100 rounded text-center">
                <span className="text-xs text-neutral-400">{t('common.noDataFound')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
