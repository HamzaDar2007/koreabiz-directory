import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Categories (e2e)', () => {
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

  describe('/v1/categories (GET)', () => {
    it('should get categories list with pagination', () => {
      return request(app.getHttpServer())
        .get('/v1/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
        });
    });

    it('should get categories with custom pagination', () => {
      return request(app.getHttpServer())
        .get('/v1/categories?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('/v1/categories/all (GET)', () => {
    it('should get all categories without pagination', () => {
      return request(app.getHttpServer())
        .get('/v1/categories/all')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/v1/categories/:slug (GET)', () => {
    it('should get category by slug', () => {
      return request(app.getHttpServer())
        .get('/v1/categories/test-category')
        .expect((res) => {
          // Should return 200 if category exists or 404 if not
          expect([200, 404]).toContain(res.status);
        });
    });
  });
});