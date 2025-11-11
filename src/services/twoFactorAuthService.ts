import apiService from './apiService';

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryUrl?: string;
}

export interface TwoFactorVerifyRequest {
  verificationCode: string;
  secret: string;
}

export interface TwoFactorVerifyResponse {
  success: boolean;
  message: string;
  backupCodes?: string[];
}

export interface SecurityMetricsResponse {
  securityScore: number;
  activeSessions: number;
  failedAttempts: number;
  suspiciousActivities: number;
  accountLocked: boolean;
  lockoutUntil?: string;
  lastSuccessfulLogin?: string;
  recentActivities: SecurityActivity[];
}

export interface SecurityActivity {
  id: number;
  activityType: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  timestamp: string;
  status: string;
}

export interface ActiveSession {
  sessionId: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
  isCurrentSession: boolean;
}

export interface TwoFactorStatusResponse {
  isEnabled: boolean;
  enabledAt?: string;
  backupCodesRemaining: number;
  lastUsed?: string;
}

class TwoFactorAuthService {

  /**
   * Setup 2FA for the current user
   */
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    try {
      const response = await apiService.post<TwoFactorSetupResponse>('/api/v1/security/2fa/setup');
      return response;
    } catch (error: any) {
      console.error('2FA setup error:', error);
      throw new Error(error.message || 'Failed to setup 2FA');
    }
  }

  /**
   * Verify 2FA code during setup
   */
  async verifyTwoFactor(request: TwoFactorVerifyRequest): Promise<TwoFactorVerifyResponse> {
    try {
      const response = await apiService.post<TwoFactorVerifyResponse>('/api/v1/security/2fa/verify', request);
      return response;
    } catch (error: any) {
      console.error('2FA verification error:', error);
      throw new Error(error.message || 'Failed to verify 2FA code');
    }
  }

  /**
   * Disable 2FA for the current user
   */
  async disableTwoFactor(): Promise<void> {
    try {
      await apiService.post('/api/v1/security/2fa/disable');
    } catch (error: any) {
      console.error('2FA disable error:', error);
      throw new Error(error.message || 'Failed to disable 2FA');
    }
  }

  /**
   * Get 2FA status for the current user
   */
  async getTwoFactorStatus(): Promise<TwoFactorStatusResponse> {
    try {
      const response = await apiService.get<TwoFactorStatusResponse>('/api/v1/security/2fa/status');
      return response;
    } catch (error: any) {
      console.error('Get 2FA status error:', error);
      throw new Error(error.message || 'Failed to get 2FA status');
    }
  }

  /**
   * Generate new backup codes
   */
  async generateBackupCodes(): Promise<string[]> {
    try {
      const response = await apiService.post<string[]>('/api/v1/security/2fa/backup-codes/generate');
      return response;
    } catch (error: any) {
      console.error('Generate backup codes error:', error);
      throw new Error(error.message || 'Failed to generate backup codes');
    }
  }

  /**
   * Get security metrics for the current user
   */
  async getSecurityMetrics(): Promise<SecurityMetricsResponse> {
    try {
      const response = await apiService.get<SecurityMetricsResponse>('/api/v1/security/metrics');
      return response;
    } catch (error: any) {
      console.error('Get security metrics error:', error);
      throw new Error(error.message || 'Failed to get security metrics');
    }
  }

  /**
   * Get active sessions for the current user
   */
  async getActiveSessions(): Promise<ActiveSession[]> {
    try {
      const response = await apiService.get<ActiveSession[]>('/api/v1/security/sessions');
      return response;
    } catch (error: any) {
      console.error('Get active sessions error:', error);
      throw new Error(error.message || 'Failed to get active sessions');
    }
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: string): Promise<void> {
    try {
      await apiService.post(`/api/v1/security/sessions/${sessionId}/logout`);
    } catch (error: any) {
      console.error('Terminate session error:', error);
      throw new Error(error.message || 'Failed to terminate session');
    }
  }

  /**
   * Terminate all sessions except the current one
   */
  async terminateAllSessions(): Promise<void> {
    try {
      await apiService.post('/api/v1/security/sessions/logout-all');
    } catch (error: any) {
      console.error('Terminate all sessions error:', error);
      throw new Error(error.message || 'Failed to terminate all sessions');
    }
  }

  /**
   * Validate if a session is still active and secure
   */
  async validateSession(sessionId: string, currentIP: string): Promise<boolean> {
    try {
      const response = await apiService.post<boolean>(`/api/v1/security/sessions/${sessionId}/validate`, {
        currentIP
      });
      return response;
    } catch (error: any) {
      console.error('Validate session error:', error);
      return false;
    }
  }

  /**
   * Generate TOTP code for testing (development only)
   */
  generateTestTotpCode(secret: string): string {
    // This is a simplified TOTP implementation for testing
    // In production, this would be handled by the authenticator app
    const timestamp = Math.floor(Date.now() / 1000 / 30); // 30-second windows
    return timestamp.toString().slice(-6); // Last 6 digits for demo
  }

  /**
   * Validate TOTP code format
   */
  validateTotpCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }

  /**
   * Validate backup code format
   */
  validateBackupCode(code: string): boolean {
    return /^\d{8}$/.test(code);
  }

  /**
   * Get security recommendations based on current metrics
   */
  getSecurityRecommendations(metrics: SecurityMetricsResponse): string[] {
    const recommendations: string[] = [];

    if (metrics.failedAttempts > 0) {
      recommendations.push('Multiple failed login attempts detected. Consider changing your password.');
    }

    if (metrics.activeSessions > 3) {
      recommendations.push(`You have ${metrics.activeSessions} active sessions. Consider logging out unused sessions.`);
    }

    if (metrics.securityScore < 60) {
      recommendations.push('Your security score is low. Enable 2FA and review your active sessions.');
    }

    if (metrics.suspiciousActivities > 0) {
      recommendations.push('Suspicious activities detected. Review your login history and consider changing passwords.');
    }

    if (metrics.accountLocked) {
      recommendations.push('Your account is currently locked. Contact support if you need immediate access.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your account security looks good! Keep practicing good security habits.');
    }

    return recommendations;
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();
export default twoFactorAuthService;
