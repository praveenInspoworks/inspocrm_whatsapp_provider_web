/* eslint-disable @typescript-eslint/no-explicit-any */
import { post, get, del } from './apiService';
import { toast } from 'sonner';

export interface DataExportRequest {
  format?: 'JSON' | 'CSV' | 'XLSX';
  includeTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DataExportResponse {
  exportId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  expiresAt?: string;
  estimatedCompletionTime?: string;
}

export interface DataDeletionRequest {
  reason?: string;
  confirmation: string; // User must type "DELETE" to confirm
}

export interface ConsentPreferences {
  marketing: boolean;
  analytics: boolean;
  required: boolean; // Always true, cannot be disabled
}

export interface PrivacySettings {
  dataRetentionDays?: number;
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  consentPreferences: ConsentPreferences;
}

export const gdprService = {
  // Request data export (GDPR right to data portability)
  async requestDataExport(request?: DataExportRequest): Promise<DataExportResponse> {
    try {
      const response = await post<DataExportResponse>('/api/v1/gdpr/export', request || {});
      toast.success('Data export requested. You will receive an email when it\'s ready.');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to request data export';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Check export status
  async getExportStatus(exportId: string): Promise<DataExportResponse> {
    try {
      const response = await get<DataExportResponse>(`/api/v1/gdpr/export/${exportId}/status`);
      return response;
    } catch (error: any) {
      console.error('Failed to get export status:', error);
      throw error;
    }
  },

  // Download exported data
  async downloadExport(exportId: string): Promise<void> {
    try {
      const response = await get<Blob>(`/api/v1/gdpr/export/${exportId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hotkup-data-export-${exportId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Data export downloaded successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to download export';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Request data deletion (GDPR right to be forgotten)
  async requestDataDeletion(request: DataDeletionRequest): Promise<void> {
    try {
      if (request.confirmation !== 'DELETE') {
        throw new Error('Please type "DELETE" to confirm data deletion');
      }

      await post('/api/v1/gdpr/delete', {
        reason: request.reason,
      });

      toast.success('Data deletion requested. Your account will be deleted within 30 days.');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to request data deletion';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Cancel data deletion request
  async cancelDataDeletion(): Promise<void> {
    try {
      await post('/api/v1/gdpr/delete/cancel', {});
      toast.success('Data deletion request cancelled');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to cancel deletion request';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Get privacy settings
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const response = await get<PrivacySettings>('/api/v1/gdpr/privacy-settings');
      return response;
    } catch (error: any) {
      console.error('Failed to get privacy settings:', error);
      // Return defaults
      return {
        allowDataExport: true,
        allowDataDeletion: true,
        consentPreferences: {
          marketing: false,
          analytics: true,
          required: true,
        },
      };
    }
  },

  // Update privacy settings
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const response = await post<PrivacySettings>('/api/v1/gdpr/privacy-settings', settings);
      toast.success('Privacy settings updated');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update privacy settings';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Update consent preferences
  async updateConsentPreferences(preferences: ConsentPreferences): Promise<void> {
    try {
      await post('/api/v1/gdpr/consent', preferences);
      toast.success('Consent preferences updated');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update consent preferences';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Get data processing information
  async getDataProcessingInfo(): Promise<{
    dataTypes: string[];
    purposes: string[];
    retentionPeriod: number;
    thirdParties: Array<{
      name: string;
      purpose: string;
      dataTypes: string[];
    }>;
  }> {
    try {
      const response = await get('/api/v1/gdpr/data-processing-info');
      return response;
    } catch (error: any) {
      console.error('Failed to get data processing info:', error);
      // Return defaults
      return {
        dataTypes: ['Personal information', 'Usage data', 'Communication data'],
        purposes: ['Service provision', 'Analytics', 'Support'],
        retentionPeriod: 365,
        thirdParties: [],
      };
    }
  },
};

