import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import PatientDetails from '@/components/patients/PatientDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PatientDetailsPageProps = {
  patientId: number;
};

export default function PatientDetailsPage({ patientId }: PatientDetailsPageProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/users/${patientId}`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-20" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
              <Skeleton className="h-40 w-40 rounded-full" />
              <div className="mt-4 space-y-2 w-full max-w-[200px]">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="md:w-2/3 md:pl-6 space-y-6">
              <div className="border-b pb-4">
                <Skeleton className="h-5 w-40 mb-3" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-28 rounded-full" />
                </div>
              </div>
              <div className="border-b py-4">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
              <div className="py-4">
                <Skeleton className="h-5 w-48 mb-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('common.error')}</AlertTitle>
        <AlertDescription>
          {t('patients.notFound')}
        </AlertDescription>
      </Alert>
    );
  }

  const patient = data.user;

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/patients')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle>{patient.fullName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('patients.patientId')}: P-{patient.id}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href={`/patients/${patientId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </a>
          </Button>
        </CardHeader>
      </Card>

      <PatientDetails patientId={patientId} />
    </>
  );
}
