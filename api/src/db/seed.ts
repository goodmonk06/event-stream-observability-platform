import * as dotenv from 'dotenv';
import { getPool, closePool } from './client';
import { createProject } from '../models/project';
import { createLogEventsBatch } from '../models/log';
import { createMetricPointsBatch } from '../models/metric';
import { createCustomEventsBatch } from '../models/event';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo projects
    console.log('Creating demo projects...');
    const demoProject = await createProject('Demo Application');
    const ecommerceProject = await createProject('E-commerce Platform');

    console.log(`✅ Created project "${demoProject.name}" with API key: ${demoProject.api_key}`);
    console.log(`✅ Created project "${ecommerceProject.name}" with API key: ${ecommerceProject.api_key}`);

    // Seed logs for demo project
    console.log('\nSeeding logs...');
    const now = new Date();
    const logs = [
      {
        level: 'info' as const,
        message: 'Application started successfully',
        context: { version: '1.0.0', environment: 'production' },
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
      },
      {
        level: 'info' as const,
        message: 'Database connection established',
        context: { host: 'db.example.com', database: 'app_db' },
        timestamp: new Date(now.getTime() - 3500000).toISOString(),
      },
      {
        level: 'info' as const,
        message: 'User logged in',
        context: { userId: 'user_123', email: 'john@example.com', ip: '192.168.1.100' },
        timestamp: new Date(now.getTime() - 3000000).toISOString(),
      },
      {
        level: 'warn' as const,
        message: 'High memory usage detected',
        context: { usage: 85, threshold: 80, process: 'worker-1' },
        timestamp: new Date(now.getTime() - 2500000).toISOString(),
      },
      {
        level: 'error' as const,
        message: 'Failed to process payment',
        context: { orderId: 'ORD-12345', error: 'Insufficient funds', userId: 'user_456' },
        timestamp: new Date(now.getTime() - 2000000).toISOString(),
      },
      {
        level: 'info' as const,
        message: 'Cache cleared successfully',
        context: { keys: 150, duration: '2.3s' },
        timestamp: new Date(now.getTime() - 1800000).toISOString(),
      },
      {
        level: 'debug' as const,
        message: 'API request received',
        context: { endpoint: '/api/users', method: 'GET', userId: 'user_789' },
        timestamp: new Date(now.getTime() - 1500000).toISOString(),
      },
      {
        level: 'error' as const,
        message: 'Database query timeout',
        context: { query: 'SELECT * FROM orders WHERE...', timeout: '30s' },
        timestamp: new Date(now.getTime() - 1200000).toISOString(),
      },
      {
        level: 'info' as const,
        message: 'Email sent successfully',
        context: { to: 'customer@example.com', subject: 'Order Confirmation', messageId: 'msg_abc123' },
        timestamp: new Date(now.getTime() - 900000).toISOString(),
      },
      {
        level: 'warn' as const,
        message: 'Rate limit approaching',
        context: { userId: 'user_999', current: 95, limit: 100, window: '1h' },
        timestamp: new Date(now.getTime() - 600000).toISOString(),
      },
    ];

    await createLogEventsBatch(demoProject.id, logs);
    console.log(`✅ Created ${logs.length} log entries for demo project`);

    // Seed metrics for demo project
    console.log('\nSeeding metrics...');
    const metrics = [];
    const metricNames = ['http.requests', 'http.response_time', 'memory.usage', 'cpu.usage', 'active.users'];

    // Create time-series data for the last hour
    for (let i = 60; i >= 0; i -= 5) {
      const timestamp = new Date(now.getTime() - i * 60000).toISOString();

      metrics.push({
        name: 'http.requests',
        type: 'counter' as const,
        value: Math.floor(Math.random() * 100) + 50,
        labels: { endpoint: '/api/users', method: 'GET' },
        timestamp,
      });

      metrics.push({
        name: 'http.requests',
        type: 'counter' as const,
        value: Math.floor(Math.random() * 50) + 20,
        labels: { endpoint: '/api/orders', method: 'POST' },
        timestamp,
      });

      metrics.push({
        name: 'http.response_time',
        type: 'gauge' as const,
        value: Math.random() * 200 + 50,
        labels: { endpoint: '/api/users' },
        timestamp,
      });

      metrics.push({
        name: 'memory.usage',
        type: 'gauge' as const,
        value: Math.random() * 30 + 60,
        labels: { server: 'web-01' },
        timestamp,
      });

      metrics.push({
        name: 'cpu.usage',
        type: 'gauge' as const,
        value: Math.random() * 40 + 20,
        labels: { server: 'web-01' },
        timestamp,
      });

      metrics.push({
        name: 'active.users',
        type: 'gauge' as const,
        value: Math.floor(Math.random() * 500) + 100,
        timestamp,
      });
    }

    await createMetricPointsBatch(demoProject.id, metrics);
    console.log(`✅ Created ${metrics.length} metric points for demo project`);

    // Seed custom events
    console.log('\nSeeding custom events...');
    const events = [
      {
        name: 'user.signup',
        payload: {
          userId: 'user_1001',
          email: 'newuser1@example.com',
          plan: 'premium',
          referralSource: 'google',
        },
        timestamp: new Date(now.getTime() - 7200000).toISOString(),
      },
      {
        name: 'order.completed',
        payload: {
          orderId: 'ORD-54321',
          userId: 'user_123',
          amount: 299.99,
          items: 3,
          paymentMethod: 'credit_card',
        },
        timestamp: new Date(now.getTime() - 5400000).toISOString(),
      },
      {
        name: 'user.subscription.upgraded',
        payload: {
          userId: 'user_456',
          fromPlan: 'basic',
          toPlan: 'premium',
          mrr: 29.99,
        },
        timestamp: new Date(now.getTime() - 4500000).toISOString(),
      },
      {
        name: 'feature.enabled',
        payload: {
          featureName: 'dark_mode',
          userId: 'user_789',
          experimentGroup: 'test_a',
        },
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
      },
      {
        name: 'error.occurred',
        payload: {
          errorType: 'DatabaseConnectionError',
          message: 'Connection pool exhausted',
          severity: 'high',
          affectedUsers: 15,
        },
        timestamp: new Date(now.getTime() - 2700000).toISOString(),
      },
      {
        name: 'user.logout',
        payload: {
          userId: 'user_123',
          sessionDuration: 3600,
          pagesVisited: 12,
        },
        timestamp: new Date(now.getTime() - 1800000).toISOString(),
      },
    ];

    await createCustomEventsBatch(demoProject.id, events);
    console.log(`✅ Created ${events.length} custom events for demo project`);

    // Seed some data for e-commerce project too
    const ecomLogs = [
      {
        level: 'info' as const,
        message: 'Product catalog refreshed',
        context: { products: 1250, categories: 45 },
        timestamp: new Date(now.getTime() - 2000000).toISOString(),
      },
      {
        level: 'warn' as const,
        message: 'Low inventory alert',
        context: { productId: 'PROD-789', sku: 'WIDGET-001', stock: 5 },
        timestamp: new Date(now.getTime() - 1000000).toISOString(),
      },
    ];

    await createLogEventsBatch(ecommerceProject.id, ecomLogs);
    console.log(`✅ Created ${ecomLogs.length} log entries for e-commerce project`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log(`   Demo Application API Key: ${demoProject.api_key}`);
    console.log(`   E-commerce Platform API Key: ${ecommerceProject.api_key}`);
    console.log('\n🌐 Access the dashboard at http://localhost:3000/projects');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await closePool();
  }
}

seed();
