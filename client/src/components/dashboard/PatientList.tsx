import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PatientCard from '@/components/dashboard/PatientCard';
import { Link } from 'wouter';

type PatientListProps = {
  limit?: number;
  showAll?: boolean;
};

export default function PatientList({ limit, showAll = false }: PatientListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery<{ users: any[] }>({
    queryKey: ['/api/users', { role: 'patient' }],
  });

  const filteredPatients = data?.users.filter(patient => 
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const displayPatients = limit && !showAll 
    ? filteredPatients.slice(0, limit) 
    : filteredPatients;

  // Process patient data to include additional fields needed by PatientCard
  const processedPatients = displayPatients.map(patient => {
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="font-heading font-medium">{t('dashboard.recentPatients')}</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder={t('common.search')}
              className="pl-8 pr-4 py-2 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
          {showAll ? (
            <Button
              variant="link"
              className="text-primary text-sm font-medium"
              asChild
            >
              <Link href="/patients/new">{t('patients.newPatient')}</Link>
            </Button>
          ) : (
            <Button
              variant="link"
              className="text-primary text-sm font-medium"
              asChild
            >
              <Link href="/patients">{t('common.viewAll')}</Link>
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">{t('common.loading')}</div>
        ) : processedPatients.length === 0 ? (
          <div className="text-center py-8">{t('common.noDataFound')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processedPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
