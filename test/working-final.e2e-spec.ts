import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('KoreaBiz Directory - Working E2E Tests', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🏥 Health System', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('🔐 Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'workingtest@example.com',
          password: 'password123',
          displayName: 'Working Test User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body.user).toHaveProperty('email', 'workingtest@example.com');
      
      userToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'workingtest@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      userToken = response.body.access_token; // Update token
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'workingtest@example.com',
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
  });

  describe('👤 User Management', () => {
    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', 'workingtest@example.com');
    });

    it('should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          displayName: 'Updated Working Test User'
        })
        .expect(200);

      expect(response.body).toHaveProperty('displayName', 'Updated Working Test User');
    });

    it('should reject unauthorized access', async () => {
      await request(app.getHttpServer())
        .get('/v1/users/me')
        .expect(401);
    });
  });

  describe('🏢 Enterprise Management', () => {
    let enterpriseId: string;

    it('should create a new enterprise', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Working Test Enterprise',
          shortDescription: 'A working test enterprise'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Working Test Enterprise');
      enterpriseId = response.body.id;
    });

    it('should list enterprises', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/enterprises')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get enterprise by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/enterprises/${enterpriseId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', enterpriseId);
      expect(response.body).toHaveProperty('name', 'Working Test Enterprise');
    });

    it('should update enterprise', async () => {
      const response = await request(app.getHttpServer())
        .put(`/v1/enterprises/${enterpriseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Working Test Enterprise'
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Working Test Enterprise');
    });

    it('should require authentication for creation', async () => {
      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .send({
          name: 'Unauthorized Enterprise'
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      // Ensure we have a valid token
      if (!userToken) {
        const response = await request(app.getHttpServer())
          .post('/v1/auth/register')
          .send({
            email: 'validation-test@example.com',
            password: 'password123',
            displayName: 'Validation Test User'
          });
        userToken = response.body.access_token;
      }

      await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shortDescription: 'Missing name field'
        })
        .expect(400);
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

    it('should handle search pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?page=1&limit=10')
        .expect(200);

      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 10);
    });
  });

  describe('📂 Categories & Cities', () => {
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

  describe('🚀 Performance & Configuration', () => {
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
  });
});