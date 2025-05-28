import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, Calendar, User, Stethoscope, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PrescriptionDetailsProps = {
  prescriptionId: number;
  onClose?: () => void;
};

export default function PrescriptionDetails({ prescriptionId, onClose }: PrescriptionDetailsProps) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/prescriptions/${prescriptionId}`],
  });

  const prescription = data?.prescription;

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        {t('common.loading')}
      </div>
    );
  }

  if (!prescription) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('prescriptions.notFound')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle>{t('prescriptions.prescriptionDetails')}</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          asChild
        >
          <a href={`/api/prescriptions/${prescriptionId}/download`} download>
            <Download className="h-4 w-4 mr-2" />
            {t('common.downloadPdf')}
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('prescriptions.prescriptionDate')}:</span>
                <span>
                  {prescription.prescriptionDate ? 
                    format(new Date(prescription.prescriptionDate), 'PPP') : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('prescriptions.prescribedFor')}:</span>
                <span>{prescription.patient?.fullName || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Stethoscope className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('prescriptions.prescribedBy')}:</span>
                <span>{prescription.doctor?.fullName || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-2">
              {prescription.expiryDate && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('prescriptions.expiryDate')}:</span>
                  <span>
                    {prescription.expiryDate ? 
                      format(new Date(prescription.expiryDate), 'PPP') : 
                      'N/A'
                    }
                  </span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('prescriptions.diagnosis')}:</span>
                <span>{prescription.diagnosis}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">{t('prescriptions.medication')}</h3>
            
            {prescription.items && prescription.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('prescriptions.medication')}</TableHead>
                    <TableHead>{t('prescriptions.dosage')}</TableHead>
                    <TableHead>{t('prescriptions.frequency')}</TableHead>
                    <TableHead>{t('prescriptions.duration')}</TableHead>
                    <TableHead>{t('prescriptions.instructions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescription.items.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.medicationName}</TableCell>
                      <TableCell>{item.dosage}</TableCell>
                      <TableCell>{item.frequency}</TableCell>
                      <TableCell>{item.duration}</TableCell>
                      <TableCell>{item.instructions || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-neutral-500">{t('prescriptions.noMedicationsAdded')}</p>
            )}
          </div>

          {prescription.notes && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">{t('prescriptions.notes')}</h3>
              <p className="text-sm text-neutral-700">{prescription.notes}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button 
              variant="outline"
              onClick={onClose}
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
