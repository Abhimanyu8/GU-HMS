import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isBefore, startOfToday, parse } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type AppointmentFormProps = {
  patientId?: number;
  doctorId?: number;
  appointmentId?: number;
  onSuccess?: () => void;
};

export default function AppointmentForm({ patientId, doctorId, appointmentId, onSuccess }: AppointmentFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  // Fetch appointment details if editing
  const { data: appointmentData, isLoading: isLoadingAppointment } = useQuery({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId,
  });

  // Fetch doctors
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users', { role: 'doctor' }],
    enabled: !doctorId || user?.role === UserRole.PATIENT,
  });

  // Fetch patients (only for doctors)
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users', { role: 'patient' }],
    enabled: user?.role === UserRole.DOCTOR,
  });

  const formSchema = z.object({
    patientId: z.number().positive({ message: t('appointments.selectPatient') }),
    doctorId: z.number().positive({ message: t('appointments.selectDoctor') }),
    date: z.date({ required_error: t('appointments.selectDate') })
      .refine(date => !isBefore(date, startOfToday()), {
        message: t('appointments.pastDateError'),
      }),
    time: z.string().min(1, { message: t('appointments.selectTime') }),
    purpose: z.string().min(3, { message: t('appointments.purposeRequired') }),
    notes: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: patientId || (user?.role === UserRole.PATIENT ? user.id : undefined),
      doctorId: doctorId || (user?.role === UserRole.DOCTOR ? user.id : undefined),
      purpose: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (patientId) {
      form.setValue('patientId', patientId);
    }
    if (doctorId) {
      form.setValue('doctorId', doctorId);
    }
  }, [patientId, doctorId, form]);

  // Load appointment data if editing
  useEffect(() => {
    if (appointmentData?.appointment) {
      const { patientId, doctorId, date, time, purpose, notes } = appointmentData.appointment;
      form.reset({
        patientId,
        doctorId,
        date: new Date(date),
        time,
        purpose,
        notes: notes || '',
      });
    }
  }, [appointmentData, form]);

  // Load available time slots when doctor or date changes
  const selectedDoctorId = form.watch('doctorId');
  const selectedDate = form.watch('date');

  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!selectedDoctorId || !selectedDate) return;
      
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/doctors/${selectedDoctorId}/available-slots?date=${formattedDate}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch available time slots');
        }
        
        const data = await response.json();
        setAvailableTimeSlots(data.availableSlots || []);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setAvailableTimeSlots([]);
        
        // Fallback time slots (8 AM to 5 PM, every 30 minutes)
        const fallbackSlots = [];
        for (let hour = 8; hour < 17; hour++) {
          fallbackSlots.push(`${hour.toString().padStart(2, '0')}:00`);
          fallbackSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        setAvailableTimeSlots(fallbackSlots);
      }
    };
    
    fetchAvailableTimeSlots();
  }, [selectedDoctorId, selectedDate]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Format the date to string (YYYY-MM-DD)
      const formattedValues = {
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
      };
      
      if (appointmentId) {
        return apiRequest('PATCH', `/api/appointments/${appointmentId}`, formattedValues);
      } else {
        return apiRequest('POST', '/api/appointments', formattedValues);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: appointmentId ? t('appointments.updated') : t('appointments.created'),
        description: appointmentId 
          ? t('appointments.updateSuccess') 
          : t('appointments.createSuccess'),
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  const isLoading = isLoadingAppointment || isLoadingDoctors || isLoadingPatients || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient field - only shown to doctors */}
        {user?.role === UserRole.DOCTOR && (
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('appointments.patient')}</FormLabel>
                <Select
                  disabled={isLoading || !!patientId}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('appointments.selectPatient')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patientsData?.users?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Doctor field - shown when doctor is not pre-selected or user is patient */}
        {(!doctorId || user?.role === UserRole.PATIENT) && (
          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('appointments.doctor')}</FormLabel>
                <Select
                  disabled={isLoading || !!doctorId}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('appointments.selectDoctor')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctorsData?.users?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.fullName} {doctor.specialization ? `(${doctor.specialization})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Date field */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('appointments.date')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t('appointments.selectDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => 
                      isBefore(date, startOfToday()) || 
                      date.getDay() === 0 || // Disable Sundays
                      date.getDay() === 6    // Disable Saturdays
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time field */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('appointments.time')}</FormLabel>
              <Select
                disabled={isLoading || !selectedDoctorId || !selectedDate}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('appointments.selectTime')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTimeSlots.map((timeSlot) => (
                    <SelectItem key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Purpose field */}
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('appointments.purpose')}</FormLabel>
              <FormControl>
                <Input disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('appointments.notes')}</FormLabel>
              <FormControl>
                <Textarea 
                  disabled={isLoading} 
                  placeholder={t('appointments.notesPlaceholder')} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : appointmentId ? t('common.update') : t('common.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
