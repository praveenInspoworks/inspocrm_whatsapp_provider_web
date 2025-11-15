/* eslint-disable @typescript-eslint/no-explicit-any */
import { get, post, put, del } from './apiService';
import { toast } from 'sonner';

// Subscription Plan Types
export type SubscriptionPlan = 'FREE_TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL' | 'TRIAL_EXPIRED';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

// Subscription Interfaces
export interface Subscription {
  id: string;
  tenantId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    users: number;
    messages: number;
    campaigns: number;
    templates: number;
    storage: number; // in GB
    apiCalls: number;
  };
  popular?: boolean;
}

export interface SubscriptionStatusResponse {
  active: boolean;
  subscription?: Subscription;
  plan?: SubscriptionPlanDetails;
  trialDaysRemaining?: number;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export interface UpgradeRequest {
  newPlan: SubscriptionPlan;
  billingCycle: BillingCycle;
  prorate?: boolean;
}

export interface DowngradeRequest {
  newPlan: SubscriptionPlan;
  effectiveDate?: 'IMMEDIATE' | 'END_OF_PERIOD';
}

export interface CancelRequest {
  reason?: string;
  feedback?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'UNPAID' | 'VOID' | 'REFUNDED';
  dueDate: string;
  paidAt?: string;
  periodStart: string;
  periodEnd: string;
  pdfUrl?: string;
  lineItems: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

export interface UsageMetrics {
  messages: {
    used: number;
    limit: number;
    percentage: number;
  };
  campaigns: {
    used: number;
    limit: number;
    percentage: number;
  };
  templates: {
    used: number;
    limit: number;
    percentage: number;
  };
  storage: {
    used: number; // in GB
    limit: number; // in GB
    percentage: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
  };
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
  FREE_TRIAL: {
    id: 'FREE_TRIAL',
    name: 'Free Trial',
    description: '14-day free trial to explore all features',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      '14-day full access',
      'Up to 5 users',
      '1,000 messages/month',
      '10 campaigns',
      '20 templates',
      '5 GB storage',
      'Basic support',
    ],
    limits: {
      users: 5,
      messages: 1000,
      campaigns: 10,
      templates: 20,
      storage: 5,
      apiCalls: 10000,
    },
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic Plan',
    description: 'Perfect for small businesses getting started',
    price: {
      monthly: 29.99,
      yearly: 299.99, // ~2 months free
    },
    features: [
      'Up to 10 users',
      '10,000 messages/month',
      '50 campaigns',
      '100 templates',
      '50 GB storage',
      'Email support',
      'Basic analytics',
    ],
    limits: {
      users: 10,
      messages: 10000,
      campaigns: 50,
      templates: 100,
      storage: 50,
      apiCalls: 100000,
    },
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium Plan',
    description: 'For growing businesses with advanced needs',
    price: {
      monthly: 79.99,
      yearly: 799.99, // ~2 months free
    },
    features: [
      'Up to 25 users',
      '100,000 messages/month',
      'Unlimited campaigns',
      'Unlimited templates',
      '500 GB storage',
      'Priority support',
      'Advanced analytics',
      'API access',
      'Webhook support',
    ],
    popular: true,
    limits: {
      users: 25,
      messages: 100000,
      campaigns: -1, // unlimited
      templates: -1, // unlimited
      storage: 500,
      apiCalls: 1000000,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    description: 'For large organizations with custom requirements',
    price: {
      monthly: 199.99,
      yearly: 1999.99, // ~2 months free
    },
    features: [
      'Unlimited users',
      'Unlimited messages',
      'Unlimited campaigns',
      'Unlimited templates',
      '2 TB storage',
      'Dedicated support',
      'Advanced analytics',
      'API access',
      'Webhook support',
      'Custom integrations',
      'SLA guarantee',
      'Account manager',
    ],
    limits: {
      users: -1, // unlimited
      messages: -1, // unlimited
      campaigns: -1, // unlimited
      templates: -1, // unlimited
      storage: 2000,
      apiCalls: -1, // unlimited
    },
  },
};

export const subscriptionService = {
  // Get current subscription status
  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    try {
      const response = await get<SubscriptionStatusResponse>('/api/v1/subscription/status');
      return response;
    } catch (error: any) {
      console.error('Failed to get subscription status:', error);
      // Return default status for development
      if (import.meta.env.DEV) {
        return {
          active: true,
          canUpgrade: true,
          canDowngrade: false,
        };
      }
      throw error;
    }
  },

  // Get subscription details
  async getSubscription(): Promise<Subscription> {
    try {
      const response = await get<Subscription>('/api/v1/subscription');
      return response;
    } catch (error: any) {
      console.error('Failed to get subscription:', error);
      throw error;
    }
  },

  // Get all available plans
  getAvailablePlans(): SubscriptionPlanDetails[] {
    return Object.values(SUBSCRIPTION_PLANS);
  },

  // Get plan details
  getPlanDetails(planId: SubscriptionPlan): SubscriptionPlanDetails {
    return SUBSCRIPTION_PLANS[planId];
  },

  // Upgrade subscription
  async upgradeSubscription(request: UpgradeRequest): Promise<Subscription> {
    try {
      const response = await post<Subscription>('/api/v1/subscription/upgrade', request);
      toast.success('Subscription upgraded successfully!');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upgrade subscription';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Downgrade subscription
  async downgradeSubscription(request: DowngradeRequest): Promise<Subscription> {
    try {
      const response = await post<Subscription>('/api/v1/subscription/downgrade', request);
      toast.success('Subscription downgrade scheduled successfully');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to downgrade subscription';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription(request?: CancelRequest): Promise<Subscription> {
    try {
      const response = await post<Subscription>('/api/v1/subscription/cancel', request || {});
      toast.success('Subscription cancelled. Access will continue until the end of your billing period.');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to cancel subscription';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Reactivate cancelled subscription
  async reactivateSubscription(): Promise<Subscription> {
    try {
      const response = await post<Subscription>('/api/v1/subscription/reactivate', {});
      toast.success('Subscription reactivated successfully!');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reactivate subscription';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await get<PaymentMethod[]>('/api/v1/subscription/payment-methods');
      return response;
    } catch (error: any) {
      console.error('Failed to get payment methods:', error);
      return [];
    }
  },

  // Add payment method
  async addPaymentMethod(paymentMethodData: any): Promise<PaymentMethod> {
    try {
      const response = await post<PaymentMethod>('/api/v1/subscription/payment-methods', paymentMethodData);
      toast.success('Payment method added successfully');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to add payment method';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await put(`/api/v1/subscription/payment-methods/${paymentMethodId}/default`, {});
      toast.success('Default payment method updated');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update payment method';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await del(`/api/v1/subscription/payment-methods/${paymentMethodId}`);
      toast.success('Payment method removed');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove payment method';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Get invoices
  async getInvoices(limit = 10, offset = 0): Promise<Invoice[]> {
    try {
      const response = await get<Invoice[]>('/api/v1/subscription/invoices', {
        params: { limit, offset },
      });
      return response;
    } catch (error: any) {
      console.error('Failed to get invoices:', error);
      return [];
    }
  },

  // Get invoice by ID
  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const response = await get<Invoice>(`/api/v1/subscription/invoices/${invoiceId}`);
      return response;
    } catch (error: any) {
      console.error('Failed to get invoice:', error);
      throw error;
    }
  },

  // Download invoice PDF
  async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      const response = await get<Blob>(`/api/v1/subscription/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to download invoice';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Get usage metrics
  async getUsageMetrics(): Promise<UsageMetrics> {
    try {
      const response = await get<UsageMetrics>('/api/v1/subscription/usage');
      return response;
    } catch (error: any) {
      console.error('Failed to get usage metrics:', error);
      // Return default metrics for development
      if (import.meta.env.DEV) {
        return {
          messages: { used: 0, limit: 10000, percentage: 0 },
          campaigns: { used: 0, limit: 50, percentage: 0 },
          templates: { used: 0, limit: 100, percentage: 0 },
          storage: { used: 0, limit: 50, percentage: 0 },
          apiCalls: { used: 0, limit: 100000, percentage: 0 },
          users: { used: 1, limit: 10, percentage: 10 },
        };
      }
      throw error;
    }
  },

  // Check if feature is available for current plan
  async checkFeatureAccess(feature: string): Promise<boolean> {
    try {
      const response = await get<{ allowed: boolean }>(`/api/v1/subscription/features/${feature}/check`);
      return response.allowed;
    } catch (error: any) {
      console.error('Failed to check feature access:', error);
      // Allow in development
      return import.meta.env.DEV;
    }
  },

  // Start free trial
  async startFreeTrial(): Promise<Subscription> {
    try {
      const response = await post<Subscription>('/api/v1/subscription/trial/start', {});
      toast.success('Free trial started! Enjoy 14 days of full access.');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start free trial';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Extend trial (admin only)
  async extendTrial(days: number): Promise<Subscription> {
    try {
      const response = await post<Subscription>('/api/v1/subscription/trial/extend', { days });
      toast.success(`Trial extended by ${days} days`);
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to extend trial';
      toast.error(errorMessage);
      throw error;
    }
  },
};

