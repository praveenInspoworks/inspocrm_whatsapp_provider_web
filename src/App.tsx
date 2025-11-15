import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AILoadingSpinner } from "@/components/ui/ai-loading-spinner";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { SessionTimeoutWarning } from "@/components/ui/session-timeout-warning";
import CRMLayout from "./pages/CRMLayout";
import ContactManagement from "./components/crm/contacts";
import LoginForm from "./components/auth/LoginForm";
import TenantLoginForm from "./components/auth/TenantLoginForm";
import MemberLoginForm from "./components/auth/MemberLoginForm";
import { ResetPasswordForm } from "./components/auth/ResetPasswordForm";
import { ChangePasswordForm } from "./components/auth/ChangePasswordForm";
import { TenantSignupForm } from "./components/auth/TenantSignupForm";
import { EmailVerificationForm } from "./components/auth/EmailVerificationForm";
import { SetPasswordForm } from "./components/auth/SetPasswordForm";
import { CompanyProfileSetup } from "./components/onboarding/CompanyProfileSetup";
import { BillingSetupForm } from "./components/onboarding/BillingSetupForm";
import ListValueComponent from "./components/masters/ListValueComponent";

import CompanyManagement from "./components/masters/companies";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

import WhatsAppAutoReplyAnalytics from "./components/whatsapp/WhatsAppAutoReplyAnalytics";
import { WhatsAppBusinessSetup } from "./components/whatsapp/WhatsAppBusinessSetup";
import { WhatsAppCredentialsManager } from "./components/whatsapp/WhatsAppCredentialsManager";
import { WhatsAppCampaignDashboard } from "./components/whatsapp/WhatsAppCampaignDashboard";
import { WhatsAppTemplateList } from "./components/whatsapp/WhatsAppTemplateList";
import UserProfilePage from "./components/auth/UserProfilePage";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import WhatsAppTemplateCreator from "./components/whatsapp/WhatsAppTemplateCreator";
import WhatsAppAnalyticsDashboard from "./components/whatsapp/WhatsAppAnalyticsDashboard";
import WhatsAppWebhookMessages from "./components/whatsapp/WhatsAppWebhookMessages";
import { WhatsAppApiGuide } from "./components/whatsapp/WhatsAppApiGuide";
import TeamManagement from "./components/crm/team";

// Placeholder components for routes that need to be created
const Dashboard = () => <WhatsAppCampaignDashboard />;
const WhatsAppAccounts = () => <WhatsAppCredentialsManager />;
const WhatsAppTemplates = () => <WhatsAppTemplateList />;
const Campaigns = () => <WhatsAppCampaignDashboard />;
const Contacts = () => <ContactManagement />;
const Companies = () => <CompanyManagement />;
const Analytics = () => <WhatsAppAutoReplyAnalytics />;
const Settings = () => <div>Settings - Coming Soon</div>;

const queryClient = new QueryClient();

// Admin Role-based Protection for Team Members
const AdminProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();

  // Check if user has admin role
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ADMINISTRATOR');

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Session Timeout Component - Only active for authenticated users
const SessionTimeoutManager = () => {
  const { user } = useAuth();
  const { showWarning, remainingTime, extendSession } = useSessionTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes
    promptBefore: 5 * 60 * 1000, // Show warning 5 minutes before timeout
  });

  // Only show session timeout for authenticated users
  if (!user) return null;

  return (
    <SessionTimeoutWarning
      isVisible={showWarning}
      remainingTime={remainingTime}
      onExtend={extendSession}
      onLogout={() => {
        // The useSessionTimeout hook will handle the logout automatically
        console.log('User chose to logout now');
      }}
    />
  );
};

const App = () => {
  useEffect(() => {
    document.title = "INSPOCRM";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {/* Session Timeout Manager */}
              <SessionTimeoutManager />
              <Routes>
                {/* Authentication Routes */}
                <Route path="/login" element={<TenantLoginForm />} />
                <Route path="/member/login" element={<MemberLoginForm />} />
                <Route path="/signup" element={<TenantSignupForm />} />
                <Route path="/verify-email" element={<EmailVerificationForm />} />
                <Route path="/set-password" element={<SetPasswordForm />} />
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                <Route path="/reset-password" element={<ResetPasswordForm />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Public Routes - Member Invitation Flow */}
                <Route path="/member-invite" element={<EmailVerificationForm />} />

                {/* Main WhatsApp Provider Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <CRMLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Dashboard */}
                  <Route index element={<ProtectedRoute><WhatsAppAnalyticsDashboard /></ProtectedRoute>} />

                  {/* WhatsApp Management */}
                  <Route path="whatsapp/accounts" element={<ProtectedRoute><WhatsAppAccounts /></ProtectedRoute>} />
                  <Route path="whatsapp/templates" element={<ProtectedRoute><WhatsAppTemplateCreator /></ProtectedRoute>} />
                  <Route path="whatsapp/templates/list" element={<ProtectedRoute><WhatsAppTemplateList /></ProtectedRoute>} />
                  <Route path="whatsapp/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
                  <Route path="whatsapp/credentials" element={<ProtectedRoute><WhatsAppCredentialsManager /></ProtectedRoute>} />
                  <Route path="whatsapp/webhook-messages" element={<ProtectedRoute><WhatsAppWebhookMessages /></ProtectedRoute>} />
                  <Route path="whatsapp/api-guide" element={<ProtectedRoute><WhatsAppApiGuide /></ProtectedRoute>} />
                  <Route path="whatsapp/setup" element={<ProtectedRoute><WhatsAppBusinessSetup /></ProtectedRoute>} />

                  {/* Campaign Management */}
                  <Route path="campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />

                  {/* Contact & Company Management */}
                  <Route path="contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                  <Route path="companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />

                  {/* Analytics & Reporting */}
                  <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="analytics/whatsapp" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

                  {/* Settings & Administration */}
                  <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                  {/* Team Management */}
                  <Route path="team/members" element={<ProtectedRoute><AdminProtectedRoute><TeamManagement /></AdminProtectedRoute></ProtectedRoute>} />

                  {/* Masters - List Values Management */}
                  <Route path="masters/list-values" element={<ProtectedRoute><AdminProtectedRoute><ListValueComponent /></AdminProtectedRoute></ProtectedRoute>} />

                  {/* User Profile & Account */}
                  <Route path="profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
                  <Route path="change-password" element={<ProtectedRoute><ChangePasswordForm /></ProtectedRoute>} />

                  {/* Tenant Onboarding Routes */}
                  <Route path="company-profile" element={<ProtectedRoute><CompanyProfileSetup /></ProtectedRoute>} />
                  <Route path="billing" element={<ProtectedRoute><BillingSetupForm /></ProtectedRoute>} />

                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
