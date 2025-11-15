import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { usageQuotaService, QuotaType } from '@/services/usageQuotaService';
import { UsageMetrics } from '@/services/subscriptionService';
import { useNavigate } from 'react-router-dom';

interface UsageQuotaIndicatorProps {
  quotaType: QuotaType;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function UsageQuotaIndicator({
  quotaType,
  showUpgradeButton = true,
  compact = false,
}: UsageQuotaIndicatorProps) {
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const metrics = await usageQuotaService.getUsageMetrics();
      setUsage(metrics);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return null;
  }

  const metric = usage[quotaType];
  if (!metric || metric.limit === -1) {
    return null; // Unlimited, don't show
  }

  const percentage = metric.percentage;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground capitalize">{quotaType}:</span>
        <span className={isCritical ? 'text-red-600 font-semibold' : isWarning ? 'text-orange-600' : ''}>
          {metric.used.toLocaleString()} / {metric.limit.toLocaleString()}
        </span>
        {isWarning && (
          <AlertTriangle className="w-4 h-4 text-orange-600" />
        )}
      </div>
    );
  }

  return (
    <Card className={isCritical ? 'border-red-500' : isWarning ? 'border-orange-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base capitalize">{quotaType} Usage</CardTitle>
          {isCritical ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-semibold">
              {metric.used.toLocaleString()} / {metric.limit.toLocaleString()}
            </span>
          </div>
          <Progress
            value={percentage}
            className={`h-3 ${
              isCritical
                ? '[&>div]:bg-red-600'
                : isWarning
                ? '[&>div]:bg-orange-600'
                : '[&>div]:bg-green-600'
            }`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage.toFixed(1)}% used</span>
            <span>{metric.limit - metric.used} remaining</span>
          </div>
          {isCritical && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You've reached your {quotaType} limit. Upgrade your plan to continue.
                {showUpgradeButton && (
                  <Button
                    variant="link"
                    className="ml-2 p-0 h-auto text-white"
                    onClick={() => navigate('/subscription')}
                  >
                    Upgrade Now
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          {isWarning && !isCritical && (
            <Alert className="border-orange-500 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You're approaching your {quotaType} limit ({percentage.toFixed(0)}% used).
                {showUpgradeButton && (
                  <Button
                    variant="link"
                    className="ml-2 p-0 h-auto text-orange-800"
                    onClick={() => navigate('/subscription')}
                  >
                    Upgrade to get more
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

