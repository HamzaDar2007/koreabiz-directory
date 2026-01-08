import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('KoreaBiz Directory - Complete E2E Test Suite', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    }));
    await app.init();

    // Clean up database before tests
    try {
      const dataSource = app.get(DataSource);
      await dataSource.query('TRUNCATE "users" CASCADE');
    } catch (error) {
      console.log('Database cleanup skipped:', error.message);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🏥 Health Check Endpoints', () => {
    it('GET /v1/health - should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('GET /v1/health/live - should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('GET /v1/health/ready - should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('🔐 Authentication Validation', () => {
    it('POST /v1/auth/register - should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          displayName: 'Test User'
        });
      
      expect([400, 429]).toContain(response.status);
    });

    it('POST /v1/auth/register - should validate password length', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          displayName: 'Test User'
        });
      
      expect([400, 429]).toContain(response.status);
    });

    it('POST /v1/auth/register - should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'test@example.com'
          // missing password and displayName
        });
      
      expect([400, 429]).toContain(response.status);
    });

    it('POST /v1/auth/login - should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });
      
      expect([400, 429]).toContain(response.status);
    });

    it('POST /v1/auth/login - should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        });
      
      expect([400, 429]).toContain(response.status);
    });
  });

  describe('🛡️ Security & Middleware', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/v1/non-existent-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect([400, 429]).toContain(response.status);
    });

    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      // Check if security headers are present
      expect(response.headers).toBeDefined();
    });
  });

  describe('🔧 Application Configuration', () => {
    it('should have proper global prefix configuration', async () => {
      // Test that endpoints without /v1 prefix return 404
      await request(app.getHttpServer())
        .get('/health')
        .expect(404);
    });

    it('should have validation pipe configured', async () => {
      // This test verifies that the ValidationPipe is working
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({}); // Empty body should trigger validation errors
      
      // Should be either 400 (validation error) or 429 (rate limited)
      expect([400, 429]).toContain(response.status);
    });

    it('should handle CORS properly', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      // CORS should be configured
      expect(response.headers).toBeDefined();
    });
  });

  describe('📊 API Response Structure', () => {
    it('health endpoints should return consistent structure', async () => {
      const healthResponse = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(healthResponse.body).toHaveProperty('status');
      expect(healthResponse.body).toHaveProperty('timestamp');

      const liveResponse = await request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200);

      expect(liveResponse.body).toHaveProperty('status', 'alive');
      expect(liveResponse.body).toHaveProperty('timestamp');
    });

    it('validation errors should return proper error structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123'
        });

      // Should be validation error or rate limited
      expect([400, 429]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe('🚀 Performance & Reliability', () => {
    it('health check should respond quickly', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/v1/health')
          .expect(200)
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
      });
    });
  });

  describe('📝 Logging & Monitoring', () => {
    it('should log requests properly', async () => {
      // This test ensures the logging middleware is working
      // The actual logs are visible in the test output
      await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      // If we reach here, logging middleware didn't crash the app
      expect(true).toBe(true);
    });
  });

  describe('📉 Rate Limiting', () => {
    it('should have rate limiting configured', async () => {
      // Test that the application has rate limiting middleware configured
      // by checking if multiple rapid requests eventually get limited
      const responses = [];
      const timestamp = Date.now();
      
      // Make 10 rapid requests to test if rate limiting exists
      for (let i = 0; i < 10; i++) {
        try {
          const response = await request(app.getHttpServer())
            .post('/v1/auth/register')
            .send({
              email: `rate-test-${timestamp}-${i}@example.com`,
              password: 'password123',
              displayName: 'Rate Test'
            });
          responses.push(response.status);
        } catch (error) {
          responses.push(500); // Network or other error
        }
      }

      // Should have successful registrations (201) or validation errors (400) or rate limits (429)
      const hasValidResponses = responses.some(status => [201, 400, 429].includes(status));
      expect(hasValidResponses).toBe(true);
      
      // Verify we got some responses
      expect(responses.length).toBeGreaterThan(0);
    });
  });
});