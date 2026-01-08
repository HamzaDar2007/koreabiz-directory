import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Search (e2e)', () => {
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

  describe('/v1/search/enterprises (GET)', () => {
    it('should search enterprises', () => {
      return request(app.getHttpServer())
        .get('/v1/search/enterprises')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should search enterprises with query', () => {
      return request(app.getHttpServer())
        .get('/v1/search/enterprises?query=test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('should search enterprises with pagination', () => {
      return request(app.getHttpServer())
        .get('/v1/search/enterprises?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta).toHaveProperty('page', 1);
          expect(res.body.meta).toHaveProperty('limit', 10);
        });
    });
  });

  describe('/v1/search/popular (GET)', () => {
    it('should get popular enterprises', () => {
      return request(app.getHttpServer())
        .get('/v1/search/popular')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/v1/search/featured (GET)', () => {
    it('should get featured enterprises', () => {
      return request(app.getHttpServer())
        .get('/v1/search/featured')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});