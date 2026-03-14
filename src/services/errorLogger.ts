/**
 * ErrorLogger Service - Centralized Error Logging & Reporting
 * 
 * Purpose:
 * - Centralize all error handling across the app
 * - Provide consistent error tracking and reporting
 * - Support multiple error destinations (console, backend, Sentry, etc.)
 * - Safe logging (no sensitive data in production)
 * 
 * Usage:
 *   import { ErrorLogger } from '@services/errorLogger';
 * 
 *   // Log an error
 *   ErrorLogger.logError('ComponentName', error, { userId: 123 });
 * 
 *   // Log a warning
 *   ErrorLogger.logWarning('ServiceName', 'Something unexpected happened');
 * 
 *   // Get error summary
 *   const summary = ErrorLogger.getErrorSummary();
 */

export type ErrorLevel = 'error' | 'warning' | 'info';

export interface ErrorLogEntry {
  timestamp: Date;
  level: ErrorLevel;
  context: string; // Component/Service name
  message: string;
  error?: Error;
  stack?: string;
  metadata?: Record<string, unknown>;
  errorId: string; // Unique identifier for this error
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByContext: Record<string, number>;
  errorsByLevel: Record<ErrorLevel, number>;
  lastError?: ErrorLogEntry;
}

/**
 * ErrorLogger Service
 * 
 * Singleton service for centralized error logging
 * Stores error history, provides reporting, and sends to external services
 */
class ErrorLoggerService {
  private static instance: ErrorLoggerService;
  private errorHistory: ErrorLogEntry[] = [];
  private maxHistorySize = 100; // Keep last 100 errors in memory
  private errorCounters = {
    total: 0,
    byContext: {} as Record<string, number>,
    byLevel: { error: 0, warning: 0, info: 0 } as Record<ErrorLevel, number>
  };

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorLoggerService {
    if (!ErrorLoggerService.instance) {
      ErrorLoggerService.instance = new ErrorLoggerService();
    }
    return ErrorLoggerService.instance;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an error
   * @param context - Component or service name
   * @param error - Error object or message
   * @param metadata - Additional metadata
   */
  public logError(
    context: string,
    error: Error | string,
    metadata?: Record<string, unknown>
  ): string {
    return this.log('error', context, error, metadata);
  }

  /**
   * Log a warning
   * @param context - Component or service name
   * @param message - Warning message
   * @param metadata - Additional metadata
   */
  public logWarning(
    context: string,
    message: string,
    metadata?: Record<string, unknown>
  ): string {
    return this.log('warning', context, message, metadata);
  }

  /**
   * Log info message
   * @param context - Component or service name
   * @param message - Info message
   * @param metadata - Additional metadata
   */
  public logInfo(
    context: string,
    message: string,
    metadata?: Record<string, unknown>
  ): string {
    return this.log('info', context, message, metadata);
  }

  /**
   * Internal logging method
   */
  private log(
    level: ErrorLevel,
    context: string,
    errorOrMessage: Error | string,
    metadata?: Record<string, unknown>
  ): string {
    const errorId = this.generateErrorId();
    const timestamp = new Date();

    // Extract error details
    let message: string;
    let error: Error | undefined;
    let stack: string | undefined;

    if (typeof errorOrMessage === 'string') {
      message = errorOrMessage;
    } else {
      error = errorOrMessage;
      message = error.message;
      stack = error.stack;
    }

    // Create log entry
    const entry: ErrorLogEntry = {
      timestamp,
      level,
      context,
      message,
      error,
      stack,
      metadata,
      errorId
    };

    // Add to history (keep max size)
    this.errorHistory.push(entry);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    // Update counters
    this.errorCounters.total++;
    this.errorCounters.byContext[context] =
      (this.errorCounters.byContext[context] || 0) + 1;
    this.errorCounters.byLevel[level]++;

    // Output based on environment
    this.outputLog(entry);

    // Send to external service (optional)
    this.sendToExternalService(entry);

    return errorId;
  }

  /**
   * Output log to appropriate destination
   */
  private outputLog(entry: ErrorLogEntry): void {
    const isDev = import.meta.env.DEV;
    const logMessage = `[${entry.errorId}] [${entry.context}] ${entry.message}`;

    switch (entry.level) {
      case 'error':
        if (isDev && entry.error) {
          console.error(logMessage, entry.error);
        } else {
          console.error(logMessage);
        }
        break;
      case 'warning':
        if (isDev) {
          console.warn(logMessage, entry.metadata);
        } else {
          console.warn(logMessage);
        }
        break;
      case 'info':
        if (isDev) {
          console.log(logMessage, entry.metadata);
        }
        break;
    }
  }

  /**
   * Send error to external service (Sentry, LogRocket, etc.)
   * This is a placeholder - integrate with your error tracking service
   */
  private sendToExternalService(entry: ErrorLogEntry): void {
    // In production, send to Sentry, Bugsnag, LogRocket, etc.
    // Example with Sentry:
    // if (!import.meta.env.DEV && entry.level === 'error') {
    //   Sentry.captureException(entry.error, {
    //     tags: { context: entry.context },
    //     extra: entry.metadata
    //   });
    // }

    // For now, just log to console in development
    if (import.meta.env.DEV) {
      console.debug('[ErrorLogger] Would send to external service:', entry);
    }
  }

  /**
   * Get error history
   */
  public getHistory(limit?: number): ErrorLogEntry[] {
    if (limit) {
      return this.errorHistory.slice(-limit);
    }
    return [...this.errorHistory];
  }

  /**
   * Get error metrics and summary
   */
  public getErrorMetrics(): ErrorMetrics {
    return {
      totalErrors: this.errorCounters.total,
      errorsByContext: { ...this.errorCounters.byContext },
      errorsByLevel: { ...this.errorCounters.byLevel },
      lastError: this.errorHistory[this.errorHistory.length - 1]
    };
  }

  /**
   * Clear error history
   */
  public clearHistory(): void {
    this.errorHistory = [];
    this.errorCounters = {
      total: 0,
      byContext: {},
      byLevel: { error: 0, warning: 0, info: 0 }
    };
  }

  /**
   * Get error summary for debugging
   */
  public getSummary(): string {
    const metrics = this.getErrorMetrics();
    const contextList = Object.entries(metrics.errorsByContext)
      .map(([ctx, count]) => `  ${ctx}: ${count}`)
      .join('\n');

    return `
ERROR SUMMARY
=============
Total Errors: ${metrics.totalErrors}
  - Errors: ${metrics.errorsByLevel.error}
  - Warnings: ${metrics.errorsByLevel.warning}
  - Info: ${metrics.errorsByLevel.info}

By Context:
${contextList || '  (none)'}

Last Error: ${metrics.lastError ? metrics.lastError.message : '(none)'}
    `;
  }

  /**
   * Format error for display (safe version without sensitive data)
   */
  public formatErrorForDisplay(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }

  /**
   * Create context-aware error message
   */
  public createContextualError(
    context: string,
    originalError: Error,
    userMessage: string
  ): Error {
    const error = new Error(userMessage);
    (error as any).context = context;
    (error as any).originalError = originalError;
    return error;
  }
}

/**
 * Export singleton instance
 */
export const ErrorLogger = ErrorLoggerService.getInstance();

/**
 * React Hook for using ErrorLogger in functional components
 */
export function useErrorLogger(componentName: string) {
  return {
    logError: (error: Error | string, metadata?: Record<string, unknown>) =>
      ErrorLogger.logError(componentName, error, metadata),
    logWarning: (message: string, metadata?: Record<string, unknown>) =>
      ErrorLogger.logWarning(componentName, message, metadata),
    logInfo: (message: string, metadata?: Record<string, unknown>) =>
      ErrorLogger.logInfo(componentName, message, metadata)
  };
}
