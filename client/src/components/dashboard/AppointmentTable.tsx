import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Play, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AppointmentStatus } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

import type { Appointment } from '@shared/schema';

type AppointmentWithUser = Appointment & {
  patient: { id: number; fullName: string; profileImage?: string };
  doctor: { id: number; fullName: string; specialization?: string };
};

type AppointmentTableProps = {
  title: string;
  showViewAll?: boolean;
  limit?: number;
  onViewDetails?: (appointment: AppointmentWithUser) => void;
};

export default function AppointmentTable({ 
  title, 
  showViewAll = true, 
  limit,
  onViewDetails 
}: AppointmentTableProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithUser | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'start' | 'cancel' | null>(null);

  const { data, isLoading } = useQuery<{ appointments: AppointmentWithUser[] }>({
    queryKey: ['/api/appointments'],
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setIsConfirmDialogOpen(false);
      
      toast({
        title: t('common.success'),
        description: actionType === 'start' 
          ? t('appointments.startedSuccessfully') 
          : t('appointments.cancelledSuccessfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleStartAppointment = (appointment: AppointmentWithUser) => {
    setSelectedAppointment(appointment);
    setActionType('start');
    setIsConfirmDialogOpen(true);
  };

  const handleCancelAppointment = (appointment: AppointmentWithUser) => {
    setSelectedAppointment(appointment);
    setActionType('cancel');
    setIsConfirmDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedAppointment || !actionType) return;
    
    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      status: actionType === 'start' ? AppointmentStatus.COMPLETED : AppointmentStatus.CANCELLED
    });
  };

  const appointments = limit && data?.appointments 
    ? data.appointments.slice(0, limit) 
    : data?.appointments || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'warning';
      case AppointmentStatus.COMPLETED:
        return 'success';
      case AppointmentStatus.CANCELLED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-heading font-medium">{title}</h2>
          {showViewAll && (
            <div className="flex items-center">
              <Button variant="link" className="text-primary text-sm font-medium p-0">
                {t('common.viewAll')}
              </Button>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 text-center">{t('common.loading')}</div>
          ) : appointments.length === 0 ? (
            <div className="p-4 text-center">{t('common.noDataFound')}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">
                    {t('appointments.patient')}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">
                    {t('appointments.time')}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">
                    {t('appointments.purpose')}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">
                    {t('appointments.status')}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appointment => (
                  <tr key={appointment.id} className="border-b border-neutral-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 rounded-full mr-3">
                          <AvatarImage 
                            src={appointment.patient?.profileImage || ''} 
                            alt={appointment.patient?.fullName || 'Patient'} 
                          />
                          <AvatarFallback>
                            {appointment.patient?.fullName?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{appointment.patient.fullName}</div>
                          <div className="text-xs text-neutral-400">ID: P-{appointment.patient.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{appointment.time}</td>
                    <td className="py-3 px-4 text-sm">{appointment.purpose}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(appointment.status)}>
                        {t(`appointments.${appointment.status}`)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-primary hover:text-primary-dark"
                          onClick={() => onViewDetails?.(appointment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {appointment.status === AppointmentStatus.PENDING && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-secondary hover:text-secondary-dark"
                              onClick={() => handleStartAppointment(appointment)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-error hover:text-error-dark"
                              onClick={() => handleCancelAppointment(appointment)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              {actionType === 'start' 
                ? t('appointments.confirmStart') 
                : t('appointments.confirmCancel')}
            </h2>
            <p className="mb-6">
              {actionType === 'start'
                ? t('appointments.startConfirmMessage')
                : t('appointments.cancelConfirmMessage')}
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant={actionType === 'cancel' ? 'destructive' : 'default'}
                onClick={confirmAction}
                disabled={updateAppointmentMutation.isPending}
              >
                {updateAppointmentMutation.isPending 
                  ? t('common.loading') 
                  : actionType === 'start' 
                    ? t('appointments.startAppointment') 
                    : t('appointments.cancelAppointment')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
