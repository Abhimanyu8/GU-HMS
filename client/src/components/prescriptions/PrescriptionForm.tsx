import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { CalendarIcon, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MEDICATION_FREQUENCIES, MEDICATION_DURATIONS } from '@/lib/constants';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

type PrescriptionFormProps = {
  patientId?: number;
  prescriptionId?: number;
  onSuccess?: () => void;
};

export default function PrescriptionForm({ patientId, prescriptionId, onSuccess }: PrescriptionFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch prescription details if editing
  const { data: prescriptionData, isLoading: isLoadingPrescription } = useQuery({
    queryKey: [`/api/prescriptions/${prescriptionId}`],
    enabled: !!prescriptionId,
  });

  // Fetch patients
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users', { role: 'patient' }],
  });

  const formSchema = z.object({
    patientId: z.number().positive({ message: t('prescriptions.patientRequired') }),
    diagnosis: z.string().min(3, { message: t('prescriptions.diagnosisRequired') }),
    expiryDate: z.date().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        medicationName: z.string().min(2, { message: t('prescriptions.medicationRequired') }),
        dosage: z.string().min(1, { message: t('prescriptions.dosageRequired') }),
        frequency: z.string().min(1, { message: t('prescriptions.frequencyRequired') }),
        duration: z.string().min(1, { message: t('prescriptions.durationRequired') }),
        instructions: z.string().optional(),
      })
    ).min(1, { message: t('prescriptions.itemsRequired') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: patientId,
      diagnosis: '',
      expiryDate: addDays(new Date(), 30), // Default expiry: 30 days
      notes: '',
      items: [
        {
          medicationName: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Set patientId when provided as prop
  useEffect(() => {
    if (patientId) {
      form.setValue('patientId', patientId);
    }
  }, [patientId, form]);

  // Load prescription data if editing
  useEffect(() => {
    if (prescriptionData?.prescription) {
      const { patientId, diagnosis, expiryDate, notes, items } = prescriptionData.prescription;
      form.reset({
        patientId,
        diagnosis,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        notes: notes || '',
        items: items.length > 0 ? items.map(item => ({
          medicationName: item.medicationName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions || '',
        })) : [
          {
            medicationName: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
          },
        ],
      });
    }
  }, [prescriptionData, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Format dates
      const formattedValues = {
        ...values,
        expiryDate: values.expiryDate ? format(values.expiryDate, 'yyyy-MM-dd') : undefined,
      };
      
      if (prescriptionId) {
        return apiRequest('PATCH', `/api/prescriptions/${prescriptionId}`, formattedValues);
      } else {
        return apiRequest('POST', '/api/prescriptions', formattedValues);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      toast({
        title: prescriptionId ? t('prescriptions.updated') : t('prescriptions.created'),
        description: prescriptionId
          ? t('prescriptions.updateSuccess')
          : t('prescriptions.createSuccess'),
      });
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

  const addMedicationItem = () => {
    append({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
  };

  const isLoading = isLoadingPrescription || isLoadingPatients || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient field */}
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('prescriptions.prescribedFor')}</FormLabel>
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

        {/* Diagnosis field */}
        <FormField
          control={form.control}
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('prescriptions.diagnosis')}</FormLabel>
              <FormControl>
                <Input disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expiry Date field */}
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('prescriptions.expiryDate')}</FormLabel>
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
                        <span>{t('prescriptions.selectExpiryDate')}</span>
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              <FormLabel>{t('prescriptions.notes')}</FormLabel>
              <FormControl>
                <Textarea 
                  disabled={isLoading} 
                  placeholder={t('prescriptions.notesPlaceholder')} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Medication Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t('prescriptions.medication')}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMedicationItem}
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('prescriptions.addMedication')}
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-medium">
                    {t('prescriptions.medicationItem')} {index + 1}
                  </h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Medication Name */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.medicationName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('prescriptions.medication')}</FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dosage */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.dosage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('prescriptions.dosage')}</FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Frequency */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.frequency`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('prescriptions.frequency')}</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('prescriptions.selectFrequency')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MEDICATION_FREQUENCIES.map((frequency) => (
                              <SelectItem key={frequency} value={frequency}>
                                {frequency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Duration */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.duration`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('prescriptions.duration')}</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('prescriptions.selectDuration')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MEDICATION_DURATIONS.map((duration) => (
                              <SelectItem key={duration} value={duration}>
                                {duration}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Instructions */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.instructions`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t('prescriptions.instructions')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            disabled={isLoading} 
                            placeholder={t('prescriptions.instructionsPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : prescriptionId ? t('common.update') : t('common.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
