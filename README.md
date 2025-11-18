# Event Stream Observability Platform

A lightweight, self-hosted observability platform for collecting and visualizing **logs**, **metrics**, and **custom events** from your applications.

## Features

- **Multi-tenancy**: Create multiple projects, each with its own API key
- **Three data types**:
  - **Logs**: Structured logs with levels (debug, info, warn, error) and full-text search
  - **Metrics**: Counters and gauges with labels and time-series aggregation
  - **Custom Events**: Track custom application events with arbitrary payloads
- **Modern Stack**:
  - Ingestion API: Fastify + TypeScript
  - Storage: PostgreSQL (designed to be swappable with ClickHouse)
  - Dashboard: Next.js 14 (App Router) + Tailwind CSS + Recharts
- **Node.js SDK**: Easy integration with your Node.js applications
- **Batch ingestion**: Efficient bulk data ingestion
- **Real-time dashboard**: Search, filter, and visualize your data

## Project Structure

```
event-stream-observability-platform/
├── api/              # Fastify API server
│   ├── src/
│   │   ├── db/       # Database client and migrations
│   │   ├── models/   # Data access layer
│   │   ├── routes/   # API endpoints
│   │   └── index.ts
│   └── package.json
├── dashboard/        # Next.js dashboard
│   ├── src/
│   │   ├── app/      # App router pages
│   │   └── lib/      # API client
│   └── package.json
├── sdks/
│   └── node/         # Node.js SDK
│       ├── src/
│       └── package.json
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Install

```bash
git clone <repository-url>
cd event-stream-observability-platform
npm install
```

### 2. Set Up Database

Start PostgreSQL (or use the provided Docker Compose):

```bash
docker-compose up -d postgres
```

Configure the API database connection:

```bash
cd api
cp .env.example .env
# Edit .env with your database credentials
```

Run migrations:

```bash
npm run db:migrate
```

### 3. Start the Services

**Development mode** (runs both API and dashboard):

```bash
# From root directory
npm run dev
```

Or start services individually:

```bash
# Terminal 1 - API Server
cd api
npm run dev

# Terminal 2 - Dashboard
cd dashboard
npm run dev
```

- API: http://localhost:3001
- Dashboard: http://localhost:3000

### 4. Create a Project

1. Open the dashboard at http://localhost:3000
2. Navigate to "Projects"
3. Create a new project
4. Copy the generated API key

## Using the Platform

### Send Data from Node.js

Install the SDK in your application:

```bash
npm install @observability-platform/node-sdk
```

Use it in your code:

```javascript
const ObservabilityClient = require('@observability-platform/node-sdk');

const client = new ObservabilityClient({
  apiUrl: 'http://localhost:3001',
  apiKey: 'obs_your_api_key_here',
});

// Send logs
client.info('Application started', { version: '1.0.0' });
client.error('Failed to connect to database', { error: 'Connection timeout' });

// Track metrics
client.counter('http.requests', 1, { endpoint: '/api/users', method: 'GET' });
client.gauge('memory.usage', 75.5, { server: 'web-01' });

// Record events
client.event('user.signup', {
  userId: '12345',
  email: 'user@example.com',
  plan: 'premium'
});

// Flush when shutting down
process.on('SIGTERM', async () => {
  await client.close();
  process.exit(0);
});
```

### Send Data via HTTP

You can also send data directly to the API:

```bash
# Send logs
curl -X POST http://localhost:3001/ingest/logs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: obs_your_api_key_here" \
  -d '{
    "logs": [
      {
        "level": "info",
        "message": "User logged in",
        "context": { "userId": "123" }
      }
    ]
  }'

# Send metrics
curl -X POST http://localhost:3001/ingest/metrics \
  -H "Content-Type: application/json" \
  -H "X-API-Key: obs_your_api_key_here" \
  -d '{
    "metrics": [
      {
        "name": "api.latency",
        "type": "gauge",
        "value": 45.2,
        "labels": { "endpoint": "/api/users" }
      }
    ]
  }'

# Send events
curl -X POST http://localhost:3001/ingest/events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: obs_your_api_key_here" \
  -d '{
    "events": [
      {
        "name": "order.completed",
        "payload": { "orderId": "ORD-123", "amount": 99.99 }
      }
    ]
  }'
```

## API Endpoints

### Ingestion Endpoints

- `POST /ingest/logs` - Ingest log events (requires API key)
- `POST /ingest/metrics` - Ingest metrics (requires API key)
- `POST /ingest/events` - Ingest custom events (requires API key)

### Query Endpoints

- `GET /query/logs` - Query logs with filters
- `GET /query/metrics` - Query raw metric data
- `GET /query/metrics/aggregate` - Get aggregated metrics
- `GET /query/events` - Query custom events

### Management Endpoints

- `GET /projects` - List all projects
- `POST /projects` - Create a new project
- `GET /projects/:id` - Get project details
- `DELETE /projects/:id` - Delete a project
- `GET /health` - Health check

## Database Schema

The platform uses PostgreSQL with the following tables:

- **projects**: Project definitions with API keys
- **log_events**: Log entries with full-text search support
- **metric_points**: Time-series metric data
- **custom_events**: Custom application events

See `api/src/db/schema.sql` for the complete schema.

## Configuration

### API Server (.env)

```bash
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/observability
NODE_ENV=development
CORS_ORIGIN=*
```

### Dashboard (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Production Deployment

### Build for Production

```bash
# Build all packages
npm run build

# Start production servers
cd api && npm start
cd dashboard && npm start
```

### Environment Considerations

1. **Database**: Use a managed PostgreSQL service or set up proper backups
2. **Security**:
   - Keep API keys secret
   - Use HTTPS in production
   - Set appropriate CORS_ORIGIN
3. **Scaling**: Consider switching to ClickHouse for high-volume data
4. **Monitoring**: Monitor the platform itself for performance

## Using with Your Other Repositories

This observability platform is designed to be used across all your projects:

1. **Create a project** for each application/service
2. **Install the SDK** in each repository:
   ```bash
   npm install @observability-platform/node-sdk
   ```
3. **Add observability** to your code:
   - Log important events
   - Track metrics (request counts, latencies, etc.)
   - Record custom events (user actions, business events)
4. **View everything** in one central dashboard

### Example: Express.js Integration

```javascript
const express = require('express');
const ObservabilityClient = require('@observability-platform/node-sdk');

const app = express();
const obs = new ObservabilityClient({
  apiUrl: process.env.OBS_API_URL,
  apiKey: process.env.OBS_API_KEY,
});

// Middleware to track requests
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    obs.counter('http.requests', 1, {
      method: req.method,
      path: req.path,
      status: res.statusCode.toString()
    });

    obs.gauge('http.response_time', duration, {
      method: req.method,
      path: req.path
    });
  });

  next();
});

// Log application events
app.post('/users', async (req, res) => {
  try {
    const user = await createUser(req.body);
    obs.info('User created', { userId: user.id });
    obs.event('user.created', { userId: user.id, email: user.email });
    res.json(user);
  } catch (error) {
    obs.error('Failed to create user', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await obs.close();
  process.exit(0);
});

app.listen(3000);
```

## Future Enhancements

- [ ] ClickHouse adapter for high-volume scenarios
- [ ] Redis Streams / Kafka integration for event streaming
- [ ] Alerting and notifications
- [ ] More SDK languages (Python, Go, etc.)
- [ ] Advanced visualization options
- [ ] Log aggregation and patterns
- [ ] Distributed tracing support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
