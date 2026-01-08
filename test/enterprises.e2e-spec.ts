import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Enterprises (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
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

    // Clean up database before tests
    const dataSource = app.get(DataSource);
    await dataSource.query('TRUNCATE "users" CASCADE');

    // Register and login to get access token
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'enterprise-test-v2@example.com',
        password: 'password123',
        displayName: 'Enterprise Test User'
      });

    accessToken = registerResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/enterprises (GET)', () => {
    it('should get enterprises list', () => {
      return request(app.getHttpServer())
        .get('/v1/enterprises')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter enterprises by city', () => {
      const cityId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .get(`/v1/enterprises?cityId=${cityId}`)
        .expect(200);
    });
  });

  describe('/v1/enterprises (POST)', () => {
    it('should create a new enterprise', () => {
      return request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Enterprise',
          shortDescription: 'A test enterprise',
          description: 'This is a test enterprise for E2E testing'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Enterprise');
          enterpriseId = res.body.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/v1/enterprises')
        .send({
          name: 'Test Enterprise 2',
          shortDescription: 'Another test enterprise'
        })
        .expect(401);
    });
  });

  describe('/v1/enterprises/:id (GET)', () => {
    it('should get enterprise by id', () => {
      return request(app.getHttpServer())
        .get(`/v1/enterprises/${enterpriseId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(enterpriseId);
          expect(res.body.name).toBe('Test Enterprise');
        });
    });

    it('should return 404 for non-existent enterprise', () => {
      const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      return request(app.getHttpServer())
        .get(`/v1/enterprises/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('/v1/enterprises/:id (PUT)', () => {
    it('should update enterprise', () => {
      return request(app.getHttpServer())
        .put(`/v1/enterprises/${enterpriseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Test Enterprise',
          shortDescription: 'Updated description'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Test Enterprise');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/v1/enterprises/${enterpriseId}`)
        .send({
          name: 'Unauthorized Update'
        })
        .expect(401);
    });
  });
});