import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield,
  Smartphone,
  Key,
  CheckCircle,
  AlertCircle,
  QrCode,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Clock,
  MapPin,
  Monitor,
  AlertTriangle,
  Lock,
  Unlock,
  Activity,
  Users,
  TrendingUp,
  Calendar,
  Globe,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import apiService from "@/services/apiService";
import twoFactorAuthService from "@/services/twoFactorAuthService";

interface TwoFactorAuthProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface SecurityMetrics {
  failedAttempts: number;
  suspiciousActivities: number;
  lastSuccessfulLogin?: string;
  activeSessions: number;
  accountLocked: boolean;
  lockoutUntil?: string;
  securityScore: number;
  recentActivities: SecurityActivity[];
}

interface SecurityActivity {
  id: number;
  activityType: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  timestamp: string;
  status: string;
}

interface ActiveSession {
  sessionId: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  deviceInfo: string;
  location: string;
  isCurrentSession: boolean;
}

export function EnhancedTwoFactorAuth({ isEnabled, onToggle }: TwoFactorAuthProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // 2FA Setup State
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);

  // Security Monitoring State
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Load security metrics and active sessions
  useEffect(() => {
    if (isEnabled) {
      loadSecurityMetrics();
      loadActiveSessions();
    }
  }, [isEnabled]);

  const loadSecurityMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const response = await twoFactorAuthService.getSecurityMetrics();
      setSecurityMetrics(response);
    } catch (error: any) {
      console.error('Failed to load security metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const response = await twoFactorAuthService.getActiveSessions();
      setActiveSessions(response || []);
    } catch (error: any) {
      console.error('Failed to load active sessions:', error);
    }
  };

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      // Generate 2FA setup data from backend
      const response = await apiService.post('/api/v1/security/2fa/setup');
      setTwoFactorSetup(response);
      setShowQR(true);

      toast({
        title: "2FA Setup Started",
        description: "Scan the QR code with your authenticator app.",
      });
    } catch (error: any) {
      console.error('2FA setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.post('/api/v1/security/2fa/verify', {
        verificationCode,
        secret: twoFactorSetup?.secret
      });

      if (response.success) {
        onToggle(true);
        setShowQR(false);
        setVerificationCode("");
        setBackupCodes(response.backupCodes || []);
        setShowBackupCodes(true);

        // Reload security metrics
        await loadSecurityMetrics();

        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been successfully enabled.",
        });
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    try {
      await apiService.post('/api/v1/security/2fa/disable');

      onToggle(false);
      setShowQR(false);
      setVerificationCode("");
      setBackupCodes([]);
      setShowBackupCodes(false);
      setTwoFactorSetup(null);

      // Reload security metrics
      await loadSecurityMetrics();

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    } catch (error: any) {
      console.error('2FA disable error:', error);
      toast({
        title: "Disable Failed",
        description: error.message || "Failed to disable 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceLogout = async (sessionId: string) => {
    try {
      await apiService.post(`/api/v1/security/sessions/${sessionId}/logout`);

      // Reload active sessions
      await loadActiveSessions();

      toast({
        title: "Session Terminated",
        description: "The session has been successfully terminated.",
      });
    } catch (error: any) {
      console.error('Force logout error:', error);
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to terminate session.",
        variant: "destructive",
      });
    }
  };

  const handleForceLogoutAll = async () => {
    try {
      await apiService.post('/api/v1/security/sessions/logout-all');

      // Reload active sessions
      await loadActiveSessions();

      toast({
        title: "All Sessions Terminated",
        description: "All other sessions have been terminated.",
      });
    } catch (error: any) {
      console.error('Force logout all error:', error);
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to terminate sessions.",
        variant: "destructive",
      });
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard.",
    });
  };

  const downloadBackupCodes = () => {
    const content = `INSPOCRM Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nIMPORTANT: Keep these codes safe. Each can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inspocrm-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Backup Codes Downloaded",
      description: "Backup codes have been saved to your device.",
    });
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSecurityScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* 2FA Setup/Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 2FA Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Disabled
                </Badge>
              )}
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {isEnabled ? "Your account is protected with 2FA" : "Enable 2FA for enhanced security"}
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={isEnabled ? handleDisable2FA : handleEnable2FA}
              disabled={isLoading}
            />
          </div>

          {/* Setup Instructions */}
          {!isEnabled && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Why enable 2FA?</strong> Two-factor authentication adds an extra layer of security by requiring
                a second form of verification in addition to your password. Even if someone gets your password, they won't
                be able to access your account without your phone or authenticator app.
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code Setup */}
          {showQR && !isEnabled && twoFactorSetup && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="text-center">
                <QrCode className="h-16 w-16 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-2">Scan QR Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <img
                    src={twoFactorSetup.qrCodeUrl}
                    alt="2FA QR Code"
                    className="w-32 h-32"
                  />
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Manual Entry Code</Label>
                <div className="flex items-center gap-2 p-3 bg-white rounded border font-mono text-sm">
                  <span className="flex-1">{twoFactorSetup.secret}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(twoFactorSetup.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter this code manually in your authenticator app if QR code doesn't work
                </p>
              </div>

              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="verificationCode"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                  />
                  <Button onClick={handleVerify2FA} disabled={isLoading || verificationCode.length !== 6}>
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            </div>
          )}

          {/* Backup Codes */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-800">Backup Codes Generated</h3>
                  <p className="text-sm text-yellow-700">
                    Save these codes in a safe place. You can use them to access your account if you lose your device.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-center">
                    {code}
                  </div>
                ))}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  <strong>Important:</strong> Each backup code can only be used once. Generate new codes if you use them all.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Security Tips */}
          <div className="space-y-3">
            <h4 className="font-medium">Security Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use an authenticator app instead of SMS for better security</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Keep your backup codes in a safe, offline location</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Never share your verification codes with anyone</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Generate new backup codes regularly</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Metrics Dashboard */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Security Dashboard
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Monitor your account security and active sessions
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Security Score */}
            {securityMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className={`text-2xl font-bold ${getSecurityScoreColor(securityMetrics.securityScore)}`}>
                    {securityMetrics.securityScore}%
                  </div>
                  <p className="text-sm text-muted-foreground">Security Score</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {securityMetrics.activeSessions}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className={`text-2xl font-bold ${securityMetrics.failedAttempts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {securityMetrics.failedAttempts}
                  </div>
                  <p className="text-sm text-muted-foreground">Failed Attempts</p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <div className={`text-2xl font-bold ${securityMetrics.suspiciousActivities > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {securityMetrics.suspiciousActivities}
                  </div>
                  <p className="text-sm text-muted-foreground">Suspicious Activities</p>
                </div>
              </div>
            )}

            {/* Security Alerts */}
            {securityMetrics && (securityMetrics.accountLocked || securityMetrics.failedAttempts > 3) && (
              <Alert variant={securityMetrics.accountLocked ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {securityMetrics.accountLocked ? (
                    <div>
                      <strong>Account Temporarily Locked</strong>
                      <p className="mt-1">
                        Your account has been locked due to multiple failed login attempts.
                        {securityMetrics.lockoutUntil && (
                          <> It will be unlocked at {new Date(securityMetrics.lockoutUntil).toLocaleString()}</>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <strong>Multiple Failed Attempts Detected</strong>
                      <p className="mt-1">
                        {securityMetrics.failedAttempts} failed login attempts detected.
                        Consider changing your password if you don't recognize these attempts.
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Active Sessions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Active Sessions</h3>
                {activeSessions.length > 1 && (
                  <Button variant="outline" size="sm" onClick={handleForceLogoutAll}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout All Other Sessions
                  </Button>
                )}
              </div>

              {activeSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active sessions found
                </p>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Login Time</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.map((session) => (
                        <TableRow key={session.sessionId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{session.deviceInfo}</p>
                                <p className="text-xs text-muted-foreground">{session.ipAddress}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{session.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{new Date(session.loginTime).toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{new Date(session.lastActivity).toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            {session.isCurrentSession ? (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                Current Session
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleForceLogout(session.sessionId)}
                              >
                                <LogOut className="h-3 w-3 mr-1" />
                                Logout
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Recent Security Activities */}
            {securityMetrics && securityMetrics.recentActivities.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Recent Security Activities</h3>
                <div className="space-y-2">
                  {securityMetrics.recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.status === 'SUCCESS' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {activity.status === 'FAILED' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {activity.status === 'WARNING' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        <div>
                          <p className="font-medium text-sm">
                            {activity.activityType.replace(/_/g, ' ').toLowerCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.ipAddress} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={activity.status === 'SUCCESS' ? 'outline' : 'destructive'}
                        className={activity.status === 'SUCCESS' ?
                          'text-green-600 border-green-200 bg-green-50' :
                          'text-red-600 border-red-200 bg-red-50'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Recommendations */}
            <div className="space-y-4">
              <h3 className="font-semibold">Security Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityMetrics && securityMetrics.failedAttempts > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Change Password</strong>
                      <p className="mt-1 text-sm">
                        Multiple failed login attempts detected. Consider changing your password.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {activeSessions.length > 2 && (
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Multiple Active Sessions</strong>
                      <p className="mt-1 text-sm">
                        You have {activeSessions.length} active sessions. Consider logging out unused sessions.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enable Login Notifications</strong>
                    <p className="mt-1 text-sm">
                      Get notified when your account is accessed from new devices or locations.
                    </p>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Regular Security Review</strong>
                    <p className="mt-1 text-sm">
                      Review your login history and active sessions regularly for suspicious activity.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
