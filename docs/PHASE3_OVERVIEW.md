# Phase 3 Overview: Event Stream Observability Platform

## Purpose

The Event Stream Observability Platform is a **lightweight, self-hosted, multi-tenant observability solution** designed to collect, store, query, and visualize application telemetry data (logs, metrics, and custom events).

This platform solves the problem of **fragmented observability** across multiple applications and services. Instead of relying on expensive SaaS solutions or complex self-hosted stacks, teams can deploy this single platform to centralize observability for all their Node.js applications. It's built to be a **reusable building block** within a larger ecosystem of microservices, providing a standardized way to instrument, monitor, and debug distributed systems.

Key differentiators:
- **Multi-tenancy by design**: One platform instance serves multiple projects/applications
- **Type-safe end-to-end**: TypeScript across API, SDK, and Dashboard
- **Easy integration**: Drop-in SDK with auto-batching and minimal configuration
- **Extensible architecture**: Plugin system for notifications, storage backends, and integrations

## Current Features

**Core Capabilities:**
- ✅ Multi-tenant project management with API key authentication
- ✅ Log ingestion with full-text search and level filtering
- ✅ Time-series metrics (counters and gauges) with label support
- ✅ Custom event tracking with arbitrary JSON payloads
- ✅ Batch ingestion API with validation
- ✅ Interactive dashboard for data visualization
- ✅ Node.js SDK with auto-batching and flushing

**Infrastructure:**
- ✅ PostgreSQL storage with optimized indexes
- ✅ Zod validation for all API inputs
- ✅ Unified error handling with proper HTTP codes
- ✅ Docker containerization (dev and production)
- ✅ Vitest test framework with domain logic tests
- ✅ Comprehensive seed data for demos

**Current Vertical Slice:**
- Create Project → Send Logs/Metrics/Events → View in Dashboard

## Current Limitations

**Domain Model:**
- No alerting or notification system
- No user-defined dashboards (only pre-built views)
- No saved queries or bookmarks
- No data retention policies or archival
- No team/organization hierarchy
- No webhook integrations
- No audit logs

**Integration & Extensibility:**
- No plugin system for custom data sinks
- No adapter pattern for swappable storage backends
- Hard-coded PostgreSQL dependency
- No event streaming (Redis/Kafka) support
- No integration with external notification services

**Operational:**
- No structured logging within the platform itself
- No internal metrics/telemetry
- Limited error context and debugging
- No performance monitoring of the platform
- No rate limiting or quota management

**Developer Experience:**
- CLI tools for common operations missing
- Limited test fixtures and factories
- No integration test examples
- Minimal API documentation beyond README

## Phase 3 Implementation Plan

### 1. Domain Model Expansion

**New Core Entities:**
- **AlertRule**: Threshold-based alerts on metrics and log patterns
  - Conditions, thresholds, evaluation windows
  - Status tracking (active, triggered, resolved)
  - Related: AlertHistory for audit trail

- **SavedQuery**: Bookmarkable queries with parameters
  - Query type (logs, metrics, events)
  - Filters, time ranges, parameters
  - Sharing and visibility settings

- **Dashboard**: User-defined custom dashboards
  - Widget layout configuration
  - Multiple data sources per dashboard
  - Public/private visibility

- **Webhook**: Outbound event notifications
  - URL, authentication, retry policies
  - Event filters and payload templates

- **ApiToken**: Fine-grained API access tokens
  - Separate from project API keys
  - Scoped permissions (read-only, write-only, etc.)
  - Expiration and rotation

- **DataRetentionPolicy**: Automated data lifecycle
  - TTL rules per data type
  - Archive vs. delete strategies
  - Storage tier management

**Enhanced Existing Entities:**
- Add `tags` to Projects for categorization
- Add `status` and `metadata` JSON fields
- Add `archived_at` timestamps for soft deletes
- Add `last_activity_at` for projects

### 2. Additional Vertical Slices

**Slice #2: Alert Management Flow**
- Create alert rule → Evaluate against incoming data → Trigger notification → View alert history
- API: CRUD for alert rules, alert history endpoint
- Dashboard: Alert rules management page, active alerts widget
- Background worker: Alert evaluation engine

**Slice #3: Custom Dashboard Flow**
- Create custom dashboard → Add widgets → Configure data sources → Share dashboard
- API: Dashboard CRUD, widget configuration
- Dashboard: Dashboard builder UI, widget library
- Persistence: Dashboard and widget schemas

**Slice #4: Saved Query Flow**
- Save query with filters → List saved queries → Execute saved query → Share query
- API: Saved query CRUD, execution endpoint
- Dashboard: Query builder with save functionality

### 3. Extension Points & Adapters

**Plugin Architecture:**
- `lib/adapters/` directory with interfaces:
  - `INotificationAdapter` (email, Slack, webhook, PagerDuty)
  - `IStorageAdapter` (PostgreSQL, ClickHouse, S3)
  - `IMetricsExporter` (Prometheus, StatsD, OpenTelemetry)
  - `IAuthProvider` (API key, OAuth, SAML)

**Event System:**
- `lib/events/` with typed domain events:
  - `ProjectCreated`, `AlertTriggered`, `DataIngested`, `ThresholdExceeded`
  - Event bus pattern for loose coupling
  - Handlers can subscribe to events

**Integration Hooks:**
- Pre/post ingestion hooks for data transformation
- Custom metric aggregation functions
- Query result transformers

### 4. Operational Enhancements

**Structured Logging:**
- `lib/logger.ts` with contextual logging
- Correlation IDs for request tracing
- Log levels and structured output (JSON)
- Integration with the platform's own log ingestion

**Internal Metrics:**
- `lib/metrics.ts` abstraction
- Track: API latency, ingestion rate, query performance, error rates
- Expose metrics endpoint for Prometheus scraping

**CLI Tool:**
- `src/cli/` with commands:
  - `obs-cli projects list`
  - `obs-cli seed --scenario=[demo|load-test|minimal]`
  - `obs-cli migrate:status`
  - `obs-cli export --project=ID --format=json`

### 5. Testing & Quality

**Expanded Test Suite:**
- Alert evaluation logic tests
- Query builder and filter tests
- Storage adapter integration tests
- End-to-end API tests with test containers
- Performance benchmarks

**Test Fixtures:**
- Factory pattern for entities
- Realistic test data generators
- Scenario-based fixtures (high-traffic, alert-heavy, etc.)

### 6. Documentation

**New Documentation:**
- `docs/ARCHITECTURE.md`: System design, data flow, component diagram
- `docs/DOMAIN_NOTES.md`: Deep dive into entities and relationships
- `docs/INTEGRATION_RECIPES.md`: Common integration patterns
- `docs/API_REFERENCE.md`: Complete API documentation
- `docs/EXTENSION_GUIDE.md`: How to build adapters and plugins
- `docs/DEPLOYMENT.md`: Production deployment guide

**Enhanced README:**
- Richer domain model section with diagrams
- Multiple example flows
- Integration examples
- Performance characteristics
- Scalability notes

### 7. Seed Data Scenarios

**Multiple Seed Scenarios:**
- `--scenario=demo`: Current demo data (2 projects, sample data)
- `--scenario=load-test`: 10 projects, 10K logs, 50K metrics
- `--scenario=alert-demo`: Pre-configured alerts with triggered states
- `--scenario=minimal`: Single project, minimal data

## Success Criteria

Phase 3 will be complete when:
1. ✅ At least 3 working vertical slices with full CRUD
2. ✅ Plugin/adapter system with 2+ interfaces and stub implementations
3. ✅ Structured logging and metrics throughout the platform
4. ✅ 50+ meaningful tests with good coverage
5. ✅ Rich seed data with multiple scenarios
6. ✅ 5+ documentation files covering architecture, domain, APIs, integration
7. ✅ CLI tool with useful commands
8. ✅ Platform can self-monitor (eating its own dog food)
9. ✅ Clear extension points for ecosystem integration
10. ✅ Production-ready error handling, logging, and observability

## Timeline Estimate

- Domain expansion & migrations: 20% of effort
- Vertical slices (alerts, dashboards, queries): 30% of effort
- Extension points & adapters: 15% of effort
- Logging, metrics, CLI: 10% of effort
- Tests & fixtures: 15% of effort
- Documentation: 10% of effort

Total: ~10x expansion from Phase 2 baseline.
