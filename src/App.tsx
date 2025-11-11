import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useMenuAccess } from "@/hooks/useMenuAccess";
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
import RoleManager from "./components/roles/RoleManager";
import ListValueComponent from "./components/masters/ListValueComponent";
import MenuManagement from "./components/masters/MenuManagement";
import MenuItemManagement from "./components/masters/MenuItemManagement";
import CompanyManagement from "./components/masters/companies";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import WhatsAppAutoReplyManager from "./components/whatsapp/WhatsAppAutoReplyManager";
import WhatsAppConversations from "./components/whatsapp/WhatsAppConversations";
import WhatsAppAutoReplyAnalytics from "./components/whatsapp/WhatsAppAutoReplyAnalytics";
import { WhatsAppBusinessSetup } from "./components/whatsapp/WhatsAppBusinessSetup";
import { WhatsAppCredentialsManager } from "./components/whatsapp/WhatsAppCredentialsManager";
import { IndividualAIWhatsAppGenerator } from "./components/whatsapp/IndividualAIWhatsAppGenerator";
import { WhatsAppCampaignDashboard } from "./components/whatsapp/WhatsAppCampaignDashboard";
import { WhatsAppTemplateList } from "./components/whatsapp/WhatsAppTemplateList";
import UserProfilePage from "./components/auth/UserProfilePage";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import WhatsAppTemplateCreator from "./components/whatsapp/WhatsAppTemplateCreator";
import WhatsAppAnalyticsDashboard from "./components/whatsapp/WhatsAppAnalyticsDashboard";

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

const MenuProtectedRoute: React.FC<{
  children: React.ReactNode;
  menuItemCode: string;
}> = ({ children, menuItemCode }) => {
  const { hasMenuAccess, isLoading, error, refreshAccess } = useMenuAccess();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><AILoadingSpinner size="lg" /></div>;
  }

  // Handle access denied error
  if (error === 'ACCESS_DENIED') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <button
              onClick={refreshAccess}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle network errors
  if (error && (error.includes('Network') || error.includes('connection'))) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">
            Unable to verify your access permissions. Please check your internet connection and try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={refreshAccess}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasMenuAccess(menuItemCode)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const PermissionProtectedRoute: React.FC<{
  children: React.ReactNode;
  permissionCode: string;
}> = ({ children, permissionCode }) => {
  const { hasPermission, isLoading, error, refreshAccess } = useMenuAccess();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><AILoadingSpinner size="lg" /></div>;
  }

  // Handle access denied error
  if (error === 'ACCESS_DENIED') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <button
              onClick={refreshAccess}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle network errors
  if (error && (error.includes('Network') || error.includes('connection'))) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">
            Unable to verify your access permissions. Please check your internet connection and try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={refreshAccess}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission(permissionCode)) {
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
                  <Route index element={<MenuProtectedRoute menuItemCode="DASHBOARD"><WhatsAppAnalyticsDashboard /></MenuProtectedRoute>} />

                  {/* WhatsApp Management */}
                  <Route path="whatsapp/accounts" element={<MenuProtectedRoute menuItemCode="WHATSAPP_ACCOUNTS"><WhatsAppAccounts /></MenuProtectedRoute>} />
                  <Route path="whatsapp/templates" element={<MenuProtectedRoute menuItemCode="WHATSAPP_TEMPLATES"><WhatsAppTemplateCreator /></MenuProtectedRoute>} />
                  <Route path="whatsapp/templates/list" element={<MenuProtectedRoute menuItemCode="WHATSAPP_TEMPLATES"><WhatsAppTemplateList /></MenuProtectedRoute>} />
                  <Route path="whatsapp/campaigns" element={<MenuProtectedRoute menuItemCode="WHATSAPP_CAMPAIGNS"><Campaigns /></MenuProtectedRoute>} />
                  <Route path="whatsapp/credentials" element={<MenuProtectedRoute menuItemCode="WHATSAPP_SETTINGS"><WhatsAppCredentialsManager /></MenuProtectedRoute>} />
                  <Route path="whatsapp/setup" element={<WhatsAppBusinessSetup />} />

                  {/* Campaign Management */}
                  <Route path="campaigns" element={<MenuProtectedRoute menuItemCode="CAMPAIGNS"><Campaigns /></MenuProtectedRoute>} />

                  {/* Contact & Company Management */}
                  <Route path="contacts" element={<MenuProtectedRoute menuItemCode="CONTACTS"><Contacts /></MenuProtectedRoute>} />
                  <Route path="companies" element={<MenuProtectedRoute menuItemCode="COMPANIES"><Companies /></MenuProtectedRoute>} />

                  {/* Analytics & Reporting */}
                  <Route path="analytics" element={<MenuProtectedRoute menuItemCode="ANALYTICS"><Analytics /></MenuProtectedRoute>} />
                  <Route path="analytics/whatsapp" element={<MenuProtectedRoute menuItemCode="WHATSAPP_ANALYTICS"><Analytics /></MenuProtectedRoute>} />

                  {/* Settings & Administration */}
                  <Route path="settings" element={<MenuProtectedRoute menuItemCode="SETTINGS"><Settings /></MenuProtectedRoute>} />

                  {/* Team Management */}
                  <Route path="team/members" element={<MenuProtectedRoute menuItemCode="MEMBER_MANAGEMENT"><RoleManager /></MenuProtectedRoute>} />
                  <Route path="roles" element={<MenuProtectedRoute menuItemCode="ROLE_ASSIGNMENT"><RoleManager /></MenuProtectedRoute>} />

                  {/* Masters - Menu & Settings Management */}
                  <Route path="masters/list-values" element={<MenuProtectedRoute menuItemCode="LIST_VALUES"><ListValueComponent /></MenuProtectedRoute>} />
                  <Route path="masters/menu-creation" element={<MenuProtectedRoute menuItemCode="MENU_CREATION"><MenuManagement /></MenuProtectedRoute>} />
                  <Route path="masters/menu-item-creation" element={<MenuProtectedRoute menuItemCode="MENU_ITEM_CREATION"><MenuItemManagement /></MenuProtectedRoute>} />

                  {/* User Profile & Account */}
                  <Route path="profile" element={<UserProfilePage />} />
                  <Route path="change-password" element={<ChangePasswordForm />} />

                  {/* Tenant Onboarding Routes */}
                  <Route path="company-profile" element={<CompanyProfileSetup />} />
                  <Route path="billing" element={<BillingSetupForm />} />

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
