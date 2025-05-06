import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import InvoiceGenerator from '@/components/billing/InvoiceGenerator';

export default function NewInvoicePage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation('/billing');
  };

  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => setLocation('/billing')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('billing.newInvoice')}</CardTitle>
          <CardDescription>
            {t('billing.fillDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceGenerator onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </>
  );
}