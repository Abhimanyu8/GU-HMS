import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { 
  CalendarPlus, 
  UserPlus, 
  Stethoscope, 
  Receipt, 
  FileText, 
  FileImage, 
  File, 
  Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/constants';

type QuickAccessProps = {
  className?: string;
};

type MedicalFile = {
  id: number;
  fileName: string;
  fileType: string;
  description: string;
  uploadDate: string;
  patientId: number;
  patient?: { fullName: string };
};

export default function QuickAccess({ className }: QuickAccessProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { data: filesData } = useQuery<{ files: MedicalFile[] }>({
    queryKey: ['/api/medical-files/recent'],
    enabled: !!user?.id,
  });
  
  const recentFiles = filesData?.files?.slice(0, 3) || [];
  
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <File className="text-error" />;
      case 'image':
        return <FileImage className="text-primary" />;
      default:
        return <FileText className="text-secondary" />;
    }
  };
  
  return (
    <Card className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-4 py-3 border-b border-neutral-200">
        <h2 className="font-heading font-medium">{t('dashboard.quickAccess')}</h2>
      </div>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/appointments/new">
            <div className="bg-neutral-100 p-4 rounded-lg text-center hover:bg-neutral-200 transition block cursor-pointer">
              <div className="bg-primary bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <CalendarPlus className="text-primary" />
              </div>
              <span className="text-sm font-medium">{t('dashboard.newAppointment')}</span>
            </div>
          </Link>
          
          {user?.role === UserRole.DOCTOR && (
            <Link href="/patients/new">
              <div className="bg-neutral-100 p-4 rounded-lg text-center hover:bg-neutral-200 transition block cursor-pointer">
                <div className="bg-secondary bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <UserPlus className="text-secondary" />
                </div>
                <span className="text-sm font-medium">{t('dashboard.addPatient')}</span>
              </div>
            </Link>
          )}
          
          {user?.role === UserRole.DOCTOR && (
            <Link href="/prescriptions/new">
              <div className="bg-neutral-100 p-4 rounded-lg text-center hover:bg-neutral-200 transition block cursor-pointer">
                <div className="bg-info bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Stethoscope className="text-info" />
                </div>
                <span className="text-sm font-medium">{t('dashboard.createPrescription')}</span>
              </div>
            </Link>
          )}
          
          {user?.role === UserRole.DOCTOR && (
            <Link href="/billing/new">
              <div className="bg-neutral-100 p-4 rounded-lg text-center hover:bg-neutral-200 transition block cursor-pointer">
                <div className="bg-warning bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Receipt className="text-warning" />
                </div>
                <span className="text-sm font-medium">{t('dashboard.generateInvoice')}</span>
              </div>
            </Link>
          )}
          
          {user?.role === UserRole.PATIENT && (
            <>
              <Link href="/prescriptions">
                <div className="bg-neutral-100 p-4 rounded-lg text-center hover:bg-neutral-200 transition block cursor-pointer">
                  <div className="bg-info bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Stethoscope className="text-info" />
                  </div>
                  <span className="text-sm font-medium">{t('prescriptions.prescriptions')}</span>
                </div>
              </Link>
              
              <Link href="/medical-records">
                <div className="bg-neutral-100 p-4 rounded-lg text-center hover:bg-neutral-200 transition block cursor-pointer">
                  <div className="bg-warning bg-opacity-20 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileText className="text-warning" />
                  </div>
                  <span className="text-sm font-medium">{t('records.medicalRecords')}</span>
                </div>
              </Link>
            </>
          )}
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">{t('dashboard.recentReports')}</h3>
          
          {recentFiles.length === 0 ? (
            <div className="p-3 text-center text-neutral-400 text-sm">
              {t('common.noDataFound')}
            </div>
          ) : (
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div key={file.id} className="border border-neutral-200 rounded p-3 flex items-center">
                  <div className={`p-2 rounded ${file.fileType === 'pdf' ? 'bg-error bg-opacity-10' : 'bg-primary bg-opacity-10'}`}>
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium">{file.fileName}</div>
                    <div className="text-xs text-neutral-400">
                      {file.patient?.fullName} • {format(new Date(file.uploadDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-neutral-400 hover:text-neutral-500" 
                    asChild
                  >
                    <a href={`/api/medical-files/${file.id}/download`} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
