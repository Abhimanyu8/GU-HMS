import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X } from 'lucide-react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UploadFormProps = {
  patientId: number;
  recordId?: number;
  onSuccess?: () => void;
};

export default function UploadForm({ patientId, recordId, onSuccess }: UploadFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formSchema = z.object({
    fileType: z.string().min(1, { message: t('records.fileTypeRequired') }),
    description: z.string().min(3, { message: t('records.descriptionRequired') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileType: '',
      description: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    // Clear the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!selectedFile) {
        throw new Error(t('records.fileRequired'));
      }

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patientId', patientId.toString());
      formData.append('fileType', values.fileType);
      formData.append('description', values.description);
      
      if (recordId) {
        formData.append('recordId', recordId.toString());
      }

      // Use fetch directly for FormData
      const response = await fetch('/api/medical-files', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload file');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/files`] });
      if (recordId) {
        queryClient.invalidateQueries({ queryKey: [`/api/medical-records/${recordId}`] });
      }
      
      toast({
        title: t('records.uploadSuccess'),
        description: t('records.fileUploaded'),
      });
      
      form.reset();
      setSelectedFile(null);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <FormLabel htmlFor="file-upload">{t('records.uploadFiles')}</FormLabel>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            {!selectedFile ? (
              <>
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-1">{t('records.dragAndDrop')}</p>
                <p className="text-xs text-gray-400 mb-4">{t('records.fileFormats')}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {t('records.selectFile')}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={mutation.isPending}
                />
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <File className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearSelectedFile}
                  disabled={mutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {form.formState.errors.root?.message && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>

        {/* File Type */}
        <FormField
          control={form.control}
          name="fileType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('records.fileType')}</FormLabel>
              <Select
                disabled={mutation.isPending}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('records.selectFileType')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="report">Medical Report</SelectItem>
                  <SelectItem value="labResult">Lab Result</SelectItem>
                  <SelectItem value="xray">X-Ray</SelectItem>
                  <SelectItem value="scan">Scan</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('records.description')}</FormLabel>
              <FormControl>
                <Textarea 
                  disabled={mutation.isPending} 
                  placeholder={t('records.descriptionPlaceholder')} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || !selectedFile}>
            {mutation.isPending ? t('common.uploading') : t('records.upload')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
