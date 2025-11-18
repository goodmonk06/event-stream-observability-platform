export interface ObservabilityClientConfig {
  apiUrl: string;
  apiKey: string;
  flushInterval?: number;
  batchSize?: number;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp?: string;
}

export interface MetricEntry {
  name: string;
  type: 'counter' | 'gauge';
  value: number;
  labels?: Record<string, string>;
  timestamp?: string;
}

export interface EventEntry {
  name: string;
  payload?: Record<string, any>;
  timestamp?: string;
}

export class ObservabilityClient {
  private config: Required<ObservabilityClientConfig>;
  private logBuffer: LogEntry[] = [];
  private metricBuffer: MetricEntry[] = [];
  private eventBuffer: EventEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: ObservabilityClientConfig) {
    this.config = {
      flushInterval: 5000,
      batchSize: 100,
      ...config,
    };

    if (this.config.flushInterval > 0) {
      this.startAutoFlush();
    }
  }

  /**
   * Log a message
   */
  log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
    this.logBuffer.push({
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    });

    if (this.logBuffer.length >= this.config.batchSize) {
      this.flushLogs();
    }
  }

  /**
   * Convenience methods for logging
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  /**
   * Record a metric
   */
  metric(name: string, type: MetricEntry['type'], value: number, labels?: Record<string, string>): void {
    this.metricBuffer.push({
      name,
      type,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });

    if (this.metricBuffer.length >= this.config.batchSize) {
      this.flushMetrics();
    }
  }

  /**
   * Convenience methods for metrics
   */
  counter(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.metric(name, 'counter', value, labels);
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.metric(name, 'gauge', value, labels);
  }

  /**
   * Record a custom event
   */
  event(name: string, payload?: Record<string, any>): void {
    this.eventBuffer.push({
      name,
      payload,
      timestamp: new Date().toISOString(),
    });

    if (this.eventBuffer.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Flush all buffered data
   */
  async flush(): Promise<void> {
    await Promise.all([
      this.flushLogs(),
      this.flushMetrics(),
      this.flushEvents(),
    ]);
  }

  /**
   * Flush logs to the API
   */
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = this.logBuffer.splice(0, this.logBuffer.length);
    await this.sendRequest('/ingest/logs', { logs });
  }

  /**
   * Flush metrics to the API
   */
  async flushMetrics(): Promise<void> {
    if (this.metricBuffer.length === 0) return;

    const metrics = this.metricBuffer.splice(0, this.metricBuffer.length);
    await this.sendRequest('/ingest/metrics', { metrics });
  }

  /**
   * Flush events to the API
   */
  async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = this.eventBuffer.splice(0, this.eventBuffer.length);
    await this.sendRequest('/ingest/events', { events });
  }

  /**
   * Close the client and flush remaining data
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('Error auto-flushing observability data:', error);
      });
    }, this.config.flushInterval);

    // Don't keep the process alive just for flushing
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  private async sendRequest(path: string, body: any): Promise<void> {
    const url = `${this.config.apiUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`Failed to send data to ${path}:`, error);
      throw error;
    }
  }
}

export default ObservabilityClient;
