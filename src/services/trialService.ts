/* eslint-disable @typescript-eslint/no-explicit-any */
import { get, post, put } from './apiService';
import { subscriptionService, Subscription } from './subscriptionService';
import { toast } from 'sonner';

export interface TrialStatus {
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  trialStart?: string;
  trialEnd?: string;
  canExtend: boolean;
  canConvert: boolean;
}

export interface TrialConversionRequest {
  plan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  billingCycle: 'MONTHLY' | 'YEARLY';
  paymentMethodId?: string;
}

export const trialService = {
  // Get trial status
  async getTrialStatus(): Promise<TrialStatus> {
    try {
      const subscription = await subscriptionService.getSubscription();
      const status = await subscriptionService.getSubscriptionStatus();

      const isTrial = subscription.status === 'TRIAL' || subscription.plan === 'FREE_TRIAL';
      const isExpired = subscription.status === 'TRIAL_EXPIRED';

      let daysRemaining = 0;
      if (subscription.trialEnd) {
        const endDate = new Date(subscription.trialEnd);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      return {
        isTrial,
        isExpired,
        daysRemaining,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        canExtend: isTrial && !isExpired, // Admin only
        canConvert: isTrial && !isExpired,
      };
    } catch (error: any) {
      console.error('Failed to get trial status:', error);
      // Return default for development
      if (import.meta.env.DEV) {
        return {
          isTrial: false,
          isExpired: false,
          daysRemaining: 0,
          canExtend: false,
          canConvert: false,
        };
      }
      throw error;
    }
  },

  // Start free trial
  async startTrial(): Promise<Subscription> {
    try {
      const subscription = await subscriptionService.startFreeTrial();
      toast.success('Free trial started! Enjoy 14 days of full access.');
      return subscription;
    } catch (error: any) {
      throw error;
    }
  },

  // Convert trial to paid subscription
  async convertToPaid(request: TrialConversionRequest): Promise<Subscription> {
    try {
      // First upgrade subscription
      const subscription = await subscriptionService.upgradeSubscription({
        newPlan: request.plan,
        billingCycle: request.billingCycle,
      });

      toast.success('Trial converted to paid subscription successfully!');
      return subscription;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to convert trial';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Extend trial (admin only)
  async extendTrial(days: number): Promise<Subscription> {
    try {
      const subscription = await subscriptionService.extendTrial(days);
      toast.success(`Trial extended by ${days} days`);
      return subscription;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to extend trial';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Check if trial is active
  async isTrialActive(): Promise<boolean> {
    try {
      const status = await this.getTrialStatus();
      return status.isTrial && !status.isExpired;
    } catch (error: any) {
      console.error('Failed to check trial status:', error);
      return false;
    }
  },

  // Get trial expiration warning
  getTrialWarning(daysRemaining: number): { show: boolean; message: string; severity: 'info' | 'warning' | 'error' } {
    if (daysRemaining <= 0) {
      return {
        show: true,
        message: 'Your trial has expired. Please upgrade to continue using HotKup.',
        severity: 'error',
      };
    }

    if (daysRemaining <= 3) {
      return {
        show: true,
        message: `Your trial expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Upgrade now to continue.`,
        severity: 'error',
      };
    }

    if (daysRemaining <= 7) {
      return {
        show: true,
        message: `Your trial expires in ${daysRemaining} days. Upgrade to keep your data and continue.`,
        severity: 'warning',
      };
    }

    return {
      show: false,
      message: '',
      severity: 'info',
    };
  },
};

