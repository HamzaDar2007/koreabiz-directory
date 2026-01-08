import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('KoreaBiz Directory API (e2e)', () => {
  let app: INestApplication;

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

    // Clean up database before tests
    const dataSource = app.get(DataSource);
    await dataSource.query('TRUNCATE "users" CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/v1/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });

    it('/v1/health/live (GET) should return liveness status', () => {
      return request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'alive');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('Categories Endpoints', () => {
    it('/v1/categories (GET) should return categories list', () => {
      return request(app.getHttpServer())
        .get('/v1/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/v1/categories/all (GET) should return all categories', () => {
      return request(app.getHttpServer())
        .get('/v1/categories/all')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Cities Endpoints', () => {
    it('/v1/cities (GET) should return cities list', () => {
      return request(app.getHttpServer())
        .get('/v1/cities')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/v1/cities/all (GET) should return all cities', () => {
      return request(app.getHttpServer())
        .get('/v1/cities/all')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Enterprises Endpoints', () => {
    it('/v1/enterprises (GET) should return enterprises list', () => {
      return request(app.getHttpServer())
        .get('/v1/enterprises')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Search Endpoints', () => {
    it('/v1/search/enterprises (GET) should return search results', () => {
      return request(app.getHttpServer())
        .get('/v1/search/enterprises')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/v1/search/popular (GET) should return popular enterprises', () => {
      return request(app.getHttpServer())
        .get('/v1/search/popular')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/v1/search/featured (GET) should return featured enterprises', () => {
      return request(app.getHttpServer())
        .get('/v1/search/featured')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Authentication Endpoints', () => {
    it('/v1/auth/register (POST) should validate input', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
          displayName: 'Test'
        })
        .expect(400);
    });

    it('/v1/auth/login (POST) should validate input', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        })
        .expect(400);
    });
  });

  describe('Protected Endpoints', () => {
    it('/v1/users/me (GET) should require authentication', () => {
      return request(app.getHttpServer())
        .get('/v1/users/me')
        .expect(401);
    });

    it('/v1/enterprises (POST) should require authentication', () => {
      return request(app.getHttpServer())
        .post('/v1/enterprises')
        .send({
          name: 'Test Enterprise'
        })
        .expect(401);
    });
  });
});