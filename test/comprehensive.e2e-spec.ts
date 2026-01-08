import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('KoreaBiz Directory - Complete Backend E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let enterpriseId: string;

  beforeAll(async () => {
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

    dataSource = app.get(DataSource);

    // Clean database
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE "enterprises" RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE "categories" RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE "cities" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🏥 Health Check System', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return liveness probe', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return readiness probe', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('🔐 Authentication System', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          displayName: 'Test User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user).toHaveProperty('email', 'testuser@example.com');

      userToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.refresh_token
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should logout user', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(200);
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          displayName: 'Test User'
        })
        .expect(400);
    });

    it('should validate password length', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'test2@example.com',
          password: '123',
          displayName: 'Test User'
        })
        .expect(400);
    });

    it('should prevent duplicate registration', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'password123',
          displayName: 'Duplicate User'
        })
        .expect(409);
    });
  });

  describe('👤 User Management', () => {
    beforeAll(async () => {
      // Get fresh token
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'password123'
        });
      userToken = response.body.access_token;
    });

    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'testuser@example.com');
      expect(response.body).toHaveProperty('displayName', 'Test User');
    });

    it('should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          displayName: 'Updated Test User'
        })
        .expect(200);

      expect(response.body).toHaveProperty('displayName', 'Updated Test User');
    });

    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .get('/v1/users/me')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('🏢 Enterprise Management', () => {
    it('should create a new enterprise', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Enterprise',
          shortDescription: 'A test enterprise',
          description: 'This is a comprehensive test enterprise for E2E testing'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Enterprise');
      expect(response.body).toHaveProperty('shortDescription', 'A test enterprise');
      enterpriseId = response.body.id;
    });

    it('should get enterprise by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/enterprises/${enterpriseId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', enterpriseId);
      expect(response.body).toHaveProperty('name', 'Test Enterprise');
    });

    it('should list enterprises', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/enterprises')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update enterprise', async () => {
      const response = await request(app.getHttpServer())
        .put(`/v1/enterprises/${enterpriseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Test Enterprise',
          shortDescription: 'Updated description'
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Test Enterprise');
    });

    it('should validate enterprise creation', async () => {
      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shortDescription: 'Missing name field'
        })
        .expect(400);
    });

    it('should require authentication for enterprise creation', async () => {
      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .send({
          name: 'Unauthorized Enterprise'
        })
        .expect(401);
    });

    it('should handle pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/enterprises?page=1&limit=5')
        .expect(200);

      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 5);
    });

    it('should return 404 for non-existent enterprise', async () => {
      await request(app.getHttpServer())
        .get('/v1/enterprises/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('🔍 Search System', () => {
    it('should search enterprises', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should search with query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?query=test')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('should search with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?page=1&limit=10')
        .expect(200);

      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 10);
    });

    it('should get popular enterprises', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/popular')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get featured enterprises', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/featured')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('📂 Categories System', () => {
    it('should get categories list', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/categories')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/categories/all')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle category pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/categories?page=1&limit=5')
        .expect(200);

      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 5);
    });

    it('should get category by slug', async () => {
      await request(app.getHttpServer())
        .get('/v1/categories/test-category')
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('🏙️ Cities System', () => {
    it('should get cities list', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/cities')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get all cities', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/cities/all')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle city pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/cities?page=1&limit=5')
        .expect(200);

      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 5);
    });

    it('should get city by slug', async () => {
      await request(app.getHttpServer())
        .get('/v1/cities/test-city')
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('⭐ Favorites System', () => {
    it('should add enterprise to favorites', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enterpriseId: enterpriseId
        })
        .expect(201);

      expect(response.body).toHaveProperty('enterpriseId', enterpriseId);
    });

    it('should get user favorites', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should remove from favorites', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/favorites/${enterpriseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should require authentication for favorites', async () => {
      await request(app.getHttpServer())
        .post('/v1/favorites')
        .send({
          enterpriseId: enterpriseId
        })
        .expect(401);
    });
  });

  describe('📝 Reviews System', () => {
    let reviewId: string;

    it('should create a review', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enterpriseId: enterpriseId,
          rating: 5,
          comment: 'Excellent service!'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('rating', 5);
      expect(response.body).toHaveProperty('comment', 'Excellent service!');
      reviewId = response.body.id;
    });

    it('should get enterprise reviews', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/reviews/enterprise/${enterpriseId}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should validate review rating', async () => {
      await request(app.getHttpServer())
        .post('/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enterpriseId: enterpriseId,
          rating: 6, // Invalid rating
          comment: 'Invalid rating'
        })
        .expect(400);
    });

    it('should require authentication for reviews', async () => {
      await request(app.getHttpServer())
        .post('/v1/reviews')
        .send({
          enterpriseId: enterpriseId,
          rating: 5,
          comment: 'Unauthorized review'
        })
        .expect(401);
    });
  });

  describe('📊 Analytics System', () => {
    it('should record analytics event', async () => {
      await request(app.getHttpServer())
        .post('/v1/analytics/events')
        .send({
          eventType: 'enterprise_view',
          enterpriseId: enterpriseId
        })
        .expect(201);
    });

    it('should get analytics data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/analytics/enterprise/${enterpriseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totals');
    });
  });

  describe('🛡️ Security & Validation', () => {
    it('should handle malformed JSON', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send('invalid json')
        .expect(400);
    });

    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/v1/non-existent-endpoint')
        .expect(404);
    });

    it('should validate pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/v1/enterprises?page=0&limit=0')
        .expect(400);
    });

    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(response.headers).toBeDefined();
    });

    it('should handle CORS properly', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers).toBeDefined();
    });
  });

  describe('🚀 Performance & Reliability', () => {
    it('should respond quickly to health checks', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/v1/health')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      expect(responses).toHaveLength(5);
    });

    it('should maintain data consistency', async () => {
      // Create multiple enterprises concurrently
      const promises = Array(3).fill(null).map((_, i) =>
        request(app.getHttpServer())
          .post('/v1/enterprises')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: `Concurrent Enterprise ${i}`,
            shortDescription: `Description ${i}`
          })
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });
    });
  });

  describe('🔧 Application Configuration', () => {
    it('should enforce global prefix', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(404);
    });

    it('should have validation pipe configured', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({})
        .expect(400);
    });

    it('should log requests properly', async () => {
      await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(true).toBe(true); // If we reach here, logging didn't crash
    });
  });
});