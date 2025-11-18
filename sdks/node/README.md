# Observability Platform - Node.js SDK

Node.js client library for the Observability Platform. Send logs, metrics, and custom events to your observability platform.

## Installation

```bash
npm install @observability-platform/node-sdk
```

## Usage

```typescript
import ObservabilityClient from '@observability-platform/node-sdk';

const client = new ObservabilityClient({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your-project-api-key',
  flushInterval: 5000, // Auto-flush every 5 seconds (optional)
  batchSize: 100, // Auto-flush when buffer reaches 100 items (optional)
});

// Logs
client.debug('Debug message', { userId: '123' });
client.info('User logged in', { userId: '123', ip: '192.168.1.1' });
client.warn('High memory usage', { usage: 85 });
client.error('Failed to process payment', { error: 'Insufficient funds' });

// Metrics
client.counter('api.requests', 1, { endpoint: '/users', method: 'GET' });
client.gauge('memory.usage', 75.5, { server: 'web-01' });

// Custom Events
client.event('user.signup', {
  userId: '123',
  email: 'user@example.com',
  plan: 'premium'
});

// Manually flush if needed
await client.flush();

// Close the client when shutting down (flushes remaining data)
await client.close();
```

## API

### Constructor

```typescript
new ObservabilityClient(config: ObservabilityClientConfig)
```

**Config Options:**
- `apiUrl` (required): URL of the observability API
- `apiKey` (required): Project API key
- `flushInterval` (optional): Auto-flush interval in milliseconds (default: 5000)
- `batchSize` (optional): Auto-flush when buffer reaches this size (default: 100)

### Logging Methods

- `debug(message, context?)` - Log debug message
- `info(message, context?)` - Log info message
- `warn(message, context?)` - Log warning message
- `error(message, context?)` - Log error message

### Metric Methods

- `counter(name, value, labels?)` - Record a counter metric
- `gauge(name, value, labels?)` - Record a gauge metric

### Event Methods

- `event(name, payload?)` - Record a custom event

### Utility Methods

- `flush()` - Manually flush all buffered data
- `close()` - Close the client and flush remaining data

## License

MIT
