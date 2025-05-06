import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile form schema
  const profileFormSchema = z.object({
    fullName: z.string().min(2, { message: t('settings.fullNameRequired') }),
    email: z.string().email({ message: t('settings.validEmailRequired') }),
    phone: z.string().optional(),
    specialization: z.string().optional(),
  });

  // Security form schema
  const securityFormSchema = z.object({
    currentPassword: z.string().min(1, { message: t('settings.currentPasswordRequired') }),
    newPassword: z.string().min(8, { message: t('settings.passwordMinLength') }),
    confirmPassword: z.string().min(8, { message: t('settings.passwordMinLength') }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('settings.passwordsMustMatch'),
    path: ['confirmPassword'],
  });

  // Notification preferences schema
  const notificationSchema = z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    appointmentReminders: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
  });

  // Initialize profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      specialization: user?.specialization || '',
    },
  });

  // Initialize security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Initialize notification form
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      marketingEmails: false,
    },
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      return apiRequest('PATCH', `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      toast({
        title: t('settings.profileUpdated'),
        description: t('settings.profileUpdateSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof securityFormSchema>) => {
      return apiRequest('POST', '/api/auth/change-password', {
        userId: user?.id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: t('settings.passwordUpdated'),
        description: t('settings.passwordUpdateSuccess'),
      });
      securityForm.reset();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  // Notification preferences update mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      return apiRequest('PATCH', `/api/users/${user?.id}/notifications`, data);
    },
    onSuccess: () => {
      toast({
        title: t('settings.preferencesUpdated'),
        description: t('settings.preferencesUpdateSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    setIsUpdating(true);
    profileMutation.mutate(data);
  };

  // Handle security form submission
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    setIsUpdating(true);
    passwordMutation.mutate(data);
  };

  // Handle notification form submission
  const onNotificationSubmit = (data: z.infer<typeof notificationSchema>) => {
    setIsUpdating(true);
    notificationMutation.mutate(data);
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    changeLanguage(language);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('settings.settings')}</CardTitle>
          <CardDescription>
            {t('settings.manageSettings')}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{t('settings.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="language">{t('settings.language')}</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profileInformation')}</CardTitle>
              <CardDescription>
                {t('settings.profileDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                  <AvatarFallback className="text-lg">
                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{user?.fullName}</h3>
                  <p className="text-sm text-neutral-500">{user?.role}</p>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.fullName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.email')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.phone')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {user?.role === 'doctor' && (
                    <FormField
                      control={profileForm.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.specialization')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={isUpdating || !profileForm.formState.isDirty}
                  >
                    {isUpdating ? t('common.saving') : t('common.save')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security')}</CardTitle>
              <CardDescription>
                {t('settings.securityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.currentPassword')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.newPassword')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.confirmPassword')}</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                  >
                    {isUpdating ? t('common.updating') : t('settings.updatePassword')}
                  </Button>
                </form>
              </Form>
              
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">{t('settings.accountActions')}</h3>
                <Button 
                  variant="destructive" 
                  onClick={logout}
                >
                  {t('auth.logout')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.notificationPreferences')}</CardTitle>
              <CardDescription>
                {t('settings.notificationsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t('settings.emailNotifications')}
                          </FormLabel>
                          <FormDescription>
                            {t('settings.emailNotificationsDesc')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="smsNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t('settings.smsNotifications')}
                          </FormLabel>
                          <FormDescription>
                            {t('settings.smsNotificationsDesc')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="appointmentReminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t('settings.appointmentReminders')}
                          </FormLabel>
                          <FormDescription>
                            {t('settings.appointmentRemindersDesc')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t('settings.marketingEmails')}
                          </FormLabel>
                          <FormDescription>
                            {t('settings.marketingEmailsDesc')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                  >
                    {isUpdating ? t('common.saving') : t('common.save')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Language Tab */}
        <TabsContent value="language">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language')}</CardTitle>
              <CardDescription>
                {t('settings.languageDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <FormLabel>{t('settings.selectLanguage')}</FormLabel>
                  <Select
                    value={currentLanguage}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('settings.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}