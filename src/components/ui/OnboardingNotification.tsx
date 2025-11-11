import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { onboardingService, OnboardingStatus, OnboardingProgress } from '@/services/onboardingService';
import { useNavigate } from 'react-router-dom';

interface OnboardingNotificationProps {
  className?: string;
  onDismiss?: () => void;
}

export const OnboardingNotification: React.FC<OnboardingNotificationProps> = ({
  className = '',
  onDismiss
}) => {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      const [status, progress] = await Promise.all([
        onboardingService.getOnboardingStatus(),
        Promise.resolve(onboardingService.getOnboardingProgress())
      ]);

      setOnboardingStatus(status);
      setOnboardingProgress(progress);
    } catch (error) {
      console.error('Failed to load onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToOnboarding = () => {
    navigate('/profile');
    // Dismiss the notification after navigation
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if onboarding is complete or dismissed
  if (isDismissed || onboardingStatus?.isOnboardingComplete || isLoading) {
    return null;
  }

  // Don't show if no onboarding data
  if (!onboardingStatus || !onboardingProgress) {
    return null;
  }

  const progressPercentage = Math.round((onboardingProgress.currentStep / onboardingProgress.totalSteps) * 100);

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-base text-blue-900">
                Complete Your Onboarding
              </CardTitle>
              <CardDescription className="text-blue-700">
                Finish setting up your organization to unlock full platform features
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 text-blue-600 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-800">Progress</span>
            <span className="font-medium text-blue-900">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Current Step */}
        <Alert className="bg-blue-100 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Current:</strong> {onboardingProgress.currentStepName}
            {onboardingProgress.nextStepName && (
              <> → <strong>Next:</strong> {onboardingProgress.nextStepName}</>
            )}
          </AlertDescription>
        </Alert>

        {/* Organization Info */}
        {onboardingStatus.tenantInfo && (
          <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <strong>{onboardingStatus.tenantInfo.companyName}</strong>
            {onboardingStatus.tenantInfo.tenantCode && (
              <span className="ml-2">({onboardingStatus.tenantInfo.tenantCode})</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleGoToOnboarding}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            Complete Setup
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Later
          </Button>
        </div>

        {/* Benefits Preview */}
        <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
          <p className="font-medium mb-1">Complete onboarding to unlock:</p>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Team Management</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Advanced Analytics</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Priority Support</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Full Integrations</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingNotification;
