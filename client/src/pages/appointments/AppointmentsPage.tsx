import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { AppointmentStatus } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import AppointmentForm from '@/components/appointments/AppointmentForm';
import AppointmentDetails from '@/components/appointments/AppointmentDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

type AppointmentsPageProps = {
  isCreating?: boolean;
};

export default function AppointmentsPage({ isCreating = false }: AppointmentsPageProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(isCreating);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Get appointments data from API
  const { data, isLoading } = useQuery<{ appointments: any[] }>({
    queryKey: ['/api/appointments'],
  });

  // Apply filters to appointments
  const filteredAppointments = data?.appointments.filter(appointment => {
    // Status filter
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Date filter
    if (dateFilter && format(new Date(appointment.date), 'yyyy-MM-dd') !== format(dateFilter, 'yyyy-MM-dd')) {
      return false;
    }
    
    // Search filter (search in patient name, doctor name, or purpose)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = appointment.patient?.fullName?.toLowerCase() || '';
      const doctorName = appointment.doctor?.fullName?.toLowerCase() || '';
      const purpose = appointment.purpose?.toLowerCase() || '';
      
      return patientName.includes(query) || doctorName.includes(query) || purpose.includes(query);
    }
    
    return true;
  }) || [];

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

  const closeFormDialog = () => {
    setFormDialogOpen(false);
    if (isCreating) {
      navigate('/appointments');
    }
  };

  const viewAppointmentDetails = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setDetailsDialogOpen(true);
  };

  const closeDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedAppointmentId(null);
  };

  // Group appointments by date for the Timeline view
  const appointmentsByDate = filteredAppointments.reduce((acc, appointment) => {
    const date = appointment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort dates for timeline
  const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('appointments.appointments')}</CardTitle>
            <CardDescription>
              {t('appointments.manageAppointments')}
            </CardDescription>
          </div>
          
          <Button onClick={() => setFormDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('appointments.newAppointment')}
          </Button>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              type="search"
              placeholder={t('appointments.searchPlaceholder')}
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-fit justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : t('appointments.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4 text-neutral-400" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('appointments.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value={AppointmentStatus.PENDING}>{t('appointments.pending')}</SelectItem>
                  <SelectItem value={AppointmentStatus.COMPLETED}>{t('appointments.completed')}</SelectItem>
                  <SelectItem value={AppointmentStatus.CANCELLED}>{t('appointments.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="table" className="px-4">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
            <TabsTrigger value="table">
              <div className="flex items-center">
                <div className="i-lucide-table mr-1 h-4 w-4" />
                {t('appointments.tableView')}
              </div>
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {t('appointments.timelineView')}
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="table">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-8">{t('common.loading')}</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-8">{t('common.noDataFound')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('appointments.patient')}</TableHead>
                        <TableHead>{t('appointments.doctor')}</TableHead>
                        <TableHead>{t('appointments.date')}</TableHead>
                        <TableHead>{t('appointments.time')}</TableHead>
                        <TableHead>{t('appointments.purpose')}</TableHead>
                        <TableHead>{t('appointments.status')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={appointment.patient?.profileImage} alt={appointment.patient?.fullName} />
                                <AvatarFallback>
                                  {appointment.patient?.fullName?.charAt(0) || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{appointment.patient?.fullName}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{appointment.doctor?.fullName}</TableCell>
                          <TableCell>{format(new Date(appointment.date), "PP")}</TableCell>
                          <TableCell>{appointment.time}</TableCell>
                          <TableCell>{appointment.purpose}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {t(`appointments.${appointment.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewAppointmentDetails(appointment.id)}
                            >
                              {t('common.view')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </TabsContent>
          
          <TabsContent value="timeline">
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">{t('common.loading')}</div>
              ) : sortedDates.length === 0 ? (
                <div className="text-center py-8">{t('common.noDataFound')}</div>
              ) : (
                <div className="space-y-8">
                  {sortedDates.map((date) => (
                    <div key={date}>
                      <h3 className="text-lg font-medium mb-4">
                        {format(new Date(date), "PPPP")}
                      </h3>
                      <div className="space-y-4">
                        {appointmentsByDate[date].sort((a, b) => 
                          a.time.localeCompare(b.time)
                        ).map((appointment) => (
                          <div 
                            key={appointment.id} 
                            className="flex items-start border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => viewAppointmentDetails(appointment.id)}
                          >
                            <div className="flex-shrink-0 mr-4">
                              <div className="bg-primary-light text-white rounded-full w-10 h-10 flex items-center justify-center font-medium">
                                {appointment.time.substring(0, 2)}
                              </div>
                              <div className="text-xs text-center mt-1">{appointment.time}</div>
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{appointment.purpose}</h4>
                                <Badge variant={getStatusBadgeVariant(appointment.status)}>
                                  {t(`appointments.${appointment.status}`)}
                                </Badge>
                              </div>
                              <div className="flex items-center mt-2 text-sm text-gray-600">
                                <div className="flex items-center mr-4">
                                  <Avatar className="h-6 w-6 mr-1">
                                    <AvatarImage src={appointment.patient?.profileImage} alt={appointment.patient?.fullName} />
                                    <AvatarFallback>
                                      {appointment.patient?.fullName?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{appointment.patient?.fullName}</span>
                                </div>
                                <div>
                                  <span className="font-medium">{t('appointments.doctor')}:</span> {appointment.doctor?.fullName}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* New Appointment Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>{t('appointments.newAppointment')}</CardTitle>
              <CardDescription>
                {t('appointments.fillDetails')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentForm onSuccess={closeFormDialog} />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedAppointmentId && (
            <AppointmentDetails 
              appointmentId={selectedAppointmentId} 
              onClose={closeDetailsDialog} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
