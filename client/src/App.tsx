import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./lib/i18n"; // Import i18n configuration

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import PatientsPage from "@/pages/patients/PatientsPage";
import PatientDetailsPage from "@/pages/patients/PatientDetailsPage";
import AppointmentsPage from "@/pages/appointments/AppointmentsPage";
import PrescriptionsPage from "@/pages/prescriptions/PrescriptionsPage";
import CreatePrescriptionPage from "@/pages/prescriptions/CreatePrescriptionPage";
import MedicalRecordsPage from "@/pages/medical-records/MedicalRecordsPage";
import BillingPage from "@/pages/billing/BillingPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import NotFound from "@/pages/not-found";
import NewPatientPage from "@/pages/patients/NewPatientPage";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import AuthLayout from "@/components/layout/AuthLayout";

// Private Route component
const PrivateRoute = ({ component: Component, ...rest }: any) => {
  const isAuthenticated = !!localStorage.getItem("user");
  if (!isAuthenticated) {
    return <Route path="/login" />;
  }
  return <Component {...rest} />;
};

function App() {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize language from localStorage or use default
    const savedLang = localStorage.getItem("language");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
    setLoading(false);
  }, [i18n]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Switch>
              {/* Public Routes */}
              <Route path="/login">
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </Route>

              {/* Protected Routes */}
              <Route path="/">
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </Route>
              <Route path="/dashboard">
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </Route>
              <Route path="/patients">
                <MainLayout>
                  <PatientsPage />
                </MainLayout>
              </Route>
              <Route path="/patients/new">
                <MainLayout>
                  <NewPatientPage />
                </MainLayout>
              </Route>
              <Route path="/patients/:id">
                {(params) => (
                  <MainLayout>
                    <PatientDetailsPage patientId={parseInt(params.id)} />
                  </MainLayout>
                )}
              </Route>
              <Route path="/appointments">
                <MainLayout>
                  <AppointmentsPage />
                </MainLayout>
              </Route>
              <Route path="/appointments/new">
                <MainLayout>
                  <AppointmentsPage isCreating={true} />
                </MainLayout>
              </Route>
              <Route path="/prescriptions">
                <MainLayout>
                  <PrescriptionsPage />
                </MainLayout>
              </Route>
              <Route path="/prescriptions/new">
                <MainLayout>
                  <CreatePrescriptionPage />
                </MainLayout>
              </Route>
              <Route path="/prescriptions/:id">
                {(params) => (
                  <MainLayout>
                    <PrescriptionsPage prescriptionId={parseInt(params.id)} />
                  </MainLayout>
                )}
              </Route>
              <Route path="/medical-records">
                <MainLayout>
                  <MedicalRecordsPage />
                </MainLayout>
              </Route>
              <Route path="/billing">
                <MainLayout>
                  <BillingPage />
                </MainLayout>
              </Route>
              <Route path="/billing/:id">
                {(params) => (
                  <MainLayout>
                    <BillingPage invoiceId={parseInt(params.id)} />
                  </MainLayout>
                )}
              </Route>
              <Route path="/settings">
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </Route>

              {/* Fallback to 404 */}
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
