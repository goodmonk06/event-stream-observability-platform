/**
 * Structured Logger
 *
 * Provides consistent, contextual logging throughout the platform.
 * Can be configured to send logs to the platform itself (dogfooding).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
  correlationId?: string;
  projectId?: number;
  userId?: string;
  requestId?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private context: LogContext = {};

  constructor(
    private defaultContext: LogContext = {},
    private minLevel: LogLevel = 'info'
  ) {
    this.context = { ...defaultContext };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context }, this.minLevel);
  }

  /**
   * Add context to all future logs from this logger
   */
  withContext(context: LogContext): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Log at debug level
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log at info level
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log at warn level
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : {};

    this.log('error', message, { ...context, ...errorContext });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    this.output(entry);
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * Output the log entry (can be overridden)
   */
  protected output(entry: LogEntry): void {
    const formatted = this.format(entry);

    switch (entry.level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  /**
   * Format log entry for output
   */
  private format(entry: LogEntry): string {
    if (process.env.LOG_FORMAT === 'json') {
      return JSON.stringify(entry);
    }

    // Human-readable format
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const contextStr = entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    return `[${timestamp}] ${level} ${entry.message}${contextStr}`;
  }
}

/**
 * Create logger instance based on environment
 */
export function createLogger(context?: LogContext): Logger {
  const level = (process.env.LOG_LEVEL || 'info') as LogLevel;
  return new Logger(context, level);
}

// Default logger instance
export const logger = createLogger({ service: 'observability-api' });

/**
 * Request correlation ID middleware helper
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
