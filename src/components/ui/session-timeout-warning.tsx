import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useSessionTimeoutWarning } from '@/hooks/use-session-timeout';

interface SessionTimeoutWarningProps {
  isVisible: boolean;
  remainingTime: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({
  isVisible,
  remainingTime,
  onExtend,
  onLogout
}: SessionTimeoutWarningProps) {
  const { hideWarning } = useSessionTimeoutWarning();

  // Format remaining time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Auto-logout when time reaches 0
  useEffect(() => {
    if (remainingTime <= 0 && isVisible) {
      onLogout();
    }
  }, [remainingTime, isVisible, onLogout]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        {/* Modal Content */}
        <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
            <div className="flex items-center justify-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <h3 className="text-white text-xl font-bold text-center">
                Session Timeout Warning
              </h3>
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-center space-y-4">
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">
                  Your session will expire soon
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Due to inactivity, your session will automatically expire in:
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="text-3xl font-mono font-bold text-orange-600 text-center">
                  {formatTime(remainingTime)}
                </div>
                <p className="text-xs text-orange-700 text-center mt-1">
                  minutes:seconds
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500">
                Click "Stay Logged In" to extend your session, or you'll be automatically logged out.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            <Button
              onClick={onExtend}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              Stay Logged In
            </Button>

            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold py-3 rounded-xl transition-all duration-200"
            >
              Logout Now
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={hideWarning}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

// Hook to integrate session timeout with warning modal
export const useSessionTimeoutWithWarning = (options?: {
  timeout?: number;
  promptBefore?: number;
}) => {
  const { useSessionTimeout, useSessionTimeoutWarning } = require('@/hooks/use-session-timeout');

  const { showWarning, remainingTime, extendSession } = useSessionTimeout({
    ...options,
    onWarning: (timeLeft: number) => {
      warningModal.showWarning(timeLeft);
    }
  });

  const warningModal = useSessionTimeoutWarning();

  const handleExtend = () => {
    extendSession();
    warningModal.hideWarning();
  };

  const handleLogout = () => {
    // This will trigger the timeout handler in useSessionTimeout
    warningModal.hideWarning();
  };

  return {
    showWarning,
    remainingTime,
    warningModal: {
      ...warningModal,
      onExtend: handleExtend,
      onLogout: handleLogout
    }
  };
};
