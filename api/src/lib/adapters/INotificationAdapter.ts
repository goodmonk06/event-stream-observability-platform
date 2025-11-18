/**
 * Notification Adapter Interface
 *
 * Allows different notification backends to be plugged in for alert delivery.
 * Implementations: Email, Slack, Webhook, PagerDuty, etc.
 */

export interface NotificationPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationAdapter {
  /**
   * Unique identifier for this adapter
   */
  readonly name: string;

  /**
   * Send a notification
   */
  send(payload: NotificationPayload): Promise<NotificationResult>;

  /**
   * Validate configuration before sending
   */
  validate(): Promise<boolean>;
}

/**
 * Stub implementation for console logging
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  readonly name = 'console';

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    console.log('[NOTIFICATION]', {
      title: payload.title,
      message: payload.message,
      severity: payload.severity,
      timestamp: payload.timestamp,
      metadata: payload.metadata,
    });

    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  }

  async validate(): Promise<boolean> {
    return true;
  }
}

/**
 * Stub implementation for webhook notifications
 */
export class WebhookNotificationAdapter implements INotificationAdapter {
  readonly name = 'webhook';

  constructor(private url: string, private secret?: string) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // In a real implementation, this would make an HTTP POST request
    console.log(`[WEBHOOK] Would send to ${this.url}:`, payload);

    return {
      success: true,
      messageId: `webhook-${Date.now()}`,
    };
  }

  async validate(): Promise<boolean> {
    // Validate URL format
    try {
      new URL(this.url);
      return true;
    } catch {
      return false;
    }
  }
}
