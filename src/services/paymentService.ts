/* eslint-disable @typescript-eslint/no-explicit-any */
import { post, get } from './apiService';
import { toast } from 'sonner';

// Stripe Payment Interfaces
export interface StripeConfig {
  publishableKey: string;
  accountId?: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
}

export interface SetupIntent {
  id: string;
  clientSecret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
}

export interface PaymentMethodData {
  type: 'card';
  card: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
}

export interface CreateSetupIntentRequest {
  usage?: 'on_session' | 'off_session';
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
  requiresAction?: boolean;
}

export const paymentService = {
  // Get Stripe configuration
  async getStripeConfig(): Promise<StripeConfig> {
    try {
      const response = await get<StripeConfig>('/api/v1/payment/stripe/config');
      return response;
    } catch (error: any) {
      console.error('Failed to get Stripe config:', error);
      // Return test key for development
      if (import.meta.env.DEV) {
        return {
          publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
        };
      }
      throw error;
    }
  },

  // Create payment intent for one-time payment
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    try {
      const response = await post<PaymentIntent>('/api/v1/payment/stripe/payment-intent', request);
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create payment intent';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Confirm payment
  async confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentResult> {
    try {
      const response = await post<PaymentResult>('/api/v1/payment/stripe/confirm', request);
      if (response.success) {
        toast.success('Payment processed successfully!');
      }
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Payment failed';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Create setup intent for saving payment method
  async createSetupIntent(request?: CreateSetupIntentRequest): Promise<SetupIntent> {
    try {
      const response = await post<SetupIntent>('/api/v1/payment/stripe/setup-intent', request || {});
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create setup intent';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Confirm setup intent
  async confirmSetupIntent(setupIntentId: string, paymentMethodId?: string): Promise<PaymentResult> {
    try {
      const response = await post<PaymentResult>('/api/v1/payment/stripe/setup-intent/confirm', {
        setupIntentId,
        paymentMethodId,
      });
      if (response.success) {
        toast.success('Payment method saved successfully');
      }
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save payment method';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Process subscription payment
  async processSubscriptionPayment(planId: string, billingCycle: 'MONTHLY' | 'YEARLY', paymentMethodId?: string): Promise<PaymentResult> {
    try {
      const response = await post<PaymentResult>('/api/v1/payment/stripe/subscription', {
        planId,
        billingCycle,
        paymentMethodId,
      });
      if (response.success) {
        toast.success('Subscription activated successfully!');
      }
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to process subscription payment';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Handle payment webhook (called by backend)
  async handleWebhook(webhookData: any): Promise<void> {
    try {
      await post('/api/v1/payment/stripe/webhook', webhookData);
    } catch (error: any) {
      console.error('Failed to handle payment webhook:', error);
      throw error;
    }
  },
};

