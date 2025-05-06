import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import UploadForm from '@/components/medical-records/UploadForm';

type RecordFormProps = {
  patientId: number;
  appointmentId?: number;
  recordId?: number;
  onSuccess?: () => void;
};

export default function RecordForm({ patientId, appointmentId, recordId, onSuccess }: RecordFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Fetch record details if editing
  const { data: recordData, isLoading: isLoadingRecord } = useQuery({
    queryKey: [`/api/medical-records/${recordId}`],
    enabled: !!recordId,
  });

  // Fetch patient's appointments
  const { data: appointmentsData } = useQuery({
    queryKey: ['/api/appointments', { patientId }],
    enabled: !!patientId && !appointmentId,
  });

  const formSchema = z.object({
    patientId: z.number().positive({ message: t('records.patientRequired') }),
    appointmentId: z.number().optional(),
    diagnosis: z.string().min(3, { message: t('records.diagnosisRequired') }),
    treatment: z.string().min(3, { message: t('records.treatmentRequired') }),
    notes: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId,
      appointmentId,
      diagnosis: '',
      treatment: '',
      notes: '',
    },
  });

  // Set patientId and appointmentId when provided as props
  useEffect(() => {
    if (patientId) {
      form.setValue('patientId', patientId);
    }
    if (appointmentId) {
      form.setValue('appointmentId', appointmentId);
    }
  }, [patientId, appointmentId, form]);

  // Load record data if editing
  useEffect(() => {
    if (recordData?.record) {
      const { patientId, appointmentId, diagnosis, treatment, notes, symptoms: recordSymptoms } = recordData.record;
      form.reset({
        patientId,
        appointmentId,
        diagnosis,
        treatment,
        notes: notes || '',
      });
      
      if (recordSymptoms && Array.isArray(recordSymptoms)) {
        setSymptoms(recordSymptoms);
      }
    }
  }, [recordData, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const data = {
        ...values,
        symptoms,
      };
      
      if (recordId) {
        return apiRequest('PATCH', `/api/medical-records/${recordId}`, data);
      } else {
        return apiRequest('POST', '/api/medical-records', data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-records'] });
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/medical-records`] });
      }
      
      const newRecordId = data?.record?.id || recordId;
      
      toast({
        title: recordId ? t('records.updated') : t('records.created'),
        description: recordId
          ? t('records.updateSuccess')
          : t('records.createSuccess'),
      });
      
      if (onSuccess) onSuccess();
      
      // If a new record was created and we want to show the upload form
      if (!recordId && newRecordId && !showUploadForm) {
        setShowUploadForm(true);
      }
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

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSymptom();
    }
  };

  const isLoading = isLoadingRecord || mutation.isPending;

  return (
    <div className="space-y-8">
      {!showUploadForm ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Appointment field (optional) */}
            {!appointmentId && (
              <FormField
                control={form.control}
                name="appointmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appointments.appointment')}</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('records.selectAppointment')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t('records.noAppointment')}</SelectItem>
                        {appointmentsData?.appointments?.map((appointment: any) => (
                          <SelectItem key={appointment.id} value={appointment.id.toString()}>
                            {new Date(appointment.date).toLocaleDateString()} - {appointment.purpose}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Diagnosis field */}
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('records.diagnosis')}</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Symptoms */}
            <div className="space-y-2">
              <FormLabel>{t('records.symptoms')}</FormLabel>
              <div className="flex space-x-2">
                <Input
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('records.enterSymptom')}
                  disabled={isLoading}
                />
                <Button 
                  type="button" 
                  onClick={addSymptom} 
                  disabled={isLoading || !symptomInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {symptoms.length === 0 ? (
                  <p className="text-sm text-neutral-500">{t('records.noSymptomsAdded')}</p>
                ) : (
                  symptoms.map((symptom, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {symptom}
                      <button
                        type="button"
                        onClick={() => removeSymptom(index)}
                        className="hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Treatment field */}
            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('records.treatment')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      disabled={isLoading} 
                      placeholder={t('records.treatmentPlaceholder')} 
                      className="min-h-[100px]"
                      {...field} 
                    />
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
                  <FormLabel>{t('records.notes')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      disabled={isLoading} 
                      placeholder={t('records.notesPlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : recordId ? t('common.update') : t('common.submit')}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <UploadForm 
          patientId={patientId} 
          recordId={recordId} 
          onSuccess={onSuccess} 
        />
      )}

      {!showUploadForm && recordId && (
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setShowUploadForm(true)}
          >
            {t('records.addFiles')}
          </Button>
        </div>
      )}
    </div>
  );
}
