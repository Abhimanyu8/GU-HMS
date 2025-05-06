import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, File, FileText } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { AppointmentStatus } from '@/lib/constants';

type PatientDetailsProps = {
  patientId: number;
};

export default function PatientDetails({ patientId }: PatientDetailsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('appointments');

  const { data: patientData, isLoading: isLoadingPatient } = useQuery({
    queryKey: [`/api/users/${patientId}`],
  });

  const { data: patientInfoData, isLoading: isLoadingInfo } = useQuery({
    queryKey: [`/api/patients/${patientId}/info`],
  });

  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery({
    queryKey: [`/api/appointments`, { patientId }],
  });

  const { data: prescriptionsData, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: [`/api/prescriptions`, { patientId }],
  });

  const { data: medicalFilesData, isLoading: isLoadingFiles } = useQuery({
    queryKey: [`/api/patients/${patientId}/files`],
  });

  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: [`/api/patients/${patientId}/invoices`],
  });

  const patient = patientData?.user;
  const patientInfo = patientInfoData?.patientInfo;
  const appointments = appointmentsData?.appointments || [];
  const prescriptions = prescriptionsData?.prescriptions || [];
  const medicalFiles = medicalFilesData?.files || [];
  const invoices = invoicesData?.invoices || [];

  const isLoading = isLoadingPatient || isLoadingInfo;

  if (isLoading) {
    return <div className="flex justify-center p-8">{t('common.loading')}</div>;
  }

  if (!patient) {
    return <div className="flex justify-center p-8">{t('patients.notFound')}</div>;
  }

  const calculateAge = (dateOfBirth?: Date | string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

  return (
    <div className="bg-white rounded-lg">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="font-heading font-medium text-lg">{t('patients.patientDetails')}</h2>
      </div>
      
      <div className="p-6">
        {/* Patient Profile */}
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-4 md:mb-0">
            <Avatar className="h-40 w-40 rounded-full mx-auto mb-4">
              <AvatarImage src={patient.profileImage || ''} alt={patient.fullName} />
              <AvatarFallback className="text-xl">
                {patient.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h3 className="font-heading font-medium text-xl">{patient.fullName}</h3>
              <p className="text-neutral-400 text-sm">ID: P-{patient.id}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between px-4">
                  <span className="text-neutral-400">{t('patients.age')}:</span>
                  <span>
                    {calculateAge(patient.dateOfBirth) !== null
                      ? `${calculateAge(patient.dateOfBirth)} ${t('patients.years')}`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between px-4">
                  <span className="text-neutral-400">{t('patients.gender')}:</span>
                  <span>{patient.gender ? t(`patients.${patient.gender.toLowerCase()}`) : 'N/A'}</span>
                </div>
                <div className="flex justify-between px-4">
                  <span className="text-neutral-400">{t('patients.bloodGroup')}:</span>
                  <span>{patient.bloodGroup || 'N/A'}</span>
                </div>
                <div className="flex justify-between px-4">
                  <span className="text-neutral-400">{t('patients.phone')}:</span>
                  <span>{patient.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between px-4">
                  <span className="text-neutral-400">{t('patients.email')}:</span>
                  <span className="truncate max-w-[180px]">{patient.email}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/3 md:pl-6">
            {patientInfo ? (
              <>
                <div className="border-b border-neutral-200 pb-4">
                  <h4 className="font-heading font-medium mb-2">{t('patients.medicalConditions')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {patientInfo.medicalConditions && patientInfo.medicalConditions.length > 0 ? (
                      patientInfo.medicalConditions.map((condition, index) => (
                        <Badge 
                          key={index}
                          variant={index % 3 === 0 ? "destructive" : index % 3 === 1 ? "warning" : "secondary"}
                        >
                          {condition}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-neutral-400">{t('common.noDataFound')}</span>
                    )}
                  </div>
                </div>
                
                <div className="border-b border-neutral-200 py-4">
                  <h4 className="font-heading font-medium mb-2">{t('patients.allergies')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {patientInfo.allergies && patientInfo.allergies.length > 0 ? (
                      patientInfo.allergies.map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="bg-neutral-200 text-neutral-500">
                          {allergy}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-neutral-400">{t('common.noDataFound')}</span>
                    )}
                  </div>
                </div>
                
                <div className="py-4">
                  <h4 className="font-heading font-medium mb-2">{t('patients.currentMedications')}</h4>
                  {patientInfo.currentMedications && patientInfo.currentMedications.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {patientInfo.currentMedications.map((medication, index) => (
                        <li key={index}>{medication}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-neutral-400">{t('common.noDataFound')}</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-neutral-400">
                  {t('patients.noMedicalInfo')}
                </p>
              </div>
            )}
            
            <div className="pt-4 flex justify-end">
              <Button 
                variant="outline" 
                className="mr-2" 
                asChild
              >
                <Link href={`/medical-records?patientId=${patientId}`}>
                  <FileText className="mr-1 h-4 w-4" />
                  {t('records.medicalRecords')}
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/appointments/new?patientId=${patientId}`}>
                  <Calendar className="mr-1 h-4 w-4" />
                  {t('appointments.newAppointment')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="appointments" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="appointments">{t('appointments.appointments')}</TabsTrigger>
              <TabsTrigger value="prescriptions">{t('prescriptions.prescriptions')}</TabsTrigger>
              <TabsTrigger value="testReports">{t('records.testReports')}</TabsTrigger>
              <TabsTrigger value="billing">{t('billing.billingHistory')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appointments" className="mt-4">
              {isLoadingAppointments ? (
                <div className="flex justify-center p-4">{t('common.loading')}</div>
              ) : appointments.length === 0 ? (
                <div className="flex justify-center p-4">{t('common.noDataFound')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('appointments.date')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('appointments.doctor')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('appointments.purpose')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('appointments.diagnosis')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('appointments.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.id} className="border-b border-neutral-200">
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(appointment.date), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {appointment.doctor?.fullName || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {appointment.purpose}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {appointment.notes || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {t(`appointments.${appointment.status}`)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="prescriptions" className="mt-4">
              {isLoadingPrescriptions ? (
                <div className="flex justify-center p-4">{t('common.loading')}</div>
              ) : prescriptions.length === 0 ? (
                <div className="flex justify-center p-4">{t('common.noDataFound')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('prescriptions.prescriptionDate')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('prescriptions.prescribedBy')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('prescriptions.diagnosis')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((prescription) => (
                        <tr key={prescription.id} className="border-b border-neutral-200">
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(prescription.prescriptionDate), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {prescription.doctor?.fullName || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {prescription.diagnosis || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <Link href={`/prescriptions/${prescription.id}`}>
                                  {t('common.view')}
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <a href={`/api/prescriptions/${prescription.id}/download`} download>
                                  {t('common.downloadPdf')}
                                </a>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="testReports" className="mt-4">
              {isLoadingFiles ? (
                <div className="flex justify-center p-4">{t('common.loading')}</div>
              ) : medicalFiles.length === 0 ? (
                <div className="flex justify-center p-4">{t('common.noDataFound')}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicalFiles.map((file) => (
                    <div key={file.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <File className="h-5 w-5 mr-2 text-primary" />
                        <h4 className="font-medium text-sm">{file.fileName}</h4>
                      </div>
                      <p className="text-xs text-neutral-400 mb-2">{file.description || 'No description'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-500">
                          {format(new Date(file.uploadDate), 'MMM d, yyyy')}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                        >
                          <a href={`/api/medical-files/${file.id}/download`} download>
                            {t('common.download')}
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="billing" className="mt-4">
              {isLoadingInvoices ? (
                <div className="flex justify-center p-4">{t('common.loading')}</div>
              ) : invoices.length === 0 ? (
                <div className="flex justify-center p-4">{t('common.noDataFound')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('billing.invoiceDate')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('billing.dueDate')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('billing.totalAmount')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('billing.status')}</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-neutral-200">
                          <td className="py-3 px-4 text-sm">
                            {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatINR(invoice.totalAmount)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={
                                invoice.status === 'paid' ? 'success' :
                                invoice.status === 'unpaid' ? 'warning' : 'destructive'
                              }
                            >
                              {t(`billing.${invoice.status}`)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <Link href={`/billing/${invoice.id}`}>
                                  {t('common.view')}
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <a href={`/api/invoices/${invoice.id}/download`} download>
                                  {t('common.downloadPdf')}
                                </a>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
