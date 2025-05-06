import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, Calendar, User, FileText, Receipt } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { InvoiceStatus } from '@/lib/constants';

type InvoiceDetailsProps = {
  invoiceId: number;
  onClose?: () => void;
};

export default function InvoiceDetails({ invoiceId, onClose }: InvoiceDetailsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
  });

  const invoice = data?.invoice;

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest('PATCH', `/api/invoices/${invoiceId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      toast({
        title: t('billing.statusUpdated'),
        description: t('billing.statusUpdateSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.UNPAID:
        return 'warning';
      case InvoiceStatus.CANCELLED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        {t('common.loading')}
      </div>
    );
  }

  if (!invoice) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t('billing.notFound')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle>{t('billing.invoiceDetails')}</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          asChild
        >
          <a href={`/api/invoices/${invoiceId}/download`} download>
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
                <Receipt className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('billing.invoiceNumber')}:</span>
                <span>#{invoice.id}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('billing.invoiceDate')}:</span>
                <span>{invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'PPP') : '-'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('billing.dueDate')}:</span>
                <span>{invoice.dueDate ? format(new Date(invoice.dueDate), 'PPP') : '-'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium mr-2">{t('billing.patient')}:</span>
                <span>{invoice.patient?.fullName || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm justify-between">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-neutral-500" />
                  <span className="font-medium mr-2">{t('billing.status')}:</span>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {t(`billing.${invoice.status}`)}
                  </Badge>
                </div>
                <Select
                  defaultValue={invoice.status}
                  onValueChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="w-[120px] h-7 text-xs">
                    <SelectValue placeholder={t('billing.changeStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={InvoiceStatus.PAID}>{t('billing.paid')}</SelectItem>
                    <SelectItem value={InvoiceStatus.UNPAID}>{t('billing.unpaid')}</SelectItem>
                    <SelectItem value={InvoiceStatus.CANCELLED}>{t('billing.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">{t('billing.items')}</h3>
            
            {invoice.items && invoice.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('billing.description')}</TableHead>
                    <TableHead className="text-right">{t('billing.quantity')}</TableHead>
                    <TableHead className="text-right">{t('billing.unitPrice')}</TableHead>
                    <TableHead className="text-right">{t('billing.totalPrice')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatINR(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatINR(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      {t('billing.totalAmount')}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatINR(invoice.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-neutral-500">{t('billing.noItemsAdded')}</p>
            )}
          </div>

          {invoice.notes && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">{t('billing.notes')}</h3>
              <p className="text-sm text-neutral-700">{invoice.notes}</p>
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
