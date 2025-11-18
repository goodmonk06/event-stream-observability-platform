# Integration Recipes

Common patterns for integrating the observability platform with your ecosystem.

## Table of Contents

- [Authentication Service Integration](#authentication-service-integration)
- [Notification Hub Integration](#notification-hub-integration)
- [Multi-Service Monitoring](#multi-service-monitoring)
- [CI/CD Pipeline Integration](#cicd-pipeline-integration)
- [Kubernetes Deployment Monitoring](#kubernetes-deployment-monitoring)
- [Serverless Function Monitoring](#serverless-function-monitoring)

---

## Authentication Service Integration

### Scenario

You have a centralized authentication service and want to track auth events across all services.

### Implementation

```typescript
// In your auth service
import ObservabilityClient from '@observability-platform/node-sdk';

const obs = new ObservabilityClient({
  apiUrl: process.env.OBS_API_URL,
  apiKey: process.env.OBS_API_KEY_AUTH,
});

// Track login attempts
async function handleLogin(email: string, success: boolean) {
  if (success) {
    obs.info('User logged in', {
      email,
      method: 'password',
      ip: req.ip,
    });

    obs.event('user.login.success', {
      email,
      timestamp: new Date(),
    });

    obs.counter('auth.login.success', 1, {
      method: 'password',
    });
  } else {
    obs.warn('Failed login attempt', {
      email,
      reason: 'invalid_password',
    });

    obs.counter('auth.login.failed', 1, {
      method: 'password',
      reason: 'invalid_password',
    });
  }
}

// Track session metrics
setInterval(() => {
  const activeSessions = await getActiveSessionCount();
  obs.gauge('auth.sessions.active', activeSessions);
}, 30000);
```

### Alert Configuration

Create alerts in the platform dashboard:

```json
{
  "name": "High Failed Login Rate",
  "rule_type": "metric_threshold",
  "condition": {
    "metric_name": "auth.login.failed",
    "operator": ">",
    "threshold": 10,
    "window_minutes": 5,
    "aggregation": "sum"
  },
  "severity": "warning",
  "notification_channels": ["email", "slack"]
}
```

---

## Notification Hub Integration

### Scenario

Send observability platform alerts through your centralized notification service.

### Custom Notification Adapter

```typescript
// api/src/lib/adapters/NotificationHubAdapter.ts
import { INotificationAdapter, NotificationPayload, NotificationResult } from './INotificationAdapter';

export class NotificationHubAdapter implements INotificationAdapter {
  readonly name = 'notification-hub';

  constructor(
    private hubUrl: string,
    private apiKey: string
  ) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const response = await fetch(`${this.hubUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          title: payload.title,
          body: payload.message,
          priority: payload.severity,
          metadata: payload.metadata,
          channels: ['email', 'slack'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Notification hub returned ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        messageId: data.notificationId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.hubUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Registration

```typescript
// api/src/index.ts
import { NotificationHubAdapter } from './lib/adapters/NotificationHubAdapter';
import { eventBus } from './lib/events/DomainEvents';

const notificationHub = new NotificationHubAdapter(
  process.env.NOTIFICATION_HUB_URL!,
  process.env.NOTIFICATION_HUB_KEY!
);

eventBus.on('alert.triggered', async (event) => {
  await notificationHub.send({
    title: `Alert: ${event.data.severity.toUpperCase()}`,
    message: `Alert rule ${event.data.alertRuleId} triggered`,
    severity: event.data.severity,
    metadata: event.data,
    timestamp: event.timestamp,
  });
});
```

---

## Multi-Service Monitoring

### Scenario

Monitor a microservices architecture with multiple Node.js services.

### Shared Configuration

```typescript
// shared/observability.ts
import ObservabilityClient from '@observability-platform/node-sdk';

export function createObservabilityClient(serviceName: string) {
  return new ObservabilityClient({
    apiUrl: process.env.OBS_API_URL || 'http://observability-api:3001',
    apiKey: process.env.OBS_API_KEY!,
    flushInterval: 5000,
    batchSize: 100,
  });
}

export function instrumentExpress(app: Express, obs: ObservabilityClient, serviceName: string) {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      obs.counter('http.requests', 1, {
        service: serviceName,
        method: req.method,
        path: req.route?.path || req.path,
        status: res.statusCode.toString(),
      });

      obs.gauge('http.response_time', duration, {
        service: serviceName,
        endpoint: req.route?.path || req.path,
      });

      if (res.statusCode >= 500) {
        obs.error('HTTP 5xx error', {
          service: serviceName,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        });
      }
    });

    next();
  });
}
```

### Service Implementation

```typescript
// user-service/index.ts
import { createObservabilityClient, instrumentExpress } from '../shared/observability';

const obs = createObservabilityClient('user-service');
const app = express();

instrumentExpress(app, obs, 'user-service');

app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    obs.info('User fetched', { userId: req.params.id });

    res.json(user);
  } catch (error) {
    obs.error('Failed to fetch user', error, { userId: req.params.id });
    res.status(500).json({ error: 'Internal error' });
  }
});

process.on('SIGTERM', async () => {
  await obs.close();
  process.exit(0);
});
```

### Dashboard Setup

Create a single dashboard showing metrics from all services:

```json
{
  "name": "Microservices Overview",
  "layout": {
    "widgets": [
      {
        "type": "metrics_chart",
        "title": "Request Rate by Service",
        "config": {
          "metric_name": "http.requests",
          "group_by": "service",
          "aggregation": "sum"
        }
      },
      {
        "type": "metrics_chart",
        "title": "P95 Response Time",
        "config": {
          "metric_name": "http.response_time",
          "aggregation": "percentile_95",
          "group_by": "service"
        }
      }
    ]
  }
}
```

---

## CI/CD Pipeline Integration

### Scenario

Track deployment events and monitor application health during rollouts.

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Notify deployment start
        run: |
          curl -X POST ${{ secrets.OBS_API_URL }}/ingest/events \
            -H "Content-Type: application/json" \
            -H "X-API-Key: ${{ secrets.OBS_API_KEY }}" \
            -d '{
              "events": [{
                "name": "deployment.started",
                "payload": {
                  "service": "api",
                  "version": "${{ github.sha }}",
                  "environment": "production",
                  "triggered_by": "${{ github.actor }}"
                }
              }]
            }'

      - name: Deploy
        run: ./deploy.sh

      - name: Notify deployment complete
        run: |
          curl -X POST ${{ secrets.OBS_API_URL }}/ingest/events \
            -H "Content-Type: application/json" \
            -H "X-API-Key: ${{ secrets.OBS_API_KEY }}" \
            -d '{
              "events": [{
                "name": "deployment.completed",
                "payload": {
                  "service": "api",
                  "version": "${{ github.sha }}",
                  "environment": "production",
                  "duration_seconds": ${{ job.duration }}
                }
              }]
            }'
```

### Post-Deployment Health Check

```typescript
// scripts/post-deploy-check.ts
import ObservabilityClient from '@observability-platform/node-sdk';

const obs = new ObservabilityClient({
  apiUrl: process.env.OBS_API_URL!,
  apiKey: process.env.OBS_API_KEY!,
});

async function checkHealth() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Check error rate in last 5 minutes
  const errorLogs = await fetch(
    `${process.env.OBS_API_URL}/query/logs?` +
    `projectId=1&level=error&` +
    `startTime=${fiveMinutesAgo.toISOString()}&` +
    `endTime=${now.toISOString()}`
  ).then(r => r.json());

  const errorRate = errorLogs.total / 300; // per second

  obs.gauge('deployment.post_check.error_rate', errorRate);

  if (errorRate > 1) {
    obs.event('deployment.health_check.failed', {
      error_rate: errorRate,
      threshold: 1,
    });

    console.error('High error rate detected after deployment!');
    process.exit(1);
  }

  obs.event('deployment.health_check.passed', {
    error_rate: errorRate,
  });

  console.log('Health check passed');
}

checkHealth();
```

---

## Kubernetes Deployment Monitoring

### Scenario

Monitor applications running in Kubernetes with pod-level metrics.

### DaemonSet Configuration

```yaml
# k8s/obs-sidecar.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: obs-metrics-collector
spec:
  selector:
    matchLabels:
      name: obs-metrics-collector
  template:
    metadata:
      labels:
        name: obs-metrics-collector
    spec:
      containers:
      - name: collector
        image: your-registry/obs-collector:latest
        env:
        - name: OBS_API_URL
          value: "http://observability-api.default.svc.cluster.local:3001"
        - name: OBS_API_KEY
          valueFrom:
            secretKeyRef:
              name: obs-credentials
              key: api-key
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
```

### Application Pod Annotation

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  annotations:
    observability.platform/enabled: "true"
    observability.platform/project-id: "1"
spec:
  containers:
  - name: app
    image: my-app:latest
    env:
    - name: OBS_API_URL
      value: "http://observability-api.default.svc.cluster.local:3001"
    - name: OBS_API_KEY
      valueFrom:
        secretKeyRef:
          name: obs-credentials
          key: api-key
```

---

## Serverless Function Monitoring

### Scenario

Monitor AWS Lambda functions with cold start tracking.

### Lambda Wrapper

```typescript
// lambda/wrapper.ts
import ObservabilityClient from '@observability-platform/node-sdk';

const obs = new ObservabilityClient({
  apiUrl: process.env.OBS_API_URL!,
  apiKey: process.env.OBS_API_KEY!,
});

let isColdStart = true;

export function withObservability(handler: any) {
  return async (event: any, context: any) => {
    const start = Date.now();
    const requestId = context.requestId;

    obs.info('Lambda invoked', {
      functionName: context.functionName,
      requestId,
      isColdStart,
    });

    if (isColdStart) {
      obs.event('lambda.cold_start', {
        functionName: context.functionName,
        requestId,
      });
      isColdStart = false;
    }

    try {
      const result = await handler(event, context);

      const duration = Date.now() - start;
      obs.gauge('lambda.duration', duration, {
        functionName: context.functionName,
      });

      obs.gauge('lambda.memory_used', context.memoryLimitInMB - (process.memoryUsage().heapUsed / 1024 / 1024), {
        functionName: context.functionName,
      });

      await obs.flush();

      return result;
    } catch (error) {
      obs.error('Lambda error', error as Error, {
        functionName: context.functionName,
        requestId,
      });

      await obs.flush();

      throw error;
    }
  };
}
```

### Usage

```typescript
// lambda/functions/process-order.ts
import { withObservability } from '../wrapper';

export const handler = withObservability(async (event, context) => {
  // Your function logic
  const order = JSON.parse(event.body);

  await processOrder(order);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
});
```

---

## Best Practices

1. **Use Consistent Naming**: Adopt a naming convention for metrics and events across services
   - `<service>.<resource>.<action>` (e.g., `auth.login.success`)

2. **Add Context**: Include relevant metadata in logs and events
   - User IDs, request IDs, correlation IDs

3. **Set Up Alerts Early**: Don't wait for production issues
   - Error rate thresholds
   - Response time degradation
   - Resource exhaustion

4. **Create Dashboards per Team**: Organize views by service ownership
   - Team-specific dashboards
   - Cross-service overview dashboard

5. **Use Tags**: Tag projects and queries for organization
   - Environment (prod, staging, dev)
   - Team (platform, product, data)
   - Criticality (p0, p1, p2)

6. **Monitor the Monitor**: Use the platform to monitor itself
   - API latency
   - Ingestion rate
   - Database performance

7. **Set Data Retention**: Configure appropriate retention for each data type
   - Logs: 30 days
   - Metrics: 90 days
   - Events: 1 year
