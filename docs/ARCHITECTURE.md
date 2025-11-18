# Architecture Overview

## System Design

The Event Stream Observability Platform follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                       Dashboard (Next.js)                    │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐ │
│  │ Projects│  │   Logs   │  │ Metrics │  │    Alerts    │ │
│  └─────────┘  └──────────┘  └─────────┘  └──────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────────┐
│                      API Server (Fastify)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes (REST endpoints)                              │  │
│  │  ├─ /projects     ├─ /ingest/*    ├─ /query/*       │  │
│  │  ├─ /alerts       ├─ /dashboards  ├─ /webhooks      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware                                           │  │
│  │  ├─ Authentication  ├─ Validation  ├─ Error Handler │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain Services                                      │  │
│  │  ├─ Alert Evaluator  ├─ Query Engine                │  │
│  │  ├─ Event Processor  ├─ Webhook Dispatcher          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Models (Data Access Layer)                          │  │
│  │  ├─ Projects  ├─ Logs  ├─ Metrics  ├─ Events        │  │
│  │  ├─ Alerts    ├─ Queries  ├─ Dashboards             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Infrastructure (Lib)                                 │  │
│  │  ├─ Logger  ├─ Event Bus  ├─ Adapters               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌───────────┐  ┌──────────┐  ┌────────┐  ┌────────────┐  │
│  │ Projects  │  │   Logs   │  │Metrics │  │   Events   │  │
│  ├───────────┤  ├──────────┤  ├────────┤  ├────────────┤  │
│  │  Alerts   │  │  Queries │  │Dashbrd │  │  Webhooks  │  │
│  └───────────┘  └──────────┘  └────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    External Integrations                     │
│  ┌──────────────┐  ┌───────────┐  ┌─────────────────────┐ │
│  │  Node.js SDK │  │  Webhooks │  │ Notification System │ │
│  └──────────────┘  └───────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Ingestion Flow

```
Application → SDK → API (/ingest/*) → Validation → Model → Database
                                    ↓
                                Event Bus → Alert Evaluator
                                         → Webhook Dispatcher
                                         → Metrics Tracker
```

1. **Application** sends telemetry via SDK
2. **SDK** batches data and flushes to API
3. **API** validates request with Zod schemas
4. **Model** layer writes to database
5. **Event Bus** emits `DataIngestedEvent`
6. **Handlers** react (evaluate alerts, trigger webhooks, etc.)

### Query Flow

```
Dashboard → API (/query/*) → Validation → Model → Database → Response
                                               ↓
                                         Saved Query Cache
```

1. **Dashboard** requests data with filters
2. **API** validates query parameters
3. **Model** builds optimized SQL query
4. **Database** returns results
5. **API** formats and sends response

### Alert Evaluation Flow

```
Data Ingestion → Event Bus → Alert Evaluator → Condition Check
                                             ↓ (if triggered)
                                        Alert History Record
                                             ↓
                                    Notification Adapters
                                    ├─ Email
                                    ├─ Slack
                                    ├─ Webhook
                                    └─ PagerDuty
```

## Component Details

### API Server (Fastify)

**Responsibilities:**
- HTTP request handling
- Authentication and authorization
- Request validation (Zod)
- Response formatting
- Error handling

**Key Patterns:**
- RESTful API design
- Middleware pipeline (auth → validation → handler → error)
- Dependency injection for adapters
- Async/await throughout

### Models (Data Access Layer)

**Responsibilities:**
- Database queries (SQL)
- Data transformation (DB ↔ TypeScript)
- Transaction management
- Query optimization

**Key Patterns:**
- One model per entity
- Functions instead of classes for simplicity
- Type-safe query builders
- Parameterized queries (SQL injection prevention)

### Domain Services

**Alert Evaluator:**
- Evaluates metric thresholds
- Matches log patterns
- Counts events over time windows
- Triggers notifications on breach

**Query Engine:**
- Executes saved queries
- Applies dynamic filters
- Handles aggregations
- Caches results

**Webhook Dispatcher:**
- Delivers events to external endpoints
- Retry logic with exponential backoff
- Signature verification
- Failure tracking

### Infrastructure Layer

**Logger:**
- Structured logging with context
- Log levels (debug, info, warn, error)
- Correlation IDs for request tracing
- JSON output for production

**Event Bus:**
- In-memory pub/sub
- Typed events
- Async handlers
- Error isolation

**Adapters:**
- Notification: Email, Slack, Webhook
- Storage: PostgreSQL, ClickHouse
- Metrics: Prometheus, StatsD

## Extension Points

### Custom Adapters

Implement these interfaces to add new backends:

```typescript
// Notifications
interface INotificationAdapter {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

// Storage
interface IStorageAdapter {
  write(table: string, data: any[]): Promise<void>;
  query(table: string, filters: any): Promise<any[]>;
}
```

### Event Handlers

Subscribe to domain events:

```typescript
eventBus.on('alert.triggered', async (event) => {
  // Custom handler logic
  await notifyOpsTeam(event.data);
});
```

### Query Transformers

Modify query results:

```typescript
queryEngine.registerTransformer('logs', (results) => {
  return results.map(sanitizeLogEntry);
});
```

## Scalability Considerations

### Current Limits

- **PostgreSQL** handles ~10K events/second with proper indexing
- **Single API instance** serves 100s of concurrent connections
- **Dashboard** uses client-side pagination for large result sets

### Future Scaling Path

1. **Database:**
   - Migrate to ClickHouse for 100K+ events/second
   - Use TimescaleDB for time-series optimization
   - Partition tables by time and project

2. **API:**
   - Horizontal scaling with load balancer
   - Redis for caching and rate limiting
   - Message queue (Kafka/RabbitMQ) for async processing

3. **Dashboard:**
   - CDN for static assets
   - Server-side rendering for SEO
   - WebSocket for real-time updates

## Security

### Authentication

- **API Keys** for programmatic access
- **Tokens** with scoped permissions
- **Correlation IDs** for audit trails

### Data Protection

- SQL injection prevention (parameterized queries)
- Input validation (Zod schemas)
- Rate limiting (TODO)
- CORS configuration

### Audit Logging

All sensitive operations logged:
- Project creation/deletion
- Alert rule changes
- API key generation
- Data export

## Monitoring

The platform can monitor itself:

```typescript
const logger = createLogger({ service: 'api' });
const obs = new ObservabilityClient({
  apiUrl: 'http://localhost:3001',
  apiKey: process.env.SELF_MONITOR_KEY
});

// Log to platform
logger.info('Request processed', { requestId, duration });

// Send metrics
obs.gauge('api.latency', duration);
obs.counter('api.requests', 1, { endpoint, status });
```

## Technology Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API** | Fastify | Fast, low overhead, great TypeScript support |
| **Validation** | Zod | Type-safe, composable, great DX |
| **Database** | PostgreSQL | Mature, JSONB support, full-text search |
| **Dashboard** | Next.js 14 | App Router, React Server Components, great DX |
| **UI** | Tailwind + Recharts | Rapid development, beautiful charts |
| **Testing** | Vitest | Fast, ESM-first, Vite integration |
| **Container** | Docker | Industry standard, easy deployment |

## Future Architecture

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│  Ingest    │    │   Query    │    │  Dashboard │
│   API      │    │    API     │    │     UI     │
└──────┬─────┘    └──────┬─────┘    └──────┬─────┘
       │                 │                   │
       ▼                 ▼                   ▼
┌────────────────────────────────────────────────┐
│              Load Balancer / API Gateway        │
└────────────────────────────────────────────────┘
       │                 │                   │
       ▼                 ▼                   ▼
┌───────────┐    ┌────────────┐     ┌──────────┐
│   Kafka   │    │   Redis    │     │ClickHouse│
│  Stream   │    │   Cache    │     │          │
└───────────┘    └────────────┘     └──────────┘
```
