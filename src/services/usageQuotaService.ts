/* eslint-disable @typescript-eslint/no-explicit-any */
import { get, post } from './apiService';
import { subscriptionService, UsageMetrics } from './subscriptionService';
import { toast } from 'sonner';

export type QuotaType = 'messages' | 'campaigns' | 'templates' | 'storage' | 'apiCalls' | 'users';

export interface QuotaLimit {
  type: QuotaType;
  used: number;
  limit: number;
  percentage: number;
  resetDate?: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  quotaType: QuotaType;
  used: number;
  limit: number;
  remaining: number;
  message?: string;
  upgradeRequired?: boolean;
}

export interface UsageRecord {
  id: string;
  tenantId: number;
  type: QuotaType;
  amount: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const usageQuotaService = {
  // Get current usage metrics
  async getUsageMetrics(): Promise<UsageMetrics> {
    return await subscriptionService.getUsageMetrics();
  },

  // Check if action is allowed based on quota
  async checkQuota(type: QuotaType, amount = 1): Promise<QuotaCheckResult> {
    try {
      const metrics = await this.getUsageMetrics();
      const quota = metrics[type];

      if (!quota) {
        return {
          allowed: true,
          quotaType: type,
          used: 0,
          limit: -1,
          remaining: -1,
        };
      }

      // -1 means unlimited
      if (quota.limit === -1) {
        return {
          allowed: true,
          quotaType: type,
          used: quota.used,
          limit: -1,
          remaining: -1,
        };
      }

      const remaining = quota.limit - quota.used;
      const allowed = remaining >= amount;

      return {
        allowed,
        quotaType: type,
        used: quota.used,
        limit: quota.limit,
        remaining,
        message: allowed
          ? undefined
          : `You've reached your ${type} limit. Please upgrade your plan.`,
        upgradeRequired: !allowed,
      };
    } catch (error: any) {
      console.error('Failed to check quota:', error);
      // Allow in development
      if (import.meta.env.DEV) {
        return {
          allowed: true,
          quotaType: type,
          used: 0,
          limit: -1,
          remaining: -1,
        };
      }
      throw error;
    }
  },

  // Record usage
  async recordUsage(type: QuotaType, amount: number, metadata?: Record<string, any>): Promise<void> {
    try {
      await post('/api/v1/usage/record', {
        type,
        amount,
        metadata,
      });
    } catch (error: any) {
      console.error('Failed to record usage:', error);
      // Don't throw - usage recording shouldn't block operations
    }
  },

  // Get usage history
  async getUsageHistory(type: QuotaType, startDate?: string, endDate?: string): Promise<UsageRecord[]> {
    try {
      const response = await get<UsageRecord[]>('/api/v1/usage/history', {
        params: {
          type,
          startDate,
          endDate,
        },
      });
      return response;
    } catch (error: any) {
      console.error('Failed to get usage history:', error);
      return [];
    }
  },

  // Check and enforce quota before action
  async enforceQuota(type: QuotaType, amount = 1, showToast = true): Promise<boolean> {
    const check = await this.checkQuota(type, amount);

    if (!check.allowed) {
      if (showToast) {
        toast.error(check.message || `Quota limit reached for ${type}`);
        if (check.upgradeRequired) {
          // Show upgrade prompt
          setTimeout(() => {
            toast.info('Upgrade your plan to continue', {
              action: {
                label: 'Upgrade',
                onClick: () => {
                  window.location.href = '/subscription';
                },
              },
            });
          }, 2000);
        }
      }
      return false;
    }

    return true;
  },

  // Get quota limits for current plan
  async getQuotaLimits(): Promise<Record<QuotaType, number>> {
    try {
      const subscription = await subscriptionService.getSubscription();
      const planDetails = subscriptionService.getPlanDetails(subscription.plan);
      return planDetails.limits;
    } catch (error: any) {
      console.error('Failed to get quota limits:', error);
      // Return default limits for development
      if (import.meta.env.DEV) {
        return {
          messages: 10000,
          campaigns: 50,
          templates: 100,
          storage: 50,
          apiCalls: 100000,
          users: 10,
        };
      }
      throw error;
    }
  },

  // Check if user can perform action (with automatic usage recording)
  async canPerformAction(type: QuotaType, amount = 1, autoRecord = true): Promise<boolean> {
    const allowed = await this.enforceQuota(type, amount);

    if (allowed && autoRecord) {
      // Record usage asynchronously (don't wait)
      this.recordUsage(type, amount).catch(console.error);
    }

    return allowed;
  },
};

