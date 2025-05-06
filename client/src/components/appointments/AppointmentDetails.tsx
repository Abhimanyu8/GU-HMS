import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  NotebookPen, 
  FileText, 
  UserRound,
  Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { AppointmentStatus } from '@/lib/constants';
import { Link } from 'wouter';

type AppointmentDetailsProps = {
  appointmentId: number;
  onClose?: () => void;
};

export default function AppointmentDetails({ appointmentId, onClose }: AppointmentDetailsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'complete' | 'cancel' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [`/api/appointments/${appointmentId}`],
  });

  const appointment = data?.appointment;

  // Initialize notes when appointment data is loaded
  useState(() => {
    if (appointment?.notes) {
      setNotes(appointment.notes);
    }
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ status, updatedNotes }: { status?: string; updatedNotes?: string }) => {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (updatedNotes !== undefined) updateData.notes = updatedNotes;
      
      return apiRequest('PATCH', `/api/appointments/${appointmentId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      if (actionType) {
        toast({
          title: actionType === 'complete' 
            ? t('appointments.completed') 
            : t('appointments.cancelled'),
          description: actionType === 'complete'
            ? t('appointments.completedSuccess')
            : t('appointments.cancelledSuccess'),
        });
        setIsConfirmDialogOpen(false);
        setActionType(null);
      } else {
        toast({
          title: t('appointments.updated'),
          description: t('appointments.notesUpdated'),
        });
        setIsEditingNotes(false);
      }
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSaveNotes = () => {
    updateAppointmentMutation.mutate({ updatedNotes: notes });
  };

  const handleStatusChange = (status: AppointmentStatus) => {
    setActionType(status === AppointmentStatus.COMPLETED ? 'complete' : 'cancel');
    setIsConfirmDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (!actionType) return;
    
    const status = actionType === 'complete' 
      ? AppointmentStatus.COMPLETED 
      : AppointmentStatus.CANCELLED;
      
    updateAppointmentMutation.mutate({ status });
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        {t('common.loading')}
      </div>
    );
  }

  if (!appointment) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('appointments.notFound')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <div>{t('appointments.appointmentDetails')}</div>
            <Badge variant={getStatusBadgeVariant(appointment.status)}>
              {t(`appointments.${appointment.status}`)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('appointments.date')}:</span>
                  <span>{format(new Date(appointment.date), 'PPP')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('appointments.time')}:</span>
                  <span>{appointment.time}</span>
                </div>
                <div className="flex items-center text-sm">
                  <UserRound className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('appointments.patient')}:</span>
                  <Link href={`/patients/${appointment.patient?.id}`} className="text-primary hover:underline">
                    {appointment.patient?.fullName || 'N/A'}
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Stethoscope className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('appointments.doctor')}:</span>
                  <span>{appointment.doctor?.fullName || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <NotebookPen className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('appointments.purpose')}:</span>
                  <span>{appointment.purpose}</span>
                </div>
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('appointments.duration')}:</span>
                  <span>{appointment.duration || 30} {t('appointments.minutes')}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">{t('appointments.notes')}</h3>
                {!isEditingNotes && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditingNotes(true)}
                    disabled={appointment.status !== AppointmentStatus.PENDING}
                  >
                    {t('common.edit')}
                  </Button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotes(appointment.notes || '');
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={updateAppointmentMutation.isPending}
                    >
                      {updateAppointmentMutation.isPending ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-700 min-h-[50px]">
                  {appointment.notes || t('appointments.noNotes')}
                </p>
              )}
            </div>
            
            {appointment.status === AppointmentStatus.PENDING && (
              <div className="flex justify-end space-x-2 border-t pt-4">
                <Button 
                  variant="outline"
                  onClick={() => handleStatusChange(AppointmentStatus.CANCELLED)}
                  disabled={updateAppointmentMutation.isPending}
                >
                  {t('appointments.cancelAppointment')}
                </Button>
                <Button 
                  onClick={() => handleStatusChange(AppointmentStatus.COMPLETED)}
                  disabled={updateAppointmentMutation.isPending}
                >
                  {t('appointments.completeAppointment')}
                </Button>
              </div>
            )}

            {(appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) && (
              <div className="flex justify-end space-x-2 border-t pt-4">
                <Button 
                  variant="outline"
                  onClick={onClose}
                >
                  {t('common.close')}
                </Button>
                <Button 
                  variant="outline"
                  asChild
                >
                  <Link href={`/prescriptions/new?patientId=${appointment.patient?.id}`}>
                    {t('prescriptions.createPrescription')}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'complete' 
                ? t('appointments.confirmComplete') 
                : t('appointments.confirmCancel')}
            </DialogTitle>
          </DialogHeader>
          
          <p>
            {actionType === 'complete'
              ? t('appointments.completeConfirmMessage')
              : t('appointments.cancelConfirmMessage')}
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant={actionType === 'cancel' ? 'destructive' : 'default'}
              onClick={confirmStatusChange}
              disabled={updateAppointmentMutation.isPending}
            >
              {updateAppointmentMutation.isPending 
                ? t('common.loading') 
                : actionType === 'complete' 
                  ? t('appointments.complete') 
                  : t('appointments.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
