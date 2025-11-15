/* eslint-disable @typescript-eslint/no-explicit-any */
// Sentry Error Tracking
// Lightweight implementation that can be replaced with @sentry/react if needed

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  error?: Error;
  context?: Record<string, any>;
}

class ErrorTracker {
  private enabled: boolean;
  private dsn: string | null;
  private environment: string;

  constructor() {
    this.enabled = import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN;
    this.dsn = import.meta.env.VITE_SENTRY_DSN || null;
    this.environment = import.meta.env.MODE || 'development';
  }

  init() {
    if (!this.enabled || !this.dsn) {
      console.log('Error tracking disabled (no DSN or not in production)');
      return;
    }

    // In production, you would initialize Sentry here
    // For now, we'll use console logging with structured format
    console.log('Error tracking initialized');
  }

  captureException(error: Error, context?: Record<string, any>) {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      context,
    };

    if (this.enabled && this.dsn) {
      // In production, send to Sentry
      // For now, log with structure
      console.error('Error captured:', errorInfo);
      
      // You can also send to your backend for logging
      this.sendToBackend(errorInfo).catch(console.error);
    } else {
      console.error('Error:', errorInfo);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (this.enabled && this.dsn) {
      console[level]('Message captured:', { message, level, context });
      this.sendToBackend({ message, context, level }).catch(console.error);
    } else {
      console[level](message, context);
    }
  }

  setUser(user: { id: string | number; email?: string; username?: string }) {
    if (this.enabled) {
      console.log('User context set:', user);
      // In production, set Sentry user context
    }
  }

  setContext(key: string, context: Record<string, any>) {
    if (this.enabled) {
      console.log(`Context set [${key}]:`, context);
      // In production, set Sentry context
    }
  }

  private async sendToBackend(errorInfo: ErrorInfo) {
    try {
      // Send to your backend logging endpoint
      await fetch('/api/v1/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorInfo,
          environment: this.environment,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // Silently fail - don't break the app
      console.error('Failed to send error to backend:', error);
    }
  }
}

export const errorTracker = new ErrorTracker();

export function initSentry() {
  errorTracker.init();
}

export function captureException(error: Error, context?: Record<string, any>) {
  errorTracker.captureException(error, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  errorTracker.captureMessage(message, level, context);
}

export function setUser(user: { id: string | number; email?: string; username?: string }) {
  errorTracker.setUser(user);
}

export function setContext(key: string, context: Record<string, any>) {
  errorTracker.setContext(key, context);
}

