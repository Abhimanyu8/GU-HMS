import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MoreVertical, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'wouter';

type PatientCardProps = {
  patient: {
    id: number;
    fullName: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    profileImage?: string;
    medicalConditions?: string[];
    lastVisit?: string;
    nextAppointment?: string;
  };
  withActions?: boolean;
};

export default function PatientCard({ patient, withActions = true }: PatientCardProps) {
  const { t } = useTranslation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="border border-neutral-200 rounded-lg h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex">
            <Avatar className="h-12 w-12 rounded-full mr-3">
              <AvatarImage src={patient.profileImage || ''} alt={patient.fullName} />
              <AvatarFallback>
                {patient.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{patient.fullName}</div>
              <div className="text-xs text-neutral-400 mt-1">
                {patient.age && <span>{patient.age} {t('patients.years')} • </span>}
                {patient.gender && <span>{t(`patients.${patient.gender.toLowerCase()}`)} • </span>}
                {patient.bloodGroup && <span>{patient.bloodGroup}</span>}
              </div>
              <div className="flex flex-wrap items-center mt-2 gap-2">
                {patient.medicalConditions && patient.medicalConditions.length > 0 ? (
                  patient.medicalConditions.slice(0, 2).map((condition, index) => (
                    <Badge 
                      key={index} 
                      variant={index === 0 ? "default" : "secondary"} 
                      className={index === 0 ? "bg-primary-light text-white" : "bg-neutral-200 text-neutral-500"}
                    >
                      {condition}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="bg-neutral-200 text-neutral-500">
                    {t('patients.noConditions')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {withActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-500">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href={`/patients/${patient.id}`}>
                    {t('common.view')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/appointments/new?patientId=${patient.id}`}>
                    {t('appointments.newAppointment')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/prescriptions/new?patientId=${patient.id}`}>
                    {t('prescriptions.newPrescription')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="mt-4 flex justify-between text-sm">
          <div>
            <div className="text-neutral-400">{t('patients.lastVisit')}</div>
            <div className="font-medium">{formatDate(patient.lastVisit)}</div>
          </div>
          <div>
            <div className="text-neutral-400">{t('patients.nextAppointment')}</div>
            <div className="font-medium">{formatDate(patient.nextAppointment)}</div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button 
            variant="link" 
            className="text-primary text-sm font-medium p-0 flex items-center"
            asChild
          >
            <Link href={`/medical-records?patientId=${patient.id}`}>
              <FileText className="mr-1 h-4 w-4" />
              {t('patients.viewRecords')}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/appointments/new?patientId=${patient.id}`}>
              {t('dashboard.schedule')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
