import { post, get } from './apiService';
import { toast } from 'sonner';

// Using the backend DTOs for consistency
export interface TenantSignupRequest {
  name: string;
  code: string;
  email: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  industry?: string;
  companySize?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  subscriptionPlan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  adminFirstName: string;
  adminLastName: string;
  adminUsername: string;
  adminPassword: string;
  adminPhone?: string;
}

export interface TenantSignupResponse {
  success: boolean;
  message: string;
  tenantId?: string;
  organizationName?: string;
  organizationCode?: string;
  schemaName?: string;
  status?: string;
  subscriptionPlan?: string;
  createdAt?: string;
  adminUsername?: string;
}

// Email Verification Types
export interface EmailVerificationRequest {
  token: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    emailVerified: boolean;
    nextStep: 'set_password' | 'complete';
  };
}

// Set Password Types
export interface SetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface SetPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    userId: number;
    loginRequired: boolean;
  };
}

// Company Information Types
export interface CompanyInfoRequest {
  companyName: string;
  industry: string;
  companySize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  website?: string;
  linkedinUrl?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface CompanyInfoResponse {
  success: boolean;
  message: string;
  companyName?: string;
  tenantCode?: string;
}

// Onboarding Step Types
export interface OnboardingStepRequest {
  stepId: string;
}

export interface OnboardingStepResponse {
  success: boolean;
  message: string;
  stepId?: string;
  completed?: boolean;
}

// Complete Onboarding Types
export interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  tenantCode?: string;
  status?: string;
}

// Onboarding Status Types
export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  currentStepName: string;
  nextStepName?: string;
}

export interface OnboardingStatus {
  isOnboardingComplete: boolean;
  progress: OnboardingProgress;
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

// Brand Voice Setup Types
export interface BrandVoiceSetupRequest {
  tone: 'professional' | 'friendly' | 'formal' | 'casual' | 'luxury' | 'playful';
  voiceProfile: string;
  bannedWords?: string;
  preferredHashtags?: string;
  targetAudience: string;
  brandValues: string[];
}

export interface BrandVoiceSetupResponse {
  success: boolean;
  message: string;
}

// Campaign Setup Types
export interface CampaignSetupRequest {
  campaignName: string;
  campaignType: 'email' | 'social' | 'sms' | 'multichannel';
  targetAudience: string;
  goals: string[];
  budget?: number;
  startDate: string;
  endDate: string;
}

export interface CampaignSetupResponse {
  success: boolean;
  message: string;
}

export const onboardingService = {
  // ===== TENANT SIGNUP =====
  async signupTenant(signupData: TenantSignupRequest): Promise<TenantSignupResponse> {
    try {
      const response = await post<TenantSignupResponse>('/api/v1/auth/admin/signup', signupData);

      if (response.success) {
        toast.success(response.message || 'Account created successfully!');

        // Store tenant info for next steps
        if (response.tenantId) {
          localStorage.setItem('onboarding_tenant_id', response.tenantId);
          localStorage.setItem('onboarding_tenant_code', response.organizationCode || '');
          localStorage.setItem('onboarding_user_id', '0'); // Will be set after login
          localStorage.setItem('onboarding_next_step', 'email_verification');
        }

        return response;
      } else {
        toast.error(response.message || 'Failed to create account');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create account';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== EMAIL VERIFICATION =====
  async verifyEmail(verificationData: EmailVerificationRequest): Promise<EmailVerificationResponse> {
    try {
      const response = await post<EmailVerificationResponse>('/api/v1/tenant/onboarding/verify-email', verificationData);

      if (response.success) {
        toast.success(response.message || 'Email verified successfully!');

        // Update next step
        if (response.data) {
          localStorage.setItem('onboarding_next_step', response.data.nextStep);
        }

        return response;
      } else {
        toast.error(response.message || 'Email verification failed');
        return response;
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

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>('/api/v1/tenant/onboarding/resend-verification', { email });

      if (response.success) {
        toast.success(response.message || 'Verification email sent!');
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

  // ===== SET PASSWORD =====
  async setPassword(passwordData: SetPasswordRequest): Promise<SetPasswordResponse> {
    try {
      const userId = localStorage.getItem('onboarding_user_id');
      if (!userId) {
        throw new Error('User ID not found. Please restart the onboarding process.');
      }

      const response = await post<SetPasswordResponse>(`/api/v1/tenant/onboarding/set-password/${userId}`, passwordData);

      if (response.success) {
        toast.success(response.message || 'Password set successfully!');

        // Update onboarding status
        if (response.data) {
          localStorage.setItem('onboarding_next_step', 'complete');
        }

        return response;
      } else {
        toast.error(response.message || 'Failed to set password');
        return response;
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

  // ===== BRAND VOICE SETUP =====
  async setupBrandVoice(brandVoiceData: BrandVoiceSetupRequest): Promise<BrandVoiceSetupResponse> {
    try {
      const response = await post<BrandVoiceSetupResponse>('/api/v1/tenant/onboarding/brand-voice', brandVoiceData);

      if (response.success) {
        toast.success(response.message || 'Brand voice configured successfully!');
        return response;
      } else {
        toast.error(response.message || 'Failed to configure brand voice');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to configure brand voice';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== CAMPAIGN SETUP =====
  async setupCampaign(campaignData: CampaignSetupRequest): Promise<CampaignSetupResponse> {
    try {
      const response = await post<CampaignSetupResponse>('/api/v1/tenant/onboarding/first-campaign', campaignData);

      if (response.success) {
        toast.success(response.message || 'Campaign created successfully!');
        return response;
      } else {
        toast.error(response.message || 'Failed to create campaign');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create campaign';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== BILLING SETUP =====
  async setupBilling(billingData: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>('/api/v1/tenant/onboarding/billing-setup', billingData);

      if (response.success) {
        toast.success(response.message || 'Billing setup completed successfully!');
        return response;
      } else {
        toast.error(response.message || 'Failed to setup billing');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to setup billing';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== TEAM INVITATION =====
  async inviteTeamMembers(teamData: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>('/api/v1/tenant/onboarding/team-invitation', teamData);

      if (response.success) {
        toast.success(response.message || 'Team members invited successfully!');
        return response;
      } else {
        toast.error(response.message || 'Failed to invite team members');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to invite team members';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== INTEGRATION SETUP =====
  async setupIntegrations(integrationData: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>('/api/v1/tenant/onboarding/integration-setup', integrationData);

      if (response.success) {
        toast.success(response.message || 'Integrations setup completed successfully!');
        return response;
      } else {
        toast.error(response.message || 'Failed to setup integrations');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to setup integrations';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== ONBOARDING STATUS =====
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      // Get current user and tenant info from localStorage
      const user = JSON.parse(localStorage.getItem('tenant_user') || '{}');
      const tenantCode = localStorage.getItem('tenant_id');

      if (!user?.id || !tenantCode) {
        console.warn('User or tenant info not found for onboarding status');
        return this.getDefaultOnboardingStatus();
      }

      // Only allow admin users to access onboarding status (admin-only API)
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('SUPER_ADMIN')) {
        console.warn('Non-admin user attempted to access onboarding status - access denied');
        return this.getDefaultOnboardingStatus();
      }

      // For tenant admin, use the admin progress endpoint
      const response = await get<any>(`/api/v1/admin/tenants/${tenantCode}/progress`);

              return response;
    } catch (error: any) {
      console.error('Failed to get onboarding status:', error);

      // If token expired (401), the API interceptor will handle token refresh automatically
      // If refresh fails, we'll get a 401 error here
      if (error.status === 401) {
        console.warn('Authentication failed for onboarding status - token may have expired');
        // Return default status instead of throwing error to prevent UI disruption
        return this.getDefaultOnboardingStatus();
      }

      // If 403 or 404, tenant might not be found - return default status
      if (error.status === 403 || error.status === 404) {
        console.warn('Tenant not found, returning default onboarding status');
        return this.getDefaultOnboardingStatus();
      }

      // For other errors, still return default status to maintain UI stability
      console.warn('Unexpected error getting onboarding status, returning default');
      return this.getDefaultOnboardingStatus();
    }
  },

  // Helper method to get default onboarding status
  getDefaultOnboardingStatus(): OnboardingStatus {
    return {
      isOnboardingComplete: false,
      progress: {
        currentStep: 1,
        totalSteps: 9,
        completedSteps: [],
        currentStepName: 'Account Registration'
      }
    };
  },

  // Helper method to convert progress percentage to completed steps
  getCompletedSteps(progressPercentage: number): string[] {
    const steps = ['Account Registration', 'Email Verification', 'Password Setup', 'Company Profile', 'Billing Setup', 'Brand Voice', 'First Campaign', 'Team Invitation', 'Integration Setup'];
    const completedCount = Math.floor(progressPercentage / 11.11); // 100% / 9 steps ≈ 11.11%
    return steps.slice(0, completedCount);
  },

  // Helper method to get current step name
  getCurrentStepName(progressPercentage: number): string {
    const stepIndex = Math.floor(progressPercentage / 11.11);
    const steps = ['Account Registration', 'Email Verification', 'Password Setup', 'Company Profile', 'Billing Setup', 'Brand Voice', 'First Campaign', 'Team Invitation', 'Integration Setup'];
    return steps[stepIndex] || 'Account Registration';
  },

  // Helper method to get next step name
  getNextStepName(progressPercentage: number): string | undefined {
    const stepIndex = Math.floor(progressPercentage / 11.11) + 1;
    const steps = ['Account Registration', 'Email Verification', 'Password Setup', 'Company Profile', 'Billing Setup', 'Brand Voice', 'First Campaign', 'Team Invitation', 'Integration Setup'];
    return steps[stepIndex];
  },

  // ===== ONBOARDING UTILITIES =====
  getStoredOnboardingInfo() {
    return {
      tenantId: localStorage.getItem('onboarding_tenant_id'),
      tenantCode: localStorage.getItem('onboarding_tenant_code'),
      userId: localStorage.getItem('onboarding_user_id'),
      nextStep: localStorage.getItem('onboarding_next_step')
    };
  },

  clearOnboardingInfo() {
    localStorage.removeItem('onboarding_tenant_id');
    localStorage.removeItem('onboarding_tenant_code');
    localStorage.removeItem('onboarding_user_id');
    localStorage.removeItem('onboarding_next_step');
  },

  // Get onboarding progress for UI
  getOnboardingProgress(): OnboardingProgress {
    const nextStep = localStorage.getItem('onboarding_next_step');

    const steps = [
      { key: 'signup', name: 'Account Registration', step: 1 },
      { key: 'email_verification', name: 'Email Verification', step: 2 },
      { key: 'set_password', name: 'Password Setup', step: 3 },
      { key: 'company_profile', name: 'Company Profile', step: 4 },
      { key: 'billing_setup', name: 'Billing Setup', step: 5 },
      { key: 'brand_voice', name: 'Brand Voice', step: 6 },
      { key: 'first_campaign', name: 'First Campaign', step: 7 },
      { key: 'team_invitation', name: 'Team Invitation', step: 8 },
      { key: 'integration_setup', name: 'Integration Setup', step: 9 }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === nextStep) + 1;
    const currentStep = currentStepIndex > 0 ? currentStepIndex : 1;

    return {
      currentStep,
      totalSteps: 9,
      completedSteps: steps.slice(0, currentStep - 1).map(step => step.name),
      currentStepName: steps[currentStep - 1]?.name || 'Account Registration',
      nextStepName: steps[currentStep]?.name
    };
  },

  // Check if onboarding is complete
  isOnboardingComplete(): boolean {
    const nextStep = localStorage.getItem('onboarding_next_step');
    return nextStep === 'complete';
  },

  // ===== COMPANY INFORMATION =====
  async updateCompanyInfo(companyData: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>(
        '/api/v1/tenant/onboarding/company-info',
        companyData
      );

      if (response.success) {
        toast.success(response.message || 'Company information updated successfully');
        return response;
      } else {
        toast.error(response.message || 'Failed to update company information');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update company information';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== COMPANY INFORMATION WITH LOGO UPLOAD =====
  async updateCompanyInfoWithLogo(companyData: any, logoFile?: File): Promise<{ success: boolean; message: string }> {
    try {
      let response;

      if (logoFile) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('companyData', JSON.stringify(companyData));
        formData.append('logo', logoFile);

        // Use fetch directly for FormData since our apiService might not handle it properly
        const apiResponse = await fetch('/api/v1/tenant/onboarding/company-info-with-logo', {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header for FormData - let browser set it with boundary
        });

        response = await apiResponse.json();
      } else {
        // Regular JSON request
        response = await post<{ success: boolean; message: string }>(
          '/api/v1/tenant/onboarding/company-info',
          companyData
        );
      }

      if (response.success) {
        toast.success(response.message || 'Company information updated successfully');
        return response;
      } else {
        toast.error(response.message || 'Failed to update company information');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update company information';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== ONBOARDING STEP MANAGEMENT =====
  async completeOnboardingStep(stepId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>(
        `/api/v1/tenant/onboarding/steps/${stepId}/complete`,
        {}
      );

      if (response.success) {
        toast.success(response.message || 'Step completed successfully');
        return response;
      } else {
        toast.error(response.message || 'Failed to complete step');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete step';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  async skipOnboardingStep(stepId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = JSON.parse(localStorage.getItem('tenant_user') || '{}');
      const skippedBy = user?.email || 'system';

      const response = await post<{ success: boolean; message: string }>(
        `/api/v1/admin/tenants/${localStorage.getItem('tenant_id')}/checklist/steps/${stepId}/skip?skippedBy=${encodeURIComponent(skippedBy)}`,
        {}
      );

      if (response.success) {
        toast.success(response.message || 'Step skipped successfully');
        return response;
      } else {
        toast.error(response.message || 'Failed to skip step');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to skip step';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // ===== COMPLETE ONBOARDING =====
  async completeOnboarding(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await post<{ success: boolean; message: string }>(
        '/api/v1/tenant/onboarding/complete',
        {}
      );

      if (response.success) {
        toast.success(response.message || 'Onboarding completed successfully!');

        // Clear onboarding flags
        localStorage.removeItem('onboarding_next_step');
        localStorage.setItem('onboarding_complete', 'true');

        return response;
      } else {
        toast.error(response.message || 'Failed to complete onboarding');
        return response;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete onboarding';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};
