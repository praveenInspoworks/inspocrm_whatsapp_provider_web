import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { trialService, TrialStatus } from '@/services/trialService';
import { useNavigate } from 'react-router-dom';

export function TrialBanner() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [warning, setWarning] = useState<{ show: boolean; message: string; severity: 'info' | 'warning' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrialStatus();
    const interval = setInterval(loadTrialStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadTrialStatus = async () => {
    try {
      const status = await trialService.getTrialStatus();
      setTrialStatus(status);
      
      if (status.isTrial && !status.isExpired) {
        const warningInfo = trialService.getTrialWarning(status.daysRemaining);
        setWarning(warningInfo.show ? warningInfo : null);
      } else {
        setWarning(null);
      }
    } catch (error) {
      console.error('Failed to load trial status:', error);
    }
  };

  if (!trialStatus?.isTrial || !warning?.show) {
    return null;
  }

  return (
    <Alert
      className={`mb-4 ${
        warning.severity === 'error'
          ? 'border-red-500 bg-red-50'
          : warning.severity === 'warning'
          ? 'border-orange-500 bg-orange-50'
          : 'border-blue-500 bg-blue-50'
      }`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className={warning.severity === 'error' ? 'text-red-800' : warning.severity === 'warning' ? 'text-orange-800' : 'text-blue-800'}>
          {warning.message}
        </span>
        {trialStatus.canConvert && (
          <Button
            variant={warning.severity === 'error' ? 'default' : 'outline'}
            size="sm"
            onClick={() => navigate('/subscription')}
            className="ml-4"
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

