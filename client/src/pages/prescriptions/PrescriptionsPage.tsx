import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Search, Download, Calendar, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import PrescriptionDetails from '@/components/prescriptions/PrescriptionDetails';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';

type PrescriptionsPageProps = {
  prescriptionId?: number;
};

export default function PrescriptionsPage({ prescriptionId }: PrescriptionsPageProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(prescriptionId || null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(!!prescriptionId);
  
  const isDoctor = user?.role === UserRole.DOCTOR;

  // Get prescriptions data from API
  const { data, isLoading } = useQuery<{ prescriptions: any[] }>({
    queryKey: ['/api/prescriptions'],
  });

  // Apply search filter to prescriptions
  const filteredPrescriptions = data?.prescriptions.filter(prescription => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const patientName = prescription.patient?.fullName?.toLowerCase() || '';
      const doctorName = prescription.doctor?.fullName?.toLowerCase() || '';
      const diagnosis = prescription.diagnosis?.toLowerCase() || '';
      
      return patientName.includes(query) || doctorName.includes(query) || diagnosis.includes(query);
    }
    
    return true;
  }) || [];

  const viewPrescriptionDetails = (id: number) => {
    setSelectedPrescriptionId(id);
    setDetailsDialogOpen(true);
  };

  const closeDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedPrescriptionId(null);
    
    if (prescriptionId) {
      navigate('/prescriptions');
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('prescriptions.prescriptions')}</CardTitle>
            <CardDescription>
              {t('prescriptions.managePrescriptions')}
            </CardDescription>
          </div>
          
          {isDoctor && (
            <Button asChild>
              <Link href="/prescriptions/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('prescriptions.newPrescription')}
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
              placeholder={t('prescriptions.searchPlaceholder')}
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">{t('common.noDataFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('prescriptions.patient')}</TableHead>
                    <TableHead>{isDoctor ? t('prescriptions.date') : t('prescriptions.prescribedBy')}</TableHead>
                    <TableHead>{t('prescriptions.diagnosis')}</TableHead>
                    <TableHead>{t('prescriptions.medications')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={prescription.patient?.profileImage} alt={prescription.patient?.fullName} />
                            <AvatarFallback>
                              {prescription.patient?.fullName?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{prescription.patient?.fullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isDoctor ? (
                          prescription.prescriptionDate ? 
                            format(new Date(prescription.prescriptionDate), "PP") : 
                            "N/A"
                        ) : (
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={prescription.doctor?.profileImage} alt={prescription.doctor?.fullName} />
                              <AvatarFallback>
                                {prescription.doctor?.fullName?.charAt(0) || 'D'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{prescription.doctor?.fullName}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{prescription.diagnosis}</TableCell>
                      <TableCell>
                        {prescription.items && prescription.items.length > 0 ? (
                          <div className="max-w-[200px] truncate">
                            {prescription.items.map((item: any) => item.medicationName).join(', ')}
                          </div>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => viewPrescriptionDetails(prescription.id)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">{t('common.view')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          asChild
                        >
                          <a href={`/api/prescriptions/${prescription.id}/download`} download>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">{t('common.download')}</span>
                          </a>
                        </Button>
                        {isDoctor && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            asChild
                          >
                            <Link href={`/appointments/new?patientId=${prescription.patient?.id}`}>
                              <Calendar className="h-4 w-4" />
                              <span className="sr-only">{t('appointments.schedule')}</span>
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedPrescriptionId && (
            <PrescriptionDetails 
              prescriptionId={selectedPrescriptionId} 
              onClose={closeDetailsDialog} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
