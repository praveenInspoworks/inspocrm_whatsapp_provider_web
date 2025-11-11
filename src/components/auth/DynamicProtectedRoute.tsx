// components/auth/DynamicProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useMenuAccess } from '@/hooks/useMenuAccess';
import { useAuth } from '@/hooks/use-auth';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DynamicProtectedRouteProps {
  children: React.ReactNode;
  menuItemCode: string;
  permissionCode?: string;
  allowedRoles?: string[];
  restrictedRoles?: string[];
}

export const DynamicProtectedRoute: React.FC<DynamicProtectedRouteProps> = ({
  children,
  menuItemCode,
  permissionCode,
  allowedRoles = [],
  restrictedRoles = []
}) => {
  const { hasMenuAccess, hasPermission, isLoading, error, refreshAccess } = useMenuAccess();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle access denied error - show error message instead of redirecting
  if (error === 'ACCESS_DENIED') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-3">
            <Button
              onClick={refreshAccess}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.history.back()}
              className="w-full"
              variant="default"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle network errors - show retry option
  if (error && (error.includes('Network') || error.includes('connection'))) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">
            Unable to verify your access permissions. Please check your internet connection and try again.
          </p>
          <div className="space-y-3">
            <Button
              onClick={refreshAccess}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check menu access first (only if no errors)
  if (!hasMenuAccess(menuItemCode)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check specific permission if required
  if (permissionCode && !hasPermission(permissionCode)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role-based access
  if (user?.roles && user.roles.length > 0) {
    const primaryRole = user.roles[0];

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(primaryRole)) {
      return <Navigate to="/unauthorized" replace />;
    }

    // Check restricted roles
    if (restrictedRoles.length > 0 && restrictedRoles.includes(primaryRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
