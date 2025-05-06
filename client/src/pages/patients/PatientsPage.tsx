import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Search, Plus, UserRound, Calendar, FileText, Pencil, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PatientCard from '@/components/dashboard/PatientCard';

export default function PatientsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);

  const isDoctor = user?.role === UserRole.DOCTOR;

  const { data, isLoading } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users', { role: 'patient' }],
  });

  const filteredPatients = data?.users.filter(patient => 
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Process patient data 
  const processedPatients = filteredPatients.map(patient => {
    // Calculate age if date of birth exists
    let age;
    if (patient.dateOfBirth) {
      const dob = new Date(patient.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const isBirthdayPassed = today.getMonth() > dob.getMonth() || 
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
      if (!isBirthdayPassed) {
        age--;
      }
    }

    return {
      ...patient,
      age,
      // We'll mock these for now until we implement the real data fetching
      lastVisit: undefined,
      nextAppointment: undefined,
      medicalConditions: []
    };
  });

  const confirmDelete = (patientId: number) => {
    setPatientToDelete(patientId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;
    
    try {
      // Here we would add the actual delete API call
      // await apiRequest('DELETE', `/api/users/${patientToDelete}`);
      
      toast({
        title: t('patients.deleted'),
        description: t('patients.deleteSuccess'),
      });
      
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
      
      // Refresh patients list (this would be done with queryClient.invalidateQueries)
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
            <CardTitle>{t('patients.patients')}</CardTitle>
            <CardDescription>
              {t('patients.managePatients')}
            </CardDescription>
          </div>
          
          {isDoctor && (
            <Button asChild>
              <Link href="/patients/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('patients.newPatient')}
              </Link>
            </Button>
          )}
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              type="search"
              placeholder={t('patients.searchPlaceholder')}
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="grid" className="w-full max-w-[200px]" onValueChange={(value) => setViewMode(value as 'grid' | 'table')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">
                <div className="flex items-center">
                  <div className="i-lucide-grid-3x3 mr-1 h-4 w-4" />
                  {t('common.grid')}
                </div>
              </TabsTrigger>
              <TabsTrigger value="table">
                <div className="flex items-center">
                  <div className="i-lucide-list mr-1 h-4 w-4" />
                  {t('common.list')}
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : processedPatients.length === 0 ? (
            <div className="text-center py-8">{t('common.noDataFound')}</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">{t('patients.name')}</TableHead>
                    <TableHead className="w-[80px]">{t('patients.age')}</TableHead>
                    <TableHead className="w-[100px]">{t('patients.gender')}</TableHead>
                    <TableHead className="w-[120px]">{t('patients.phone')}</TableHead>
                    <TableHead className="w-[150px]">{t('patients.email')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={patient.profileImage || ''} alt={patient.fullName} />
                            <AvatarFallback>
                              {patient.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{patient.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{patient.age || '-'}</TableCell>
                      <TableCell>{patient.gender ? t(`patients.${patient.gender.toLowerCase()}`) : '-'}</TableCell>
                      <TableCell>{patient.phone || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{patient.email}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <div className="i-lucide-more-horizontal h-4 w-4" />
                              <span className="sr-only">{t('common.actions')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/patients/${patient.id}`}>
                                <UserRound className="mr-2 h-4 w-4" />
                                {t('common.view')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/appointments/new?patientId=${patient.id}`}>
                                <Calendar className="mr-2 h-4 w-4" />
                                {t('appointments.newAppointment')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/medical-records?patientId=${patient.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                {t('records.medicalRecords')}
                              </Link>
                            </DropdownMenuItem>
                            {isDoctor && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/patients/${patient.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t('common.edit')}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => confirmDelete(patient.id)}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('patients.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('patients.deleteWarning')}
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
