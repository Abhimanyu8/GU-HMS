import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, PlusCircle, X, Download } from 'lucide-react';
import { cn, formatINR } from '@/lib/utils';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { InvoiceStatus } from '@/lib/constants';

type InvoiceGeneratorProps = {
  patientId?: number;
  appointmentId?: number;
  invoiceId?: number;
  onSuccess?: () => void;
};

export default function InvoiceGenerator({ 
  patientId, 
  appointmentId, 
  invoiceId, 
  onSuccess 
}: InvoiceGeneratorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch invoice details if editing
  const { data: invoiceData, isLoading: isLoadingInvoice } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  // Fetch patients
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users', { role: 'patient' }],
  });

  // Fetch patient's appointments
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments', { patientId }],
    enabled: !!patientId,
  });

  const formSchema = z.object({
    patientId: z.number().positive({ message: t('billing.patientRequired') }),
    appointmentId: z.number().optional(),
    dueDate: z.date({ required_error: t('billing.dueDateRequired') }),
    status: z.string().default(InvoiceStatus.UNPAID),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        description: z.string().min(2, { message: t('billing.descriptionRequired') }),
        quantity: z.number().positive({ message: t('billing.quantityRequired') }),
        unitPrice: z.number().positive({ message: t('billing.unitPriceRequired') }),
      })
    ).min(1, { message: t('billing.itemsRequired') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId,
      appointmentId,
      dueDate: addDays(new Date(), 15), // Default due date: 15 days from now
      status: InvoiceStatus.UNPAID,
      notes: '',
      items: [
        {
          description: appointmentId ? 'Consultation Fee' : '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
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

  // Load invoice data if editing
  useEffect(() => {
    if (invoiceData?.invoice) {
      const { patientId, appointmentId, dueDate, status, notes, items } = invoiceData.invoice;
      form.reset({
        patientId,
        appointmentId,
        dueDate: dueDate ? new Date(dueDate) : addDays(new Date(), 15),
        status,
        notes: notes || '',
        items: items.length > 0 ? items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) : [
          {
            description: '',
            quantity: 1,
            unitPrice: 0,
          },
        ],
      });
    }
  }, [invoiceData, form]);

  // Calculate total amount
  useEffect(() => {
    const calculateTotal = () => {
      const items = form.getValues('items');
      if (items) {
        const newTotal = items.reduce((total, item) => {
          const quantity = item.quantity || 0;
          const unitPrice = item.unitPrice || 0;
          return total + (quantity * unitPrice);
        }, 0);
        setTotalAmount(newTotal);
      }
    };

    // Initial calculation
    calculateTotal();
    
    // Subscribe to form changes
    const subscription = form.watch((value, { name }) => {
      if (name && (name.startsWith('items') || name === 'items')) {
        calculateTotal();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Format dates and add total amount
      const formattedValues = {
        ...values,
        dueDate: format(values.dueDate, 'yyyy-MM-dd'),
        totalAmount,
        items: values.items.map(item => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        })),
      };
      
      if (invoiceId) {
        return apiRequest('PATCH', `/api/invoices/${invoiceId}`, formattedValues);
      } else {
        return apiRequest('POST', '/api/invoices', formattedValues);
      }
    },
    onSuccess: (data) => {
      // Invalidate all invoice-related queries to ensure data is refreshed everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: invoiceId ? t('billing.updated') : t('billing.created'),
        description: invoiceId 
          ? t('billing.updateSuccess') 
          : t('billing.createSuccess'),
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

  const addInvoiceItem = () => {
    append({
      description: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

  const isLoading = isLoadingInvoice || isLoadingPatients || isLoadingAppointments || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient field */}
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('billing.patientDetails')}</FormLabel>
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

        {/* Appointment field (optional) */}
        {patientId && !appointmentId && (
          <FormField
            control={form.control}
            name="appointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('appointments.appointments')}</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('billing.selectAppointment')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">{t('billing.noAppointment')}</SelectItem>
                    {appointmentsData?.appointments?.map((appointment: any) => (
                      <SelectItem key={appointment.id} value={appointment.id.toString()}>
                        {format(new Date(appointment.date), 'MMM d, yyyy')} - {appointment.purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Due Date field */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('billing.dueDate')}</FormLabel>
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
                        <span>{t('billing.selectDueDate')}</span>
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

        {/* Invoice Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('billing.status')}</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('billing.selectStatus')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={InvoiceStatus.UNPAID}>{t('billing.unpaid')}</SelectItem>
                  <SelectItem value={InvoiceStatus.PAID}>{t('billing.paid')}</SelectItem>
                  <SelectItem value={InvoiceStatus.CANCELLED}>{t('billing.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
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
              <FormLabel>{t('billing.notes')}</FormLabel>
              <FormControl>
                <Textarea 
                  disabled={isLoading} 
                  placeholder={t('billing.notesPlaceholder')} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Invoice Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t('billing.items')}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInvoiceItem}
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('billing.addItem')}
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-sm font-medium">
                    {t('billing.item')} {index + 1}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>{t('billing.description')}</FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('billing.quantity')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            disabled={isLoading} 
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Unit Price */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('billing.unitPrice')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            disabled={isLoading} 
                            {...field}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total for this line */}
                  <FormItem className="md:col-span-1">
                    <FormLabel>{t('billing.totalPrice')}</FormLabel>
                    <div className="border rounded-md h-10 flex items-center px-3 bg-neutral-50">
                      {formatINR(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.unitPrice`))}
                    </div>
                  </FormItem>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Amount */}
        <div className="border-t pt-4 flex justify-end">
          <div className="w-full max-w-md">
            <div className="flex justify-between py-2">
              <span className="font-medium">{t('billing.subtotal')}:</span>
              <span>{formatINR(totalAmount)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-neutral-200">
              <span className="font-medium">{t('billing.totalAmount')}:</span>
              <span className="font-bold">{formatINR(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {invoiceId && (
            <Button 
              type="button" 
              variant="outline"
              disabled={isLoading}
              asChild
            >
              <a href={`/api/invoices/${invoiceId}/download`} download>
                <Download className="mr-2 h-4 w-4" />
                {t('common.downloadPdf')}
              </a>
            </Button>
          )}
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : invoiceId ? t('common.update') : t('common.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
