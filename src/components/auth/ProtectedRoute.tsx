import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "./LoginForm";
import TenantLoginForm from "./TenantLoginForm";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  allowedRoles?: string[];
  restrictedRoles?: string[];
}

function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  allowedRoles = [],
  restrictedRoles = []
}: ProtectedRouteProps) {
  // Safely use auth hook with error boundary
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    // During hot reloading, useAuth might not be available
    console.warn('useAuth not available during component initialization');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { user, isLoading, hasPermission, hasRole } = authData;
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <TenantLoginForm />;
  }

  // Check if user's role is in restricted roles
  if (restrictedRoles.length > 0 && restrictedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Restricted</h1>
          <p className="text-muted-foreground">
            Your role ({user.role}) is not allowed to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check if user's role is in allowed roles (if specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            Only users with roles: {allowedRoles.join(", ")} can access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have the required permissions to access this page.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Required: {requiredPermissions.join(", ")}
            </p>
          </div>
        </div>
      );
    }
  }

  // Check required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have the required role to access this page.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Required roles: {requiredRoles.join(", ")}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
