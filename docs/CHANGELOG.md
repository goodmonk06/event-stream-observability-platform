# Changelog

## Phase 3 (Current) - Deep Expansion & Ecosystem Ready

### Domain Model Expansion
- **8 New Entities**: alert_rules, alert_history, saved_queries, dashboards, webhooks, api_tokens, data_retention_policies, audit_logs
- **Enhanced Project Entity**: status, tags, metadata, last_activity_at, archived_at fields
- **Comprehensive Types**: TypeScript interfaces for all new entities with proper discriminated unions

### Extension & Integration System
- **Adapter Interfaces**:
  - `INotificationAdapter` - Email, Slack, Webhook, PagerDuty support
  - `IStorageAdapter` - PostgreSQL, ClickHouse, TimescaleDB backends
- **Domain Events**:
  - Event Bus with pub/sub pattern
  - 9 typed event types for system observability
  - Example handlers (ConsoleEventLogger, EventMetricsTracker)
- **Plugin Architecture**: Clear extension points for custom adapters

### Operational Excellence
- **Structured Logging**:
  - Logger class with context propagation
  - Correlation IDs for request tracing
  - Environment-based log levels
  - JSON output mode
- **Self-Monitoring**: Platform can observe itself
- **Audit Trail**: All sensitive operations logged

### Documentation
- **docs/PHASE3_OVERVIEW.md**: Implementation plan and success criteria
- **docs/ARCHITECTURE.md**: System design, data flow, components, scalability
- **docs/INTEGRATION_RECIPES.md**: 6 real-world integration patterns
- **Enhanced README**: Comprehensive guide with examples

### Database Optimizations
- Composite indexes for common query patterns
- GIN indexes for JSONB and array columns
- Proper foreign key constraints
- Check constraints for enums

## Phase 2 - Production Ready Foundation

### Vertical Slice
- **Complete Flow**: Project Creation → Data Ingestion → Dashboard Visualization
- Working end-to-end for logs, metrics, and events

### Validation & Error Handling
- **Zod Validation**: Type-safe request validation on all endpoints
- **Custom Error Classes**: ValidationError, AuthenticationError, NotFoundError
- **Unified Error Handler**: Consistent error responses across API
- **HTTP Status Codes**: Proper status codes for all scenarios

### Testing Infrastructure
- **Vitest Setup**: Fast, modern test framework
- **Domain Logic Tests**: Validation schemas, error handling, business logic
- **Test Coverage**: Meaningful tests beyond trivial assertions
- **Test Commands**: `npm test` works out of the box

### Docker & Deployment
- **API Dockerfile**: Multi-stage build for optimized images
- **Dashboard Dockerfile**: Production-ready Next.js builds
- **docker-compose.yml**: Full stack (postgres + api + dashboard)
- **docker-compose.dev.yml**: Development (database only)
- **Health Checks**: Proper service dependencies

### Developer Experience
- **Standardized Scripts**: dev, build, start, test, lint across all packages
- **Database Scripts**: db:migrate, db:seed, db:reset
- **Docker Scripts**: docker:up, docker:down, docker:build, docker:logs
- **Monorepo Setup**: Workspace commands for individual packages

### Seed Data
- **Realistic Demo Data**: 2 projects with comprehensive sample data
- **Time-Series Metrics**: 1 hour of metric data across 6 metric types
- **Rich Log Entries**: 10 contextual log entries
- **Custom Events**: 6 business event examples
- **Immediate Demo**: `npm run db:seed` for instant experience

## Phase 1 - Initial Implementation

### Core Features
- Multi-tenant project management
- Log ingestion with full-text search
- Time-series metrics (counters and gauges)
- Custom event tracking
- Interactive dashboard
- Node.js SDK with auto-batching

### Infrastructure
- PostgreSQL database
- Fastify API server
- Next.js 14 dashboard
- TypeScript throughout
- Basic validation and error handling

## Version History

- **v0.3.0** (Phase 3) - Extension system, logging, comprehensive docs
- **v0.2.0** (Phase 2) - Production-ready with validation, tests, Docker
- **v0.1.0** (Phase 1) - Initial implementation

---

## Breaking Changes

None yet - all changes have been additive.

## Migration Notes

### From Phase 2 to Phase 3

1. **Database**: Run migrations to add new tables
   ```bash
   npm run db:migrate
   ```

2. **Environment**: No new required environment variables
   - Optional: `LOG_LEVEL` (default: info)
   - Optional: `LOG_FORMAT` (default: text, options: json)

3. **API**: All existing endpoints remain unchanged
   - New endpoints added for alerts, queries, dashboards (coming in Phase 3 Part 3)

4. **SDK**: No breaking changes - all existing code works as-is

## Future Roadmap

### Phase 3 Remaining (Part 3)
- Alert rules API and evaluation engine
- Saved queries API
- Dashboard builder API
- Webhook delivery system
- CLI tool (`obs-cli`)
- Expanded test suite
- Richer seed scenarios

### Phase 4 - Production Hardening
- Rate limiting and quotas
- User authentication and RBAC
- Data export and import
- Performance benchmarks
- Load testing
- Security audit

### Phase 5 - Advanced Features
- Real-time WebSocket updates
- Anomaly detection (ML-based)
- Custom aggregation functions
- Data sampling strategies
- Multi-region deployment
- ClickHouse migration path
