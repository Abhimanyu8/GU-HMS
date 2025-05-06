import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { UserRole, InvoiceStatus } from '@/lib/constants';
import { formatINR } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import InvoiceDetails from '@/components/billing/InvoiceDetails';

type BillingPageProps = {
  invoiceId?: number;
};

export default function BillingPage({ invoiceId }: BillingPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(!!invoiceId);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(invoiceId || null);
  
  const isDoctor = user?.role === UserRole.DOCTOR;

  // Get invoices data from API
  const { data, isLoading } = useQuery<{ invoices: any[] }>({
    queryKey: ['/api/invoices'],
    initialData: { invoices: [] },
  });

  // Apply filters to invoices
  const filteredInvoices = data?.invoices.filter(invoice => {
    // Status filter
    if (statusFilter !== 'all' && invoice.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = invoice.patient?.fullName?.toLowerCase() || '';
      const invoiceNumber = `#${invoice.id}`.toLowerCase();
      
      return patientName.includes(query) || invoiceNumber.includes(query);
    }
    
    return true;
  }) || [];

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

  const viewInvoiceDetails = (id: number) => {
    setSelectedInvoiceId(id);
    setDetailsDialogOpen(true);
  };

  const closeDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedInvoiceId(null);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('billing.billing')}</CardTitle>
            <CardDescription>
              {t('billing.manageBilling')}
            </CardDescription>
          </div>
          
          {isDoctor && (
            <Button asChild>
              <Link href="/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('billing.newInvoice')}
              </Link>
            </Button>
          )}
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              type="search"
              placeholder={t('billing.searchPlaceholder')}
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('billing.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value={InvoiceStatus.PAID}>{t('billing.paid')}</SelectItem>
                <SelectItem value={InvoiceStatus.UNPAID}>{t('billing.unpaid')}</SelectItem>
                <SelectItem value={InvoiceStatus.CANCELLED}>{t('billing.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">{t('common.noDataFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('billing.invoiceNumber')}</TableHead>
                    <TableHead>{t('billing.patient')}</TableHead>
                    <TableHead>{t('billing.date')}</TableHead>
                    <TableHead>{t('billing.dueDate')}</TableHead>
                    <TableHead>{t('billing.amount')}</TableHead>
                    <TableHead>{t('billing.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">#{invoice.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={invoice.patient?.profileImage} alt={invoice.patient?.fullName} />
                            <AvatarFallback>
                              {invoice.patient?.fullName?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>{invoice.patient?.fullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(invoice.invoiceDate), "PP")}</TableCell>
                      <TableCell>
                        {invoice.dueDate 
                          ? format(new Date(invoice.dueDate), "PP") 
                          : <span className="text-neutral-400">-</span>
                        }
                      </TableCell>
                      <TableCell>{formatINR(invoice.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {t(`billing.${invoice.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => viewInvoiceDetails(invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">{t('common.view')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          asChild
                        >
                          <a href={`/api/invoices/${invoice.id}/download`} download>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">{t('common.download')}</span>
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedInvoiceId && (
            <InvoiceDetails 
              invoiceId={selectedInvoiceId} 
              onClose={closeDetailsDialog} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}