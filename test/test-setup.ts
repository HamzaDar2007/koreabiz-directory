import { DataSource } from 'typeorm';

export const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT) || 5432,
  username: process.env.TEST_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || process.env.DB_NAME || 'koreabiz_test',
  entities: ['../src/**/*.entity.ts'],
  synchronize: true,
  dropSchema: false,
  logging: false,
});

export const setupTestDatabase = async () => {
  try {
    if (!testDataSource.isInitialized) {
      await testDataSource.initialize();
    }
    return testDataSource;
  } catch (error) {
    console.warn('Test database setup failed:', error.message);
    return null;
  }
};

export const cleanupTestDatabase = async () => {
  try {
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  } catch (error) {
    console.warn('Test database cleanup failed:', error.message);
  }
};

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  
  // Disable external services for testing
  process.env.REDIS_HOST = '';
  process.env.MEILISEARCH_HOST = '';
  process.env.EMAIL_HOST = '';
});

// Global test cleanup
afterAll(async () => {
  await cleanupTestDatabase();
});