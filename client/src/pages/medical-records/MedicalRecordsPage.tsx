import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText, Eye, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import RecordForm from '@/components/medical-records/RecordForm';

type MedicalRecordsPageProps = {
  patientId?: number;
};

export default function MedicalRecordsPage({ patientId }: MedicalRecordsPageProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState<string>(patientId ? patientId.toString() : '');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  
  const isDoctor = user?.role === UserRole.DOCTOR;

  // Extract patient id from URL if present and not already set
  useEffect(() => {
    if (!patientId) {
      const params = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
      const urlPatientId = params.get('patientId');
      if (urlPatientId) {
        setPatientFilter(urlPatientId);
      }
    }
  }, [location, patientId]);

  // Get patients data for filter
  const { data: patientsData } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users', { role: 'patient' }],
  });

  // Get medical records data
  const { data: recordsData, isLoading } = useQuery<{ records: any[] }>({
    queryKey: ['/api/medical-records', { patientId: patientFilter ? parseInt(patientFilter) : undefined }],
  });

  // Apply search filter to records
  const filteredRecords = recordsData?.records.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const diagnosis = record.diagnosis?.toLowerCase() || '';
      const treatment = record.treatment?.toLowerCase() || '';
      const patientName = record.patient?.fullName?.toLowerCase() || '';
      
      return diagnosis.includes(query) || treatment.includes(query) || patientName.includes(query);
    }
    
    return true;
  }) || [];

  const openCreateRecordDialog = () => {
    setSelectedRecord(null);
    setFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedRecord(null);
  };

  const confirmDelete = (recordId: number) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      // Here we would add the actual delete API call
      // await apiRequest('DELETE', `/api/medical-records/${recordToDelete}`);
      
      toast({
        title: t('records.deleted'),
        description: t('records.deleteSuccess'),
      });
      
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      
      // Refresh records list (this would be done with queryClient.invalidateQueries)
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('records.medicalRecords')}</CardTitle>
            <CardDescription>
              {t('records.manageRecords')}
            </CardDescription>
          </div>
          
          {isDoctor && (
            <Button onClick={openCreateRecordDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t('records.newRecord')}
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
              placeholder={t('records.searchPlaceholder')}
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <Select
              value={patientFilter}
              onValueChange={setPatientFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('records.filterByPatient')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {patientsData?.users.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">{t('common.noDataFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('records.patient')}</TableHead>
                    <TableHead>{t('records.date')}</TableHead>
                    <TableHead>{t('records.diagnosis')}</TableHead>
                    <TableHead>{t('records.symptoms')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={record.patient?.profileImage} alt={record.patient?.fullName} />
                            <AvatarFallback>
                              {record.patient?.fullName?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{record.patient?.fullName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.createdAt && format(new Date(record.createdAt), "PPP")}
                      </TableCell>
                      <TableCell>{record.diagnosis}</TableCell>
                      <TableCell>
                        {record.symptoms && record.symptoms.length > 0 ? (
                          <div className="max-w-[200px] truncate">
                            {record.symptoms.join(', ')}
                          </div>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          asChild
                        >
                          <Link href={`/patients/${record.patientId}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{t('common.view')}</span>
                          </Link>
                        </Button>
                        {isDoctor && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedRecord(record.id);
                                setFormDialogOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">{t('common.edit')}</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDelete(record.id)}
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">{t('common.delete')}</span>
                            </Button>
                          </>
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

      {/* Create/Edit Record Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? t('records.editRecord') : t('records.newRecord')}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord ? t('records.editRecordDesc') : t('records.createRecordDesc')}
            </DialogDescription>
          </DialogHeader>
          <RecordForm 
            patientId={patientFilter ? parseInt(patientFilter) : undefined} 
            recordId={selectedRecord || undefined}
            onSuccess={closeFormDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('records.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('records.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}