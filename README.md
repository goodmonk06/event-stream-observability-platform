# Event Stream Observability Platform

A lightweight, self-hosted observability platform for collecting and visualizing **logs**, **metrics**, and **custom events** from your applications.

## Overview

This platform provides a complete solution for application observability with three core capabilities:
- **Structured Logs**: Full-text searchable logs with severity levels and rich context
- **Time-Series Metrics**: Counters and gauges with labels and automatic aggregation
- **Custom Events**: Track business and application events with arbitrary payloads

Built for developers who need a simple, deployable observability solution that integrates easily into multiple applications and services.

## Tech Stack

| Component | Technologies |
|-----------|-------------|
| **API Server** | Fastify, TypeScript, Zod, PostgreSQL |
| **Dashboard** | Next.js 14 (App Router), React, Tailwind CSS, Recharts |
| **SDK** | TypeScript (Node.js) |
| **Validation** | Zod schemas with type-safe error handling |
| **Testing** | Vitest with domain logic tests |
| **Container** | Docker, Docker Compose |

## Domain Model

### Core Entities

**Project**
- Multi-tenant workspace with unique API key
- Contains all logs, metrics, and events for one application
- API Key format: `obs_<48-character-nanoid>`

**LogEvent**
- `level`: debug | info | warn | error
- `message`: Full-text searchable string
- `context`: Optional JSON object with metadata
- `timestamp`: Event time (defaults to ingestion time)

**MetricPoint**
- `name`: Metric identifier (e.g., "cpu.usage", "api.requests")
- `type`: counter (cumulative) | gauge (point-in-time)
- `value`: Numeric value
- `labels`: Key-value pairs for grouping (e.g., {"endpoint": "/api/users"})
- `timestamp`: Measurement time

**CustomEvent**
- `name`: Event identifier (e.g., "user.signup", "order.completed")
- `payload`: Arbitrary JSON data
- `timestamp`: Event occurrence time

## Getting Started

### Requirements

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Docker** (optional, for containerized deployment)

### Quick Start (Local Development)

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Set Up Database

Start PostgreSQL (or use Docker):

```bash
npm run docker:dev
```

Configure API environment:

```bash
cd api
cp .env.example .env
# Edit .env with your database credentials:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/observability
```

#### 3. Initialize Database

```bash
npm run db:migrate
npm run db:seed
```

The seed script creates two demo projects with sample data:
- **Demo Application** - Sample logs, metrics, and events
- **E-commerce Platform** - Additional sample data

#### 4. Start Development Servers

```bash
npm run dev
```

This starts:
- API Server: http://localhost:3001
- Dashboard: http://localhost:3000

### Docker Deployment

#### Development (Database Only)

```bash
npm run docker:dev
```

#### Full Stack (Production)

```bash
# Build images
npm run docker:build

# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

Services:
- Dashboard: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432

## Available Commands

### Root Commands

```bash
# Development
npm run dev              # Start API + Dashboard
npm run dev:api          # Start API only
npm run dev:dashboard    # Start Dashboard only

# Build
npm run build            # Build all packages
npm run build:api        # Build API
npm run build:dashboard  # Build Dashboard
npm run build:sdk        # Build Node.js SDK

# Production
npm start                # Start built API + Dashboard

# Testing & Quality
npm test                 # Run all tests
npm run lint             # Lint all packages

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed demo data
npm run db:reset         # Migrate + Seed

# Docker
npm run docker:dev       # Start PostgreSQL only
npm run docker:up        # Start full stack
npm run docker:down      # Stop containers
npm run docker:build     # Build Docker images
npm run docker:logs      # View container logs
```

## End-to-End Flow Example

### Vertical Slice: Project → Logs → Dashboard

This demonstrates the complete flow from creating a project to visualizing data.

#### 1. Create a Project

Navigate to http://localhost:3000/projects and create a new project. Copy the generated API key.

**Via API:**
```bash
curl -X POST http://localhost:3001/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Application"}'
```

Response includes `api_key`: `obs_xxxxx...`

#### 2. Send Logs from Your Application

**Using Node.js SDK:**

```bash
npm install @observability-platform/node-sdk
```

```javascript
const ObservabilityClient = require('@observability-platform/node-sdk');

const client = new ObservabilityClient({
  apiUrl: 'http://localhost:3001',
  apiKey: 'obs_your_api_key_here',
});

// Send logs
client.info('Application started', { version: '1.0.0' });
client.error('Database connection failed', {
  error: 'Connection timeout',
  retries: 3
});

// Send metrics
client.counter('api.requests', 1, {
  endpoint: '/users',
  method: 'GET',
  status: '200'
});

client.gauge('memory.usage.mb', 256.5, {
  server: 'web-01'
});

// Send events
client.event('user.signup', {
  userId: 'user_12345',
  email: 'newuser@example.com',
  plan: 'premium'
});

// Graceful shutdown
await client.close();
```

**Via cURL:**

```bash
# Send logs
curl -X POST http://localhost:3001/ingest/logs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: obs_your_api_key_here" \
  -d '{
    "logs": [
      {
        "level": "info",
        "message": "User logged in successfully",
        "context": {
          "userId": "123",
          "ip": "192.168.1.1"
        }
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
        "name": "api.response_time",
        "type": "gauge",
        "value": 145.2,
        "labels": {"endpoint": "/api/users"}
      }
    ]
  }'
```

#### 3. View Data in Dashboard

1. Open http://localhost:3000/projects
2. Click on your project
3. Navigate through:
   - **Logs**: Search, filter by level, see full-text results
   - **Metrics**: View time-series charts with min/avg/max
   - **Events**: Browse custom events with payloads

### Demo Credentials

After running `npm run db:seed`:

```
Demo Application API Key: (shown in seed output)
E-commerce Platform API Key: (shown in seed output)
```

Access dashboard: http://localhost:3000/projects

## Integration Examples

### Express.js Middleware

```javascript
const express = require('express');
const ObservabilityClient = require('@observability-platform/node-sdk');

const app = express();
const obs = new ObservabilityClient({
  apiUrl: process.env.OBS_API_URL,
  apiKey: process.env.OBS_API_KEY,
});

// Request tracking middleware
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
      endpoint: req.path
    });
  });

  next();
});

// Business logic
app.post('/orders', async (req, res) => {
  try {
    const order = await createOrder(req.body);

    obs.info('Order created', { orderId: order.id });
    obs.event('order.created', {
      orderId: order.id,
      amount: order.total,
      items: order.items.length
    });

    res.json(order);
  } catch (error) {
    obs.error('Order creation failed', {
      error: error.message,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

### Health Monitoring

```javascript
const obs = new ObservabilityClient({ /* ... */ });

setInterval(() => {
  const usage = process.memoryUsage();

  obs.gauge('memory.heap_used', usage.heapUsed / 1024 / 1024);
  obs.gauge('memory.heap_total', usage.heapTotal / 1024 / 1024);
  obs.gauge('memory.rss', usage.rss / 1024 / 1024);
}, 30000); // Every 30 seconds
```

## API Reference

### Ingestion Endpoints (Require API Key via `X-API-Key` header)

- `POST /ingest/logs` - Batch log ingestion
- `POST /ingest/metrics` - Batch metric ingestion
- `POST /ingest/events` - Batch event ingestion

### Query Endpoints

- `GET /query/logs?projectId=X&level=error&search=...` - Query logs
- `GET /query/metrics/aggregate?projectId=X&name=...` - Aggregated metrics
- `GET /query/events?projectId=X&name=...` - Query events

### Management Endpoints

- `POST /projects` - Create project
- `GET /projects` - List projects
- `GET /projects/:id` - Get project details
- `DELETE /projects/:id` - Delete project

### Health Check

- `GET /health` - API and database status

## Testing

```bash
# Run all tests
npm test

# Run API tests only
npm run test:api
```

Tests cover:
- Validation schemas (Zod)
- Error handling classes
- Domain logic (log levels, metric aggregation)

## Project Structure

```
event-stream-observability-platform/
├── api/                           # Fastify API server
│   ├── src/
│   │   ├── db/                   # Database client, migrations, seed
│   │   ├── models/               # Data access layer
│   │   ├── routes/               # API endpoints
│   │   ├── middleware/           # Auth, validation
│   │   ├── validation/           # Zod schemas
│   │   ├── utils/                # Error handling, helpers
│   │   ├── __tests__/            # Vitest tests
│   │   └── index.ts              # Server entry
│   ├── Dockerfile
│   └── package.json
├── dashboard/                     # Next.js dashboard
│   ├── src/
│   │   ├── app/                  # App router pages
│   │   │   ├── projects/         # Project management
│   │   │   └── projects/[id]/    # Logs, metrics, events
│   │   └── lib/                  # API client
│   ├── Dockerfile
│   └── package.json
├── sdks/node/                     # Node.js SDK
│   ├── src/index.ts              # Client implementation
│   └── package.json
├── docker-compose.yml             # Full stack
├── docker-compose.dev.yml         # Database only
└── package.json                   # Workspace root
```

## Future Extensions

### Planned Features

- **Alerting**: Threshold-based alerts with webhooks/email
- **ClickHouse Adapter**: High-volume time-series storage
- **Streaming**: Redis Streams / Kafka integration for real-time processing
- **Additional SDKs**: Python, Go, Ruby clients
- **Distributed Tracing**: OpenTelemetry integration
- **Log Aggregation**: Pattern detection and log parsing
- **Dashboard Enhancements**: Custom dashboards, saved queries
- **User Authentication**: Multi-user support with RBAC
- **Data Retention**: Automatic archival and cleanup policies
- **Export**: Data export to S3, GCS, or other storage

### Extensibility Points

The platform is designed with swappable components:
- **Storage**: PostgreSQL → ClickHouse adapter pattern
- **Message Queue**: Abstract interface for Redis/Kafka
- **Authentication**: Pluggable auth providers
- **Visualization**: Dashboard component library

## License

MIT

## Contributing

Contributions welcome! This is a building block designed to be extended and integrated across multiple projects.

### Development Workflow

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Start database: `npm run docker:dev`
4. Run migrations: `npm run db:migrate`
5. Seed data: `npm run db:seed`
6. Start dev servers: `npm run dev`
7. Run tests: `npm test`
8. Submit a pull request

---

**Built for developers who value simplicity, type safety, and easy integration.**
