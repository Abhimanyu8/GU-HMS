import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PrescriptionForm from '@/components/prescriptions/PrescriptionForm';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';

export default function CreatePrescriptionPage() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  // Extract patientId from URL if present
  const params = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
  const patientId = params.get('patientId') ? parseInt(params.get('patientId')!) : undefined;
  
  // Check if user is a doctor
  const isDoctor = user?.role === UserRole.DOCTOR;
  
  useEffect(() => {
    // Redirect if not a doctor
    if (!isDoctor) {
      navigate('/prescriptions');
    }
  }, [isDoctor, navigate]);
  
  const handleSuccess = () => {
    navigate('/prescriptions');
  };

  if (!isDoctor) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/prescriptions')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle>{t('prescriptions.newPrescription')}</CardTitle>
              <CardDescription>
                {t('prescriptions.createNewPrescription')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('prescriptions.prescriptionDetails')}</CardTitle>
          <CardDescription>
            {t('prescriptions.fillPrescriptionDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrescriptionForm patientId={patientId} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </>
  );
}
