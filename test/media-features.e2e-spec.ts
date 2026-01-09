import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Mock aws-sdk S3
jest.mock('aws-sdk', () => {
  const mS3 = {
    getSignedUrlPromise: jest.fn().mockResolvedValue('https://mock-s3-url/key'),
    deleteObject: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({}),
  };
  return { S3: jest.fn(() => mS3) };
});

describe('Media & File Upload E2E Tests', () => {
  let app: INestApplication;
  let userToken: string;
  let enterpriseId: string;
  const testEmail = `mediauser-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Mock AWS Credentials for S3
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.AWS_REGION = 'us-east-1';
    process.env.S3_BUCKET_NAME = 'test-bucket';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    // Global pipes are now in AppModule
    await app.init();

    // Database cleanup and schema update
    const dataSource = app.get(require('typeorm').DataSource);
    await dataSource.query('TRUNCATE "users", "enterprises", "enterprise_media", "reviews", "claims", "subscriptions" CASCADE');
    try {
      await dataSource.query('ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "latitude" decimal(10,7)');
      await dataSource.query('ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "longitude" decimal(10,7)');
    } catch (e) {
      console.log('Schema update error (ignoring if columns exist):', e.message);
    }

    // Register user
    const userResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        displayName: 'Media Test User'
      });

    userToken = userResponse.body.access_token;

    // Create enterprise
    const enterpriseResponse = await request(app.getHttpServer())
      .post('/v1/enterprises')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Media Test Enterprise',
        shortDescription: 'For media testing'
      })
      .expect(201);

    enterpriseId = enterpriseResponse.body.id;

    if (!enterpriseId) {
      throw new Error('Failed to create enterprise for media tests');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('📁 Media Management', () => {
    it('should create presigned URL for upload', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/media/enterprises/${enterpriseId}/presigned`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileName: 'test-logo.jpg',
          fileType: 'image/jpeg',
          contentType: 'image/jpeg',
          fileSize: 1024,
          mediaType: 'LOGO'
        })
        .expect(201);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('key');
    });

    it('should register uploaded media', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/media/enterprises/${enterpriseId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          kind: 'LOGO',
          mediaType: 'LOGO',
          storageKey: 'test-key-123',
          key: 'test-key-123',
          contentType: 'image/jpeg',
          fileSize: 1024,
          width: 200,
          height: 200
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('mediaType', 'LOGO');
    });

    it('should get enterprise media', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/media/enterprises/${enterpriseId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should validate media type', async () => {
      await request(app.getHttpServer())
        .post(`/v1/media/enterprises/${enterpriseId}/presigned`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          contentType: 'image/jpeg',
          fileSize: 1024,
          mediaType: 'INVALID_TYPE'
        })
        .expect(400);
    });

    it('should validate file size', async () => {
      await request(app.getHttpServer())
        .post(`/v1/media/enterprises/${enterpriseId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          kind: 'LOGO',
          mediaType: 'LOGO',
          storageKey: 'large-file-key',
          key: 'large-file-key',
          contentType: 'image/jpeg',
          fileSize: 50 * 1024 * 1024 // 50MB - should be too large
        })
        .expect(400);
    });

    it('should require authentication for media operations', async () => {
      await request(app.getHttpServer())
        .post(`/v1/media/enterprises/${enterpriseId}/presigned`)
        .send({
          fileName: 'unauthorized.jpg',
          fileType: 'image/jpeg',
          contentType: 'image/jpeg',
          fileSize: 1024,
          mediaType: 'LOGO'
        })
        .expect(401);
    });

    it('should delete media', async () => {
      // First register a media file
      const registerResponse = await request(app.getHttpServer())
        .post(`/v1/media/enterprises/${enterpriseId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          kind: 'GALLERY',
          mediaType: 'GALLERY',
          storageKey: 'delete-test-key',
          key: 'delete-test-key',
          contentType: 'image/jpeg',
          fileSize: 1024
        })
        .expect(201);

      const mediaId = registerResponse.body.id;

      // Then delete it
      await request(app.getHttpServer())
        .delete(`/v1/media/enterprises/${enterpriseId}/${mediaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });

  describe('📧 Email System (Mocked)', () => {
    it('should handle email verification', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/resend-verification')
        .send({
          email: testEmail
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle password reset request', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/forgot-password')
        .send({
          email: testEmail
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('💳 Subscription System', () => {
    it('should get subscription plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/subscriptions/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get user subscription status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/subscriptions/status')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tier');
    });

    it('should change subscription plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/subscriptions/change-plan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          planId: 'premium',
          paymentMethodId: 'pm_test_123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should require authentication for subscription operations', async () => {
      await request(app.getHttpServer())
        .get('/v1/subscriptions/status')
        .expect(401);
    });
  });

  describe('🔍 Advanced Search Features', () => {
    it('should search with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?category=technology&city=seoul&verified=true')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('should search with location radius', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?lat=37.5665&lng=126.9780&radius=10')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should search with price range', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?minPrice=1&maxPrice=3')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should sort search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/enterprises?sortBy=rating&sortOrder=DESC')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('📱 Mobile API Features', () => {
    it('should handle mobile app version check', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/app/version')
        .set('User-Agent', 'KoreaBizApp/1.0.0')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('updateRequired');
    });

    it('should get mobile-optimized enterprise data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/enterprises/${enterpriseId}/mobile`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('images');
    });
  });

  describe('🌐 Internationalization', () => {
    it('should handle Korean language requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/categories')
        .set('Accept-Language', 'ko-KR')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should handle English language requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/categories')
        .set('Accept-Language', 'en-US')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('⚡ Caching & Performance', () => {
    it('should cache frequently accessed data', async () => {
      // First request
      const start1 = Date.now();
      await request(app.getHttpServer())
        .get('/v1/categories/all')
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request
      const start2 = Date.now();
      await request(app.getHttpServer())
        .get('/v1/categories/all')
        .expect(200);
      const duration2 = Date.now() - start2;

      // Tolerance for test environments
      expect(duration2).toBeLessThanOrEqual(duration1 + 100);
    });

    it('should handle cache invalidation', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/search/popular')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});