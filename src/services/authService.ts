/* eslint-disable @typescript-eslint/no-explicit-any */
import { post, get } from './apiService';
import { toast } from 'sonner';

// Cross-tab authentication channel
const AUTH_CHANNEL = 'inspo_crm_auth_channel';

// Platform Authentication Types (for backward compatibility)
export interface PlatformLoginRequest {
  username: string;
  password: string;
}

export interface PlatformLoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: {
    id: number;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}



// Tenant Authentication Types
export interface TenantLoginRequest {
  username: string;
  password: string;
  tenantCode?: string;
}

export interface TenantLoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: {
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
    tenantCode:string;
  };
  tenantId: string;
  tenantSchema: string;
}

// Common Types
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
  tenantCode?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface TenantInfo {
  tenantId: string;
  tenantCode: string;
  companyName: string;
  status: string;
}

// Admin Signup Types
export interface AdminSignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organizationName: string;
  companySize: string;
  industry?: string;
  address?: string;
  agreeToTerms: boolean;
}

export interface AdminSignupResponse {
  adminUserId: number;
  organizationName: string;
  organizationCode: string;
  schemaName: string;
  status: string;
  message: string;
  emailVerificationToken: string;
}

// Email Verification Types
export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  message: string;
  email: string;
  verifiedAt: string;
}

// Set Password Types
export interface SetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface SetPasswordResponse {
  message: string;
  timestamp: string;
}

// ===== TENANT ONBOARDING COMPLETION METHODS =====

// Complete tenant onboarding (Step 5 from ONBOARDING_README.md)
export interface TenantOnboardingRequest {
  name: string;
  code: string;
  email: string;
  subscriptionPlan: string;
  adminFirstName?: string;
  adminLastName?: string;
  adminUsername?: string;
  adminPassword?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
}

export interface TenantOnboardingResponse {
  tenantId: string;
  organizationName: string;
  organizationCode: string;
  schemaName: string;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  adminUsername: string;
  message: string;
}

// Onboarding Progress Types
export interface OnboardingProgressResponse {
  tenantCode: string;
  organizationName: string;
  currentStage: string;
  progressPercentage: number;
  completedSteps: number;
  totalSteps: number;
  startedAt: string;
  stageDurations: {
    REGISTRATION: number;
    VERIFICATION: number;
    CONFIGURATION: number;
  };
  status: string;
  subscriptionPlan: string;
}

export const authService = {

  // ===== TENANT SEARCH =====

  // Search tenants by company name or tenant code (using OrganizationService)
  async searchTenants(query: string): Promise<TenantInfo[]> {
    try {
      // Use direct fetch to avoid token refresh logic that causes page reloads
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/inspocrm";
      const url = `${baseUrl}/api/v1/tenant/search?q=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data || [];
      } else {
        console.error('Tenant search failed:', response.status, response.statusText);
        return [];
      }
    } catch (error: any) {
      console.error('Tenant search error:', error);
      return [];
    }
  },

  // Get tenant by code
  async getTenantByCode(tenantCode: string): Promise<TenantInfo | null> {
    try {
      const response = await get<TenantInfo>('/api/v1/tenant/by-code/' + tenantCode);
      return response;
    } catch (error: any) {
      console.error('Get tenant by code error:', error);
      return null;
    }
  },

  // ===== TENANT AUTHENTICATION =====

  // Member Login
  async memberLogin(credentials: TenantLoginRequest): Promise<{ success: boolean; message: string; data?: TenantLoginResponse }> {
    try {
      // For member login, we need to pass tenant code as header since it's not in localStorage yet
      const headers: Record<string, string> = {};
      if (credentials.tenantCode) {
        headers['X-Tenant-Code'] = credentials.tenantCode;
      }

      // Use apiRequest directly to pass custom headers
      const { default: apiService } = await import('./apiService');
      const apiRequest = apiService.apiRequest;
      const response = await apiRequest<TenantLoginResponse>('/api/v1/member/auth/signin', {
        method: 'POST',
        headers,
        data: credentials
      });

      if (response) {
        // Store tenant tokens
        localStorage.setItem('tenant_token', response.accessToken);
        localStorage.setItem('tenant_refresh_token', response.refreshToken);
        localStorage.setItem('tenant_user', JSON.stringify(response.userInfo));
        localStorage.setItem('tenant_id', response.userInfo.tenantCode);
        localStorage.setItem('tenant_schema', response.tenantSchema);

        return {
          success: true,
          message: 'Member login successful',
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  },

  // Tenant Login
  async tenantLogin(credentials: TenantLoginRequest): Promise<{ success: boolean; message: string; data?: TenantLoginResponse }> {
    try {
      const response = await post<TenantLoginResponse>('/api/v1/auth/signin', credentials);

      if (response) {
        // Store tenant tokens
        localStorage.setItem('tenant_token', response.accessToken);
        localStorage.setItem('tenant_refresh_token', response.refreshToken);
        localStorage.setItem('tenant_user', JSON.stringify(response.userInfo));
        localStorage.setItem('tenant_id', response.userInfo.tenantCode);
        localStorage.setItem('tenant_schema', response.tenantSchema);

        return {
          success: true,
          message: 'Login successful',
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  },

  // Tenant Logout (for admin users)
  async tenantLogout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('tenant_refresh_token');
      if (refreshToken) {
        await post('/api/v1/auth/signout', refreshToken);
      }
    } catch (error) {
      console.error('Tenant logout error:', error);
    } finally {
      this.clearTenantAuth();
    }
  },

  // Member Logout (for member users)
  async memberLogout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('tenant_refresh_token');
      if (refreshToken) {
        // The apiService will automatically add X-Tenant-Code header from localStorage
        await post('/api/v1/member/auth/signout', refreshToken);
      }
    } catch (error) {
      console.error('Member logout error:', error);
    } finally {
      this.clearTenantAuth();
    }
  },

  // Smart logout that detects user type and calls appropriate endpoint
  async smartLogout(): Promise<void> {
    const user = this.getTenantUser();
    const isAdmin = user?.roles?.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN');

    if (isAdmin) {
      await this.tenantLogout();
    } else {
      await this.memberLogout();
    }
  },

  // Token Refresh (handles both tenant and member based on context)
  async refreshTenantToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('tenant_refresh_token');
      if (!refreshToken) return null;

      console.log('🔄 Refreshing token for tenant user');

      // Determine endpoint based on user type and context
      const tenantId = localStorage.getItem('tenant_id');
      const platformUser = localStorage.getItem('platform_user');
      const tenantUser = this.getTenantUser();
      const isPlatformUser = platformUser !== null && tenantId === null;
      const isTenantAdmin = tenantUser?.roles?.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN');

      // If platform admin (legacy platform login), use platform refresh endpoint
      if (isPlatformUser) {
        console.log('📍 Platform admin login detected, using platform refresh endpoint');
        const endpoint = '/api/v1/auth/token/refresh';

        const response = await post<TenantLoginResponse>(endpoint, { refreshToken });

        if (response && response.accessToken) {
          // Store platform tokens
          localStorage.setItem('tenant_token', response.accessToken);
          // Always store the new refresh token (token rotation)
          localStorage.setItem('tenant_refresh_token', response.refreshToken);

          // Broadcast token refresh
          try {
            const channel = new BroadcastChannel(AUTH_CHANNEL);
            channel.postMessage({
              type: 'AUTH_TOKEN_REFRESH',
              data: { tokens: { tenant_token: response.accessToken } }
            });
            channel.close();
          } catch (broadcastError) {
            console.error('Failed to broadcast token refresh:', broadcastError);
          }

          console.log('✅ Platform token refreshed successfully');
          return response.accessToken;
        }
      }
      // If tenant admin, use tenant auth refresh endpoint (not member endpoint)
      else if (isTenantAdmin) {
        console.log('📍 Tenant admin login detected, using tenant auth refresh endpoint');
        const endpoint = '/api/v1/auth/token/refresh';

        const response = await post<TenantLoginResponse>(endpoint, { refreshToken });

        if (response && response.accessToken) {
          localStorage.setItem('tenant_token', response.accessToken);
          // Always store the new refresh token (token rotation)
          localStorage.setItem('tenant_refresh_token', response.refreshToken);

          // Broadcast token refresh
          try {
            const channel = new BroadcastChannel(AUTH_CHANNEL);
            channel.postMessage({
              type: 'AUTH_TOKEN_REFRESH',
              data: { tokens: { tenant_token: response.accessToken } }
            });
            channel.close();
          } catch (broadcastError) {
            console.error('Failed to broadcast token refresh:', broadcastError);
          }

          console.log('✅ Tenant admin token refreshed successfully');
          return response.accessToken;
        }
      }
      // Otherwise, regular tenant members use member refresh endpoint
      else {
        console.log('📍 Tenant member login detected, using tenant member refresh endpoint');
        const endpoint = '/api/v1/member/auth/token/refresh';

        const response = await post<TenantLoginResponse>(endpoint, { refreshToken });

        if (response && response.accessToken) {
          localStorage.setItem('tenant_token', response.accessToken);
          // Always store the new refresh token (token rotation)
          localStorage.setItem('tenant_refresh_token', response.refreshToken);

          // Broadcast token refresh to other tabs
          try {
            const channel = new BroadcastChannel(AUTH_CHANNEL);
            channel.postMessage({
              type: 'AUTH_TOKEN_REFRESH',
              data: { tokens: { tenant_token: response.accessToken } }
            });
            channel.close();
          } catch (broadcastError) {
            console.error('Failed to broadcast token refresh:', broadcastError);
          }

          console.log('✅ Tenant member token refreshed successfully');
          return response.accessToken;
        }
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      console.error('❌ Token refresh error:', error);

      // If refresh fails, clear all tenant auth data and redirect
      this.clearTenantAuth();

      // Don't throw, return null instead to gracefully handle the failure
      return null;
    }
  },

  // ===== COMMON AUTHENTICATION METHODS =====

  // Platform Login (for backward compatibility)
  async platformLogin(credentials: PlatformLoginRequest): Promise<{ success: boolean; message: string; data?: PlatformLoginResponse }> {
    try {
      const response = await post<PlatformLoginResponse>('/api/v1/auth/signin', credentials);

      if (response) {
        // Store platform tokens
        localStorage.setItem('platform_token', response.accessToken);
        localStorage.setItem('platform_refresh_token', response.refreshToken);
        localStorage.setItem('platform_user', JSON.stringify(response.userInfo));

        return {
          success: true,
          message: 'Platform login successful',
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return this.handleAuthError(error);
    }
  },

  // Platform Logout (for backward compatibility)
  async platformLogout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('platform_refresh_token');
      if (refreshToken) {
        await post('/api/v1/auth/signout', refreshToken);
      }
    } catch (error) {
      console.error('Platform logout error:', error);
    } finally {
      this.clearPlatformAuth();
    }
  },

  // Get platform user (for backward compatibility)
  getPlatformUser() {
    try {
      const userData = localStorage.getItem('platform_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing platform user data:', error);
      return null;
    }
  },

  // Clear platform authentication (for backward compatibility)
  clearPlatformAuth(): void {
    localStorage.removeItem('platform_token');
    localStorage.removeItem('platform_refresh_token');
    localStorage.removeItem('platform_user');
  },

  // Legacy login method (for backward compatibility)
  async login(credentials: PlatformLoginRequest): Promise<{ success: boolean; message: string; data?: PlatformLoginResponse }> {
    return this.platformLogin(credentials);
  },

  // Legacy logout method (for backward compatibility)
  async logout(): Promise<void> {
    // Try both logout methods
    await Promise.allSettled([
      this.platformLogout(),
      this.tenantLogout()
    ]);
  },

  // ===== PASSWORD MANAGEMENT =====

  // Platform Password Change
  async platformChangePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      await post('/api/v1/auth/password/change', passwordData);
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
      throw error;
    }
  },

  // Tenant Password Change
  async tenantChangePassword(userId: number, passwordData: ChangePasswordRequest): Promise<void> {
    try {
      await post(`/api/v1/tenant/auth/change-password/${userId}`, passwordData);
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
      throw error;
    }
  },

  // Platform Forgot Password
  async platformForgotPassword(request: ForgotPasswordRequest): Promise<void> {
    try {
      await post('/api/v1/auth/password/reset/request', request);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset instructions');
      throw error;
    }
  },

  // Tenant Forgot Password
  async tenantForgotPassword(request: ForgotPasswordRequest): Promise<void> {
    try {
      await post('/api/v1/tenant/auth/password-reset/request', request);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset instructions');
      throw error;
    }
  },

  // Platform Reset Password
  async platformResetPassword(request: ResetPasswordRequest): Promise<void> {
    try {
      await post('/api/v1/auth/password/reset/confirm', request);
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
      throw error;
    }
  },

  // Tenant Reset Password
  async tenantResetPassword(request: ResetPasswordRequest): Promise<void> {
    try {
      await post('/api/v1/tenant/auth/password-reset/confirm', request);
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
      throw error;
    }
  },

  // ===== AUTHENTICATION STATUS =====

  // Check tenant authentication
  isTenantAuthenticated(): boolean {
    const token = localStorage.getItem('tenant_token');
    const user = localStorage.getItem('tenant_user');
    return !!(token && user);
  },

  // Legacy method (for backward compatibility)
  isAuthenticated(): boolean {
    return this.isTenantAuthenticated();
  },

  // ===== USER DATA RETRIEVAL =====

  // Get tenant user
  getTenantUser() {
    try {
      const userData = localStorage.getItem('tenant_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing tenant user data:', error);
      return null;
    }
  },

  // Get current tenant ID
  getCurrentTenantId(): string | null {
    return localStorage.getItem('tenant_id');
  },

  // Get current tenant schema
  getCurrentTenantSchema(): string | null {
    return localStorage.getItem('tenant_schema');
  },

  // Legacy method (for backward compatibility)
  getStoredUser() {
    return this.getTenantUser();
  },

  // ===== TOKEN RETRIEVAL =====

  // Get tenant token
  getTenantToken(): string | null {
    return localStorage.getItem('tenant_token');
  },

  // Legacy method (for backward compatibility)
  getStoredToken(): string | null {
    return this.getTenantToken();
  },

  // ===== PERMISSION & ROLE CHECKING =====

  // Platform permissions
  getPlatformPermissions(): string[] {
    const user = this.getPlatformUser();
    return user?.permissions || [];
  },

  hasPlatformPermission(permission: string): boolean {
    const permissions = this.getPlatformPermissions();
    return permissions.includes(permission) || permissions.includes('ALL_ACCESS');
  },

  isPlatformAdmin(): boolean {
    const user = this.getPlatformUser();
    return user?.roles.includes('ADMIN') || user?.roles.includes('SUPER_ADMIN') || false;
  },

  // Tenant roles
  getTenantRoles(): string[] {
    const user = this.getTenantUser();
    return user?.roles || [];
  },

  hasTenantRole(role: string): boolean {
    const roles = this.getTenantRoles();
    return roles.includes(role);
  },

  isTenantAdmin(): boolean {
    return this.hasTenantRole('ADMIN');
  },

  // Legacy methods (for backward compatibility)
  getUserPermissions(): string[] {
    return this.getTenantRoles();
  },

  hasPermission(permission: string): boolean {
    return this.hasTenantRole(permission);
  },

  hasRole(role: string): boolean {
    return this.hasTenantRole(role);
  },

  isAdmin(): boolean {
    return this.isTenantAdmin();
  },

  // ===== CLEANUP METHODS =====

  // Clear tenant authentication
  clearTenantAuth(): void {
    localStorage.removeItem('tenant_token');
    localStorage.removeItem('tenant_refresh_token');
    localStorage.removeItem('tenant_user');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_schema');
  },

  // Clear all authentication (legacy method)
  clearAllAuth(): void {
    this.clearTenantAuth();
  },

  // ===== ERROR HANDLING =====

  handleAuthError(error: any): { success: false; message: string } {
    console.error('Authentication error:', error);

    if (error.status === 401) {
      return { success: false, message: 'Invalid username or password' };
    } else if (error.status === 403) {
      return { success: false, message: 'Account is not active. Please contact administrator.' };
    } else if (error.status === 404) {
      return { success: false, message: 'User not found' };
    } else if (error.status === 423) {
      return { success: false, message: 'Account is locked. Please try again later.' };
    } else {
      return { success: false, message: error.message || 'Authentication failed' };
    }
  },

  // ===== TENANT MEMBER MANAGEMENT =====

  // Create member in tenant (API interceptor handles tenant code automatically)
  async createTenantMember(memberData: any): Promise<{ success: boolean; message: string }> {
    try {
      await post('/api/v1/auth/member/create', memberData);
      toast.success('Member created successfully');
      return { success: true, message: 'Member created successfully' };
    } catch (error: any) {
      toast.error(error.message || 'Failed to create member');
      return { success: false, message: error.message || 'Failed to create member' };
    }
  },

  // Get tenant members (API interceptor handles tenant code automatically)
  async getTenantMembers(): Promise<any[]> {
    try {
      const response = await get('/api/v1/auth/members');
      return response || [];
    } catch (error: any) {
      console.error('Failed to fetch tenant members:', error);
      return [];
    }
  },

  // Update member role (API interceptor handles tenant code automatically)
  async updateMemberRole(memberId: number, roleData: any): Promise<{ success: boolean; message: string }> {
    try {
      await post(`/api/v1/auth/member/${memberId}/role`, roleData);
      toast.success('Member role updated successfully');
      return { success: true, message: 'Member role updated successfully' };
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member role');
      return { success: false, message: error.message || 'Failed to update member role' };
    }
  },

  // Delete member (API interceptor handles tenant code automatically)
  async deleteTenantMember(memberId: number): Promise<{ success: boolean; message: string }> {
    try {
      await post(`/api/v1/auth/member/${memberId}/delete`, []);
      toast.success('Member deleted successfully');
      return { success: true, message: 'Member deleted successfully' };
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete member');
      return { success: false, message: error.message || 'Failed to delete member' };
    }
  },

  // ===== ADMIN ONBOARDING METHODS =====

  // Admin Signup
  async adminSignup(signupData: AdminSignupRequest): Promise<{ success: boolean; message: string; data?: AdminSignupResponse }> {
    try {
      console.log('🔄 Calling adminSignup API with data:', signupData);

      const response = await post<AdminSignupResponse>('/api/v1/auth/admin/signup', signupData);

      console.log('📥 Raw API response:', response);

      if (response) {
        console.log('✅ API call successful, response data:', response);

        // Check if response has the expected structure
        if (response.adminUserId || response.message) {
          toast.success(response.message || 'Admin signup successful');
          return {
            success: true,
            message: response.message || 'Admin signup successful',
            data: response
          };
        } else {
          console.error('❌ Unexpected response structure:', response);
          toast.error('Unexpected response from server');
          return {
            success: false,
            message: 'Unexpected response from server'
          };
        }
      } else {
        console.error('❌ Empty response from server');
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      console.error('❌ API call failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });

      const errorMessage = error.message || 'Admin signup failed';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Verify Admin Email
  async verifyAdminEmail(verificationData: EmailVerificationRequest): Promise<{ success: boolean; message: string; data?: EmailVerificationResponse }> {
    try {
      const response = await post<EmailVerificationResponse>('/api/v1/auth/admin/verify-email', verificationData);

      if (response) {
        toast.success(response.message || 'Email verified successfully');
        return {
          success: true,
          message: response.message,
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Email verification failed';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Resend Admin Verification Email
  async resendAdminVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>('/api/v1/auth/admin/resend-verification', { email });

      if (response.success) {
        toast.success(response.message || 'Verification email sent');
        return response;
      } else {
        toast.error(response.message || 'Failed to send verification email');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send verification email';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Set Admin Password
  async setAdminPassword(passwordData: SetPasswordRequest): Promise<{ success: boolean; message: string; data?: SetPasswordResponse }> {
    try {
      const response = await post<SetPasswordResponse>('/api/v1/auth/admin/set-password', passwordData);

      if (response) {
        toast.success(response.message || 'Password set successfully');
        return {
          success: true,
          message: response.message,
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to set password';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== MEMBER INVITATION METHODS =====

  // Verify Member Invitation
  async verifyMemberInvitation(token: string, tenantCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>(
        `/api/v1/member/auth/verify-invitation?token=${token}&tenantCode=${tenantCode}`,
        {}
      );

      if (response) {
        toast.success(response.message || 'Member invitation verified successfully');
        return response;
      } else {
        toast.error(response.message || 'Failed to verify member invitation');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to verify member invitation';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Complete Member Signup (set password and login immediately)
  async completeMemberSignup(signupData: { invitationToken: string; password: string; phone?: string }): Promise<{ success: boolean; message: string; data?: TenantLoginResponse }> {
    try {
      const response = await post<TenantLoginResponse>('/api/v1/member/auth/complete-signup', signupData);

      if (response) {
        // Store tenant tokens and user info for member login
        localStorage.setItem('tenant_token', response.accessToken);
        localStorage.setItem('tenant_refresh_token', response.refreshToken);
        localStorage.setItem('tenant_user', JSON.stringify(response.userInfo));
        localStorage.setItem('tenant_id', response.userInfo.tenantCode);
        localStorage.setItem('tenant_schema', response.tenantSchema);

        toast.success('Member signup completed successfully');
        return {
          success: true,
          message: 'Member signup completed successfully',
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete member signup';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Send Member Invitation
  async sendMemberInvitation(invitationData: any, tenantCode: string): Promise<{ success: boolean; message: string }> {
    try {
      // For member invitation, we need to include tenant code in the request data
      // since the post function doesn't accept headers as third parameter
      const requestData = {
        ...invitationData,
        tenantCode: tenantCode
      };

      const response = await post<{ success: boolean; message: string }>(
        '/api/v1/auth/member/send-invitation',
        requestData
      );

      if (response.success) {
        toast.success(response.message || 'Member invitation sent successfully');
        return response;
      } else {
        toast.error(response.message || 'Failed to send member invitation');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send member invitation';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== TENANT ONBOARDING METHODS =====

  // Complete tenant onboarding (Step 5 from ONBOARDING_README.md)
  async completeTenantOnboarding(onboardingData: TenantOnboardingRequest): Promise<{ success: boolean; message: string; data?: TenantOnboardingResponse }> {
    try {
      const response = await post<TenantOnboardingResponse>('/api/v1/admin/tenants/onboard', onboardingData);

      if (response) {
        toast.success('Tenant onboarding initiated successfully');
        return {
          success: true,
          message: response.message || 'Tenant onboarding initiated successfully',
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete tenant onboarding';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Check onboarding progress (Step 8 from ONBOARDING_README.md)
  async getOnboardingProgress(tenantCode: string): Promise<{ success: boolean; message: string; data?: OnboardingProgressResponse }> {
    try {
      const response = await get<OnboardingProgressResponse>(`/api/v1/admin/tenants/${tenantCode}/progress`);

      if (response) {
        return {
          success: true,
          message: 'Onboarding progress retrieved successfully',
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get onboarding progress';
      console.error('Onboarding progress error:', error);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Activate tenant (Step 9 from ONBOARDING_README.md)
  async activateTenant(tenantCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ message: string }>(`/api/v1/admin/tenants/${tenantCode}/activate`, {});

      if (response) {
        toast.success('Tenant activated successfully');
        return {
          success: true,
          message: response.message || 'Tenant activated successfully'
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to activate tenant';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Complete email verification (Step 6 from ONBOARDING_README.md)
  async completeEmailVerification(tenantCode: string, verificationToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ message: string }>(`/api/v1/admin/tenants/${tenantCode}/verify/email?token=${verificationToken}`, {});

      if (response) {
        toast.success('Email verification completed');
        return {
          success: true,
          message: response.message || 'Email verification completed successfully'
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete email verification';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Complete configuration (Step 7 from ONBOARDING_README.md)
  async completeConfiguration(tenantCode: string, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ message: string }>(`/api/v1/admin/tenants/${tenantCode}/configuration/complete?userId=${userId}`, {});

      if (response) {
        toast.success('Configuration completed');
        return {
          success: true,
          message: response.message || 'Configuration completed successfully'
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete configuration';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};
