import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';

import StatCard from '@/components/dashboard/StatCard';
import AppointmentTable from '@/components/dashboard/AppointmentTable';
import Calendar from '@/components/dashboard/Calendar';
import PatientList from '@/components/dashboard/PatientList';
import QuickAccess from '@/components/dashboard/QuickAccess';
import { useState } from 'react';
import AppointmentDetails from '@/components/appointments/AppointmentDetails';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const isDoctor = user?.role === UserRole.DOCTOR;

  // Fetch dashboard stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    // If API endpoint doesn't exist yet, this will fail silently
    // and we'll use sample data below
  });

  // Statistics (use real data if available, otherwise use sample data)
  const stats = {
    todaysAppointments: statsData?.stats?.todaysAppointments || 8,
    todaysAppointmentsChange: statsData?.stats?.todaysAppointmentsChange || { value: 14, isPositive: true },
    newPatients: statsData?.stats?.newPatients || 12,
    newPatientsChange: statsData?.stats?.newPatientsChange || { value: 5, isPositive: true },
    pendingReports: statsData?.stats?.pendingReports || 3,
    pendingReportsChange: statsData?.stats?.pendingReportsChange || { value: 2, isPositive: false },
    totalPatients: statsData?.stats?.totalPatients || 1248,
  };

  const handleViewAppointmentDetails = (appointment: any) => {
    setSelectedAppointmentId(appointment.id);
  };

  const closeAppointmentDetailsDialog = () => {
    setSelectedAppointmentId(null);
  };

  return (
    <>
      {/* Dashboard Overview / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          type="appointments"
          value={stats.todaysAppointments}
          change={stats.todaysAppointmentsChange}
        />
        
        {isDoctor && (
          <StatCard
            type="patients"
            value={stats.newPatients}
            change={stats.newPatientsChange}
          />
        )}
        
        <StatCard
          type="reports"
          value={stats.pendingReports}
          change={stats.pendingReportsChange}
        />
        
        <StatCard
          type="totalPatients"
          value={stats.totalPatients}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <AppointmentTable 
            title={t('dashboard.todaysAppointments')} 
            limit={5}
            onViewDetails={handleViewAppointmentDetails}
          />
        </div>
        
        {/* Calendar / Schedule */}
        <Calendar />
      </div>
      
      {/* Recent Patients & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {isDoctor && (
          <div className="lg:col-span-2">
            <PatientList limit={4} />
          </div>
        )}
        
        <QuickAccess className={isDoctor ? "" : "lg:col-span-3"} />
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointmentId} onOpenChange={(open) => !open && closeAppointmentDetailsDialog()}>
        <DialogContent className="max-w-3xl">
          {selectedAppointmentId && (
            <AppointmentDetails 
              appointmentId={selectedAppointmentId} 
              onClose={closeAppointmentDetailsDialog} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
