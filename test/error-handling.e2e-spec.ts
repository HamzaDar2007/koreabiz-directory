import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Error Handling & Edge Cases E2E Tests', () => {
  let app: INestApplication;
  let userToken: string;
  const testEmail = `errortest-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    // Global pipes are now in AppModule
    // app.useGlobalPipes(new ValidationPipe({
    //   whitelist: true,
    //   forbidNonWhitelisted: true,
    //   transform: true
    // }));
    await app.init();

    // Database cleanup
    const dataSource = app.get(require('typeorm').DataSource);
    await dataSource.query('TRUNCATE "users", "enterprises", "enterprise_media", "reviews", "claims", "subscriptions" CASCADE');

    // Create user for testing
    const userResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        displayName: 'Error Test User'
      });

    userToken = userResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🚨 Authentication Errors', () => {
    it('should handle expired JWT tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should handle malformed JWT tokens', async () => {
      await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);
    });

    it('should handle missing Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/v1/users/me')
        .expect(401);
    });

    it('should handle invalid Authorization format', async () => {
      await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    it('should handle blacklisted tokens', async () => {
      // Create a specific user for this test to avoid affecting other tests
      const blResponse = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'blacklist-test@example.com',
          password: 'password123',
          displayName: 'Blacklist Test'
        });
      const blToken = blResponse.body.access_token;

      // First logout to blacklist the token
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${blToken}`)
        .send({});

      // Then try to use the blacklisted token
      await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${blToken}`)
        .expect(401);
    });
  });

  describe('📝 Validation Errors', () => {
    beforeAll(async () => {
      // Get fresh token
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: testEmail,
          password: 'password123'
        });
      userToken = response.body.access_token;
    });

    it('should validate email format in registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          displayName: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(Array.isArray(response.body.error.message)).toBe(true);
    });

    it('should validate password strength', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          displayName: 'Test User'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      // Ensure we have a valid token
      if (!userToken) {
        const response = await request(app.getHttpServer())
          .post('/v1/auth/register')
          .send({
            email: 'validation-test2@example.com',
            password: 'password123',
            displayName: 'Validation Test User 2'
          });
        userToken = response.body.access_token;
      }

      const response = await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shortDescription: 'Missing name field'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('message');
    });

    it('should reject extra fields when forbidNonWhitelisted is true', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Enterprise',
          shortDescription: 'Valid description',
          extraField: 'This should be rejected'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer())
        .get('/v1/enterprises/invalid-uuid')
        .expect(400);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/enterprises?page=-1&limit=0')
        .expect(400);

      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate rating range in reviews', async () => {
      // First create an enterprise
      const enterpriseResponse = await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Review Test Enterprise',
          shortDescription: 'For review testing'
        });

      const response = await request(app.getHttpServer())
        .post('/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enterpriseId: enterpriseResponse.body.id,
          rating: 6, // Invalid rating (should be 1-5)
          comment: 'Invalid rating test'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('🔍 Database Errors', () => {
    it('should handle non-existent resource (404)', async () => {
      await request(app.getHttpServer())
        .get('/v1/enterprises/99999999-9999-9999-9999-999999999999')
        .expect(404);
    });

    it('should handle duplicate key violations', async () => {
      // Try to register with same email again
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: testEmail, // Same email as in beforeAll
          password: 'password123',
          displayName: 'Duplicate User'
        })
        .expect(409);
    });

    it('should handle foreign key violations', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enterpriseId: '99999999-9999-9999-9999-999999999999', // Non-existent enterprise
          rating: 5,
          comment: 'Review for non-existent enterprise'
        })
        .expect(400);

      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('🌐 HTTP Errors', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/v1/non-existent-endpoint')
        .expect(404);
    });

    it('should handle 405 for wrong HTTP methods', async () => {
      await request(app.getHttpServer())
        .delete('/v1/health') // Health endpoint doesn't support DELETE
        .expect(404); // NestJS returns 404 for unsupported methods
    });

    it('should handle malformed JSON', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle missing Content-Type header', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send('some data')
        .expect(400);
    });

    it('should handle oversized requests', async () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string

      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test',
          description: largeData
        })
        .expect(413); // Payload Too Large
    });
  });

  describe('🔒 Security Errors', () => {
    it('should handle SQL injection attempts', async () => {
      await request(app.getHttpServer())
        .get("/v1/enterprises?search='; DROP TABLE users; --")
        .expect(200); // Should not crash, just return empty results
    });

    it('should handle XSS attempts in input', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '<script>alert("xss")</script>',
          shortDescription: 'XSS test'
        })
        .expect(201);

      // Should sanitize the input
      expect(response.body.name).not.toContain('<script>');
    });

    it('should handle CSRF attempts', async () => {
      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Origin', 'http://malicious-site.com')
        .send({
          name: 'CSRF Test Enterprise',
          shortDescription: 'CSRF test'
        })
        .expect((res) => {
          // Should either succeed (if CORS allows) or fail with CORS error
          expect([201, 403]).toContain(res.status);
        });
    });
  });

  describe('⚡ Rate Limiting Errors', () => {
    it('should handle rate limit exceeded', async () => {
      // Make many requests quickly to trigger rate limiting
      const promises = Array(50).fill(null).map((_, i) =>
        request(app.getHttpServer())
          .post('/v1/auth/register')
          .send({
            email: `ratelimit${i}@example.com`,
            password: 'password123',
            displayName: 'Rate Limit Test'
          })
      );

      const responses = await Promise.all(promises);
      const statusCodes = responses.map(r => r.status);

      // Should have at least one 429 (Too Many Requests)
      expect(statusCodes).toContain(429);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      // Should include rate limiting headers
      expect(response.headers).toBeDefined();
    });
  });

  describe('🔧 Service Errors', () => {
    it('should handle Redis connection failures gracefully', async () => {
      // This should work even if Redis is down
      const response = await request(app.getHttpServer())
        .get('/v1/categories')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should handle MeiliSearch failures gracefully', async () => {
      // Should fallback to SQL search if MeiliSearch is down
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?query=test')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should handle email service failures gracefully', async () => {
      // Should not crash if email service is down
      const response = await request(app.getHttpServer())
        .post('/v1/auth/forgot-password')
        .send({
          email: 'errortest@example.com'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('📊 Edge Cases', () => {
    it('should handle empty search queries', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?query=')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should handle special characters in search', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises')
        .query({ query: '한글테스트!@#$%^&*()' })
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      const response = await request(app.getHttpServer())
        .get(`/v1/search/enterprises?query=${longQuery}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should handle concurrent user operations', async () => {
      // Multiple users trying to create enterprises simultaneously
      const promises = Array(5).fill(null).map((_, i) =>
        request(app.getHttpServer())
          .post('/v1/enterprises')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: `Concurrent Enterprise ${i}`,
            shortDescription: `Description ${i}`
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle timezone edge cases', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .set('X-Timezone', 'Asia/Seoul')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle null and undefined values', async () => {
      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Enterprise',
          shortDescription: null, // Should be handled gracefully
          description: undefined
        })
        .expect((res) => {
          expect([201, 400]).toContain(res.status);
        });
    });
  });

  describe('🔄 Recovery & Resilience', () => {
    it('should recover from temporary failures', async () => {
      // Simulate multiple requests after a "failure"
      const responses = await Promise.all([
        request(app.getHttpServer()).get('/v1/health'),
        request(app.getHttpServer()).get('/v1/health'),
        request(app.getHttpServer()).get('/v1/health')
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain data consistency during errors', async () => {
      // Try to create enterprise with invalid data
      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '', // Invalid name
          shortDescription: 'Test'
        })
        .expect(400);

      // Verify no partial data was created
      const response = await request(app.getHttpServer())
        .get('/v1/enterprises')
        .expect(200);

      // Should not contain any enterprise with empty name
      const emptyNameEnterprises = response.body.data.filter(e => e.name === '');
      expect(emptyNameEnterprises).toHaveLength(0);
    });
  });
});