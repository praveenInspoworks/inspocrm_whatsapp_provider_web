import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { onboardingService } from "@/services/onboardingService";
import { toast } from "sonner";
import { clearMenuCache } from "@/hooks/useMenuAccess";

// Cross-tab authentication channel
const AUTH_CHANNEL = 'inspo_crm_auth_channel';

// Tab management hook for cross-tab synchronization
export const useTabSync = () => {
  const [tabId] = useState(() => `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [activeTabs, setActiveTabs] = useState<Set<string>>(new Set([tabId]));
  const [broadcastChannel] = useState(() => new BroadcastChannel(AUTH_CHANNEL));

  useEffect(() => {
    // Announce this tab's presence
    broadcastChannel.postMessage({
      type: 'TAB_JOIN',
      data: { tabId, timestamp: Date.now() }
    });

    // Listen for tab events
    const handleTabMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'TAB_JOIN':
          setActiveTabs(prev => new Set([...prev, data.tabId]));
          break;
        case 'TAB_LEAVE':
          setActiveTabs(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.tabId);
            return newSet;
          });
          break;
      }
    };

    broadcastChannel.addEventListener('message', handleTabMessage);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        broadcastChannel.postMessage({
          type: 'TAB_LEAVE',
          data: { tabId, timestamp: Date.now() }
        });
      } else if (document.visibilityState === 'visible') {
        broadcastChannel.postMessage({
          type: 'TAB_JOIN',
          data: { tabId, timestamp: Date.now() }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      broadcastChannel.postMessage({
        type: 'TAB_LEAVE',
        data: { tabId, timestamp: Date.now() }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      broadcastChannel.removeEventListener('message', handleTabMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      broadcastChannel.close();
    };
  }, [tabId, broadcastChannel]);

  return {
    tabId,
    activeTabsCount: activeTabs.size,
    isMultipleTabs: activeTabs.size > 1
  };
};

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  emailVerified: boolean;
  roles: string[];
  employeeCode: string;
  position: string;
  departmentName: string;
  lastLogin: string;
  avatarUrl?: string;
  tenantId?: string;
  tenantSchema?: string;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  departmentName: string;
  bio?: string;
  avatar?: string;
  timezone?: string;
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  preferences?: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    autoSave: boolean;
  };
}

interface OnboardingStatus {
  isOnboardingComplete: boolean;
  progress: {
    currentStep: number;
    totalSteps: number;
    completedSteps: string[];
    currentStepName: string;
    nextStepName?: string;
  };
  tenantInfo?: {
    tenantId: string;
    tenantCode: string;
    companyName: string;
  };
  userInfo?: {
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, tenantCode?: string) => Promise<void>;
  memberLogin: (email: string, password: string, tenantCode: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (profileData: ProfileData) => Promise<void>;
  refreshToken: () => Promise<void>;
  createMember: (memberData: any) => Promise<void>;
  getMembers: () => Promise<any[]>;
  updateMemberRole: (memberId: number, roleData: any) => Promise<void>;
  deleteMember: (memberId: number) => Promise<void>;
  completeOnboardingAfterLogin: (userInfo: any) => Promise<void>;
  onboardingStatus: OnboardingStatus | null;
  showOnboardingPopup: boolean;
  setShowOnboardingPopup: (show: boolean) => void;
  checkOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Initialize cross-tab communication
  useEffect(() => {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    setBroadcastChannel(channel);

    // Listen for authentication events from other tabs
    const handleAuthMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'AUTH_LOGOUT':
          // Another tab logged out, logout this tab too
          handleCrossTabLogout();
          break;
        case 'AUTH_LOGIN':
          // Another tab logged in, update state if needed
          if (data.user && !user) {
            setUser(data.user);
          }
          break;
        case 'AUTH_TOKEN_REFRESH':
          // Another tab refreshed token, update localStorage
          if (data.tokens) {
            Object.entries(data.tokens).forEach(([key, value]) => {
              if (value) {
                localStorage.setItem(key, value as string);
              }
            });
          }
          break;
      }
    };

    channel.addEventListener('message', handleAuthMessage);

    // Listen for localStorage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tenant_token' && !e.newValue) {
        // Token was removed from another tab, logout this tab
        handleCrossTabLogout();
      } else if (e.key === 'tenant_user' && e.newValue) {
        // User data was set from another tab, update state
        try {
          const userData = JSON.parse(e.newValue);
          if (userData && !user) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Error parsing user data from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel.removeEventListener('message', handleAuthMessage);
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Removed user dependency to prevent infinite loop

  // Handle cross-tab logout
  const handleCrossTabLogout = () => {
    setUser(null);
    authService.clearTenantAuth();
    clearMenuCache(); // Clear menu cache
    toast.info('Logged out from another tab');
    navigate('/');
  };

  // Check for existing session - simplified
  useEffect(() => {
    const isAuthenticated = authService.isTenantAuthenticated();
    if (isAuthenticated) {
      const userData = authService.getTenantUser();
      if (userData) {
        setUser(userData);
        // Don't broadcast here - it causes unnecessary calls
      }
    }
    setIsLoading(false);
  }, []); // Only run once on mount

  // Complete onboarding after successful login
  const completeOnboardingAfterLogin = async (userInfo: any) => {
    try {
      const tenantCode = userInfo.tenantCode;
      if (!tenantCode) {
        console.log('No tenant code found, skipping onboarding completion');
        navigate('/analytics');
        return;
      }

      const progressResponse = await authService.getOnboardingProgress(tenantCode);

      if (progressResponse.success && progressResponse.data) {
        const progress = progressResponse.data;

        if (progress.status === 'ACTIVE' || progress.progressPercentage === 100) {
          console.log('Onboarding already complete, navigating to analytics');
          navigate('/analytics');
          return;
        }

        if (progress.currentStage === 'REGISTRATION' || progress.progressPercentage < 60) {
          const onboardingData = {
            name: userInfo.organizationName,
            code: tenantCode,
            email: userInfo.email,
            subscriptionPlan: progress.subscriptionPlan || 'PREMIUM',
            adminFirstName: userInfo.firstName,
            adminLastName: userInfo.lastName,
            adminUsername: userInfo.username,
            adminPassword: 'TempPass123!'
          };

          const onboardingResponse = await authService.completeTenantOnboarding(onboardingData);
          if (onboardingResponse.success) {
            console.log('Tenant onboarding completed');
          }
        }

        if (progress.currentStage === 'VERIFICATION') {
          const verificationResponse = await authService.completeEmailVerification(tenantCode, 'default-verification-token');
          if (verificationResponse.success) {
            console.log('Email verification completed');
          }
        }

        if (progress.currentStage === 'CONFIGURATION') {
          const configResponse = await authService.completeConfiguration(tenantCode, userInfo.id);
          if (configResponse.success) {
            console.log('Configuration completed');
          }
        }

        const activationResponse = await authService.activateTenant(tenantCode);
        if (activationResponse.success) {
          console.log('Tenant activated successfully');
          toast.success('Onboarding completed! Welcome to INSPOCRM');
          navigate('/analytics');
        } else {
          console.error('Failed to activate tenant');
          navigate('/analytics');
        }
      } else {
        console.log('Could not get onboarding progress, navigating to analytics');
        navigate('/analytics');
      }
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      navigate('/analytics');
    }
  };

  const login = async (email: string, password: string, tenantCode?: string) => {
    setIsLoading(true);
    try {
      const response = await authService.tenantLogin({
        username: email,
        password: password,
        tenantCode: tenantCode
      });

      if (response.success && response.data) {
        setUser(response.data.userInfo);
        localStorage.setItem('just_logged_in', 'true');
        toast.success('Login successful!');

        // Navigate to dashboard first, let menu load naturally
        navigate('/');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const memberLogin = async (email: string, password: string, tenantCode: string) => {
    setIsLoading(true);
    try {
      const tenantInfo = await authService.getTenantByCode(tenantCode);
      if (!tenantInfo) {
        throw new Error('Invalid tenant code or tenant not found');
      }

      if (tenantInfo.status !== 'ACTIVE') {
        throw new Error('Tenant is not active. Please contact your administrator.');
      }

      // Call member login API instead of regular tenant login
      const response = await authService.memberLogin({
        username: email,
        password: password,
        tenantCode: tenantCode
      });

      if (response.success && response.data) {
        setUser(response.data.userInfo);
        toast.success(`Welcome to ${tenantInfo.companyName}!`);
        navigate('/');
      } else {
        throw new Error(response.message || 'Member login failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Member login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Use smart logout that detects user type and calls appropriate endpoint
      await authService.smartLogout();

      // Clear menu cache
      clearMenuCache();

      // Notify all other tabs to logout
      try {
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: 'AUTH_LOGOUT',
            data: {}
          });
        }
      } catch (error) {
        console.error('Failed to send cross-tab logout notification:', error);
      }

      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      setUser(null);
      authService.clearTenantAuth();
      clearMenuCache();
      navigate('/login');
    }
  };

  const refreshToken = async () => {
    try {
      const newToken = await authService.refreshTenantToken();
      if (newToken) {
        toast.success('Session refreshed');

        // Notify other tabs about token refresh
        try {
          if (broadcastChannel) {
            broadcastChannel.postMessage({
              type: 'AUTH_TOKEN_REFRESH',
              data: { tokens: { tenant_token: newToken } }
            });
          }
        } catch (error) {
          console.error('Failed to broadcast token refresh:', error);
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      await authService.tenantChangePassword(user.id, {
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      });
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.tenantForgotPassword({ email });
      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
      throw error;
    }
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    try {
      await authService.tenantResetPassword({
        token,
        newPassword
      });
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
      throw error;
    }
  };

  const updateProfile = async (profileData: ProfileData) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const updatedUser: User = {
        ...user,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        fullName: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        phone: profileData.phone,
        position: profileData.position,
        departmentName: profileData.departmentName,
        avatarUrl: profileData.avatar || user.avatarUrl // Handle both avatar and avatarUrl fields
      };

      setUser(updatedUser);
      localStorage.setItem('tenant_user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const createMember = async (memberData: any) => {
    try {
      const response = await authService.createTenantMember(memberData);
      if (response.success) {
        toast.success('Member created successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create member');
      throw error;
    }
  };

  const getMembers = async (): Promise<any[]> => {
    try {
      return await authService.getTenantMembers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch members');
      return [];
    }
  };

  const updateMemberRole = async (memberId: number, roleData: any) => {
    try {
      const response = await authService.updateMemberRole(memberId, roleData);
      if (response.success) {
        toast.success('Member role updated successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member role');
      throw error;
    }
  };

  const deleteMember = async (memberId: number) => {
    try {
      const response = await authService.deleteTenantMember(memberId);
      if (response.success) {
        toast.success('Member deleted successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete member');
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.roles.includes(permission) || user?.roles.includes('ADMIN') || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) || false;
  };

  const checkOnboardingStatus = async () => {
    try {
      const status = await onboardingService.getOnboardingStatus();
      setOnboardingStatus(status);

      if (!status.isOnboardingComplete) {
        const justLoggedIn = localStorage.getItem('just_logged_in') === 'true';
        if (justLoggedIn) {
          setShowOnboardingPopup(true);
          localStorage.removeItem('just_logged_in');
        }
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      memberLogin,
      logout,
      isLoading,
      hasPermission,
      hasRole,
      updatePassword,
      resetPassword,
      resetPasswordWithToken,
      updateProfile,
      refreshToken,
      createMember,
      getMembers,
      updateMemberRole,
      deleteMember,
      completeOnboardingAfterLogin,
      onboardingStatus,
      showOnboardingPopup,
      setShowOnboardingPopup,
      checkOnboardingStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
