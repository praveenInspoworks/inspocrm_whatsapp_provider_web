import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './use-auth';

interface SessionTimeoutOptions {
  timeout?: number; // in milliseconds (default: 30 minutes)
  promptBefore?: number; // show warning before logout (default: 5 minutes)
  onTimeout?: () => void;
  onWarning?: (remainingTime: number) => void;
}

export const useSessionTimeout = (options: SessionTimeoutOptions = {}) => {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes in milliseconds
    promptBefore = 5 * 60 * 1000, // 5 minutes before timeout
    onTimeout,
    onWarning
  } = options;

  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Reset the timeout timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setRemainingTime(0);

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Set warning timer
    warningRef.current = setTimeout(() => {
      const timeLeft = Math.ceil((timeout - promptBefore) / 1000);
      setRemainingTime(timeLeft);
      setShowWarning(true);
      onWarning?.(timeLeft);
    }, timeout - promptBefore);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeout);
  }, [timeout, promptBefore, onWarning]);

  // Handle session timeout
  const handleTimeout = useCallback(async () => {
    try {
      console.log('🔒 Session expired due to inactivity, logging out...');

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }

      // Call custom timeout handler if provided
      onTimeout?.();

      // Perform logout
      await logout();

      // Navigate to login page
      navigate('/login', {
        state: {
          message: 'Your session has expired due to inactivity. Please log in again.',
          type: 'info'
        }
      });
    } catch (error) {
      console.error('❌ Error during session timeout logout:', error);
      // Force navigation even if logout fails
      navigate('/login', {
        state: {
          message: 'Session expired. Please log in again.',
          type: 'error'
        }
      });
    }
  }, [logout, navigate, onTimeout]);

  // Extend session (called when user wants to stay logged in)
  const extendSession = useCallback(() => {
    console.log('⏰ Session extended by user');
    resetTimer();
  }, [resetTimer]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    // Only reset if it's been more than 1 second since last activity
    // to avoid excessive resets on rapid events
    if (Date.now() - lastActivityRef.current > 1000) {
      resetTimer();
    }
  }, [resetTimer]);

  // Set up activity listeners
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [handleActivity, resetTimer]);

  // Update remaining time every second when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((timeout - elapsed) / 1000));
      setRemainingTime(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, timeout, handleTimeout]);

  return {
    showWarning,
    remainingTime,
    extendSession,
    resetTimer
  };
};

// Hook for displaying session timeout warning modal
export const useSessionTimeoutWarning = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const showWarning = useCallback((timeLeft: number) => {
    setRemainingTime(timeLeft);
    setIsVisible(true);
  }, []);

  const hideWarning = useCallback(() => {
    setIsVisible(false);
    setRemainingTime(0);
  }, []);

  return {
    isVisible,
    remainingTime,
    showWarning,
    hideWarning
  };
};
