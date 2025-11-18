/**
 * Domain Events
 *
 * Typed events that occur within the platform.
 * These can be subscribed to by handlers for loose coupling.
 */

export type DomainEvent =
  | ProjectCreatedEvent
  | ProjectArchivedEvent
  | DataIngestedEvent
  | AlertTriggeredEvent
  | AlertResolvedEvent
  | QuerySavedEvent
  | DashboardCreatedEvent
  | WebhookDeliveredEvent
  | DataRetentionAppliedEvent;

// Project events
export interface ProjectCreatedEvent {
  type: 'project.created';
  timestamp: Date;
  data: {
    projectId: number;
    projectName: string;
    apiKey: string;
  };
}

export interface ProjectArchivedEvent {
  type: 'project.archived';
  timestamp: Date;
  data: {
    projectId: number;
    archivedBy?: string;
  };
}

// Data ingestion events
export interface DataIngestedEvent {
  type: 'data.ingested';
  timestamp: Date;
  data: {
    projectId: number;
    dataType: 'logs' | 'metrics' | 'events';
    count: number;
  };
}

// Alert events
export interface AlertTriggeredEvent {
  type: 'alert.triggered';
  timestamp: Date;
  data: {
    alertRuleId: number;
    projectId: number;
    severity: 'info' | 'warning' | 'error' | 'critical';
    triggerValue: number;
    condition: string;
  };
}

export interface AlertResolvedEvent {
  type: 'alert.resolved';
  timestamp: Date;
  data: {
    alertRuleId: number;
    projectId: number;
    historyId: number;
  };
}

// Query events
export interface QuerySavedEvent {
  type: 'query.saved';
  timestamp: Date;
  data: {
    queryId: number;
    projectId: number;
    queryType: 'logs' | 'metrics' | 'events';
  };
}

// Dashboard events
export interface DashboardCreatedEvent {
  type: 'dashboard.created';
  timestamp: Date;
  data: {
    dashboardId: number;
    projectId: number;
    widgetCount: number;
  };
}

// Webhook events
export interface WebhookDeliveredEvent {
  type: 'webhook.delivered';
  timestamp: Date;
  data: {
    webhookId: number;
    projectId: number;
    success: boolean;
    statusCode?: number;
  };
}

// Data retention events
export interface DataRetentionAppliedEvent {
  type: 'data.retention.applied';
  timestamp: Date;
  data: {
    projectId: number;
    dataType: 'logs' | 'metrics' | 'events';
    recordsDeleted: number;
    recordsArchived: number;
  };
}

/**
 * Event handler interface
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void> | void;
}

/**
 * Simple in-memory event bus
 * In production, this could be backed by Redis, Kafka, etc.
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to an event type
   */
  on<T extends DomainEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler as EventHandler]);
  }

  /**
   * Publish an event
   */
  async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    // Execute handlers concurrently
    await Promise.all(
      handlers.map(handler =>
        Promise.resolve(handler.handle(event)).catch(error => {
          console.error(`Error in event handler for ${event.type}:`, error);
        })
      )
    );
  }

  /**
   * Remove all handlers for an event type
   */
  off(eventType: string): void {
    this.handlers.delete(eventType);
  }

  /**
   * Remove all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus();

/**
 * Example handler: Log all events to console
 */
export class ConsoleEventLogger implements EventHandler {
  async handle(event: DomainEvent): void {
    console.log('[EVENT]', event.type, event.data);
  }
}

/**
 * Example handler: Track metrics for events
 */
export class EventMetricsTracker implements EventHandler {
  async handle(event: DomainEvent): void {
    // In a real implementation, this would increment counters
    // e.g., metrics.increment(`events.${event.type}`)
    console.log('[METRICS] Event occurred:', event.type);
  }
}
