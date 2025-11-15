/* eslint-disable @typescript-eslint/no-explicit-any */
import { get } from './apiService';
import { subscriptionService } from './subscriptionService';

export type FeatureFlag = 
  | 'AI_CONTENT_GENERATION'
  | 'ADVANCED_ANALYTICS'
  | 'API_ACCESS'
  | 'WEBHOOK_SUPPORT'
  | 'CUSTOM_INTEGRATIONS'
  | 'DEDICATED_SUPPORT'
  | 'SLA_GUARANTEE'
  | 'ACCOUNT_MANAGER'
  | 'BULK_OPERATIONS'
  | 'ADVANCED_SCHEDULING'
  | 'AUTO_REPLY'
  | 'CAMPAIGN_OPTIMIZATION'
  | 'A_B_TESTING'
  | 'WHITE_LABEL';

export interface FeatureFlagConfig {
  feature: FeatureFlag;
  enabled: boolean;
  planRequirement?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  description: string;
}

// Feature flags configuration based on plans
const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  AI_CONTENT_GENERATION: {
    feature: 'AI_CONTENT_GENERATION',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'AI-powered content generation for messages and campaigns',
  },
  ADVANCED_ANALYTICS: {
    feature: 'ADVANCED_ANALYTICS',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'Advanced analytics and reporting dashboards',
  },
  API_ACCESS: {
    feature: 'API_ACCESS',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'REST API access for integrations',
  },
  WEBHOOK_SUPPORT: {
    feature: 'WEBHOOK_SUPPORT',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'Webhook support for real-time events',
  },
  CUSTOM_INTEGRATIONS: {
    feature: 'CUSTOM_INTEGRATIONS',
    enabled: true,
    planRequirement: 'ENTERPRISE',
    description: 'Custom integrations and connectors',
  },
  DEDICATED_SUPPORT: {
    feature: 'DEDICATED_SUPPORT',
    enabled: true,
    planRequirement: 'ENTERPRISE',
    description: 'Dedicated support channel',
  },
  SLA_GUARANTEE: {
    feature: 'SLA_GUARANTEE',
    enabled: true,
    planRequirement: 'ENTERPRISE',
    description: 'Service level agreement guarantee',
  },
  ACCOUNT_MANAGER: {
    feature: 'ACCOUNT_MANAGER',
    enabled: true,
    planRequirement: 'ENTERPRISE',
    description: 'Dedicated account manager',
  },
  BULK_OPERATIONS: {
    feature: 'BULK_OPERATIONS',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'Bulk import/export and operations',
  },
  ADVANCED_SCHEDULING: {
    feature: 'ADVANCED_SCHEDULING',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'Advanced campaign scheduling',
  },
  AUTO_REPLY: {
    feature: 'AUTO_REPLY',
    enabled: true,
    planRequirement: 'BASIC',
    description: 'Automated reply rules',
  },
  CAMPAIGN_OPTIMIZATION: {
    feature: 'CAMPAIGN_OPTIMIZATION',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'AI-powered campaign optimization',
  },
  A_B_TESTING: {
    feature: 'A_B_TESTING',
    enabled: true,
    planRequirement: 'PREMIUM',
    description: 'A/B testing for campaigns',
  },
  WHITE_LABEL: {
    feature: 'WHITE_LABEL',
    enabled: true,
    planRequirement: 'ENTERPRISE',
    description: 'White-label customization',
  },
};

export const featureFlagsService = {
  // Get all feature flags for current subscription
  async getFeatureFlags(): Promise<Record<FeatureFlag, boolean>> {
    try {
      const subscription = await subscriptionService.getSubscription();
      const flags: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;

      // Determine plan level
      const planLevel = subscription.plan === 'ENTERPRISE' ? 3 :
                       subscription.plan === 'PREMIUM' ? 2 :
                       subscription.plan === 'BASIC' ? 1 : 0;

      // Check each feature flag
      for (const [key, config] of Object.entries(FEATURE_FLAGS)) {
        const feature = key as FeatureFlag;
        
        if (!config.planRequirement) {
          flags[feature] = config.enabled;
          continue;
        }

        const requiredLevel = config.planRequirement === 'ENTERPRISE' ? 3 :
                             config.planRequirement === 'PREMIUM' ? 2 : 1;

        flags[feature] = config.enabled && planLevel >= requiredLevel;
      }

      return flags;
    } catch (error: any) {
      console.error('Failed to get feature flags:', error);
      // Return all enabled for development
      if (import.meta.env.DEV) {
        const flags: Record<FeatureFlag, boolean> = {} as Record<FeatureFlag, boolean>;
        for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlag[]) {
          flags[key] = true;
        }
        return flags;
      }
      throw error;
    }
  },

  // Check if specific feature is enabled
  async isFeatureEnabled(feature: FeatureFlag): Promise<boolean> {
    try {
      const flags = await this.getFeatureFlags();
      return flags[feature] || false;
    } catch (error: any) {
      console.error('Failed to check feature flag:', error);
      // Allow in development
      return import.meta.env.DEV;
    }
  },

  // Get feature flag configuration
  getFeatureConfig(feature: FeatureFlag): FeatureFlagConfig {
    return FEATURE_FLAGS[feature];
  },

  // Get all feature flag configurations
  getAllFeatureConfigs(): FeatureFlagConfig[] {
    return Object.values(FEATURE_FLAGS);
  },

  // Check if feature requires upgrade
  async requiresUpgrade(feature: FeatureFlag): Promise<boolean> {
    try {
      const enabled = await this.isFeatureEnabled(feature);
      if (enabled) return false;

      const config = FEATURE_FLAGS[feature];
      return !!config.planRequirement;
    } catch (error: any) {
      console.error('Failed to check upgrade requirement:', error);
      return false;
    }
  },

  // Get required plan for feature
  getRequiredPlan(feature: FeatureFlag): 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | null {
    return FEATURE_FLAGS[feature].planRequirement || null;
  },
};

