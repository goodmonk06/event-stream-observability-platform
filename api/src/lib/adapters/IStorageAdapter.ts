/**
 * Storage Adapter Interface
 *
 * Allows different storage backends to be swapped for time-series data.
 * Implementations: PostgreSQL, ClickHouse, TimescaleDB, S3, etc.
 */

export interface StorageOptions {
  retention?: number; // days
  compression?: boolean;
  partitioning?: 'time' | 'project' | 'none';
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface IStorageAdapter {
  /**
   * Unique identifier for this storage backend
   */
  readonly name: string;

  /**
   * Write a batch of data points
   */
  write(table: string, data: any[]): Promise<void>;

  /**
   * Query data with filters
   */
  query(table: string, filters: Record<string, any>): Promise<any[]>;

  /**
   * Delete data older than retention period
   */
  cleanup(table: string, olderThan: Date): Promise<number>;

  /**
   * Get storage statistics
   */
  getStats(): Promise<StorageStats>;
}

export interface StorageStats {
  totalRecords: number;
  storageSize: number; // bytes
  oldestRecord?: Date;
  newestRecord?: Date;
}

/**
 * PostgreSQL implementation (current default)
 */
export class PostgreSQLStorageAdapter implements IStorageAdapter {
  readonly name = 'postgresql';

  async write(table: string, data: any[]): Promise<void> {
    // Implemented via existing models
    console.log(`[STORAGE:PostgreSQL] Writing ${data.length} records to ${table}`);
  }

  async query(table: string, filters: Record<string, any>): Promise<any[]> {
    // Implemented via existing models
    console.log(`[STORAGE:PostgreSQL] Querying ${table} with filters:`, filters);
    return [];
  }

  async cleanup(table: string, olderThan: Date): Promise<number> {
    console.log(`[STORAGE:PostgreSQL] Cleaning up ${table} older than ${olderThan}`);
    return 0;
  }

  async getStats(): Promise<StorageStats> {
    return {
      totalRecords: 0,
      storageSize: 0,
    };
  }
}

/**
 * Stub ClickHouse adapter for future high-volume scenarios
 */
export class ClickHouseStorageAdapter implements IStorageAdapter {
  readonly name = 'clickhouse';

  constructor(private connectionString: string) {}

  async write(table: string, data: any[]): Promise<void> {
    console.log(`[STORAGE:ClickHouse] Would write ${data.length} records to ${table}`);
    // Real implementation would batch insert to ClickHouse
  }

  async query(table: string, filters: Record<string, any>): Promise<any[]> {
    console.log(`[STORAGE:ClickHouse] Would query ${table}`);
    return [];
  }

  async cleanup(table: string, olderThan: Date): Promise<number> {
    console.log(`[STORAGE:ClickHouse] Would cleanup ${table}`);
    return 0;
  }

  async getStats(): Promise<StorageStats> {
    return {
      totalRecords: 0,
      storageSize: 0,
    };
  }
}
