import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

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
        email: 'user-test-v2@example.com',
        password: 'password123',
        displayName: 'User Test'
      });

    accessToken = registerResponse.body.access_token;
    console.log('DEBUG: Register Response Status:', registerResponse.status);
    console.log('DEBUG: Access Token structure:', accessToken ? accessToken.substring(0, 10) + '...' : 'undefined');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/users/me (GET)', () => {
    it('should get current user profile', () => {
      return request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'user-test-v2@example.com');
          expect(res.body).toHaveProperty('displayName', 'User Test');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/v1/users/me')
        .expect(401);
    });
  });

  describe('/v1/users/me (PUT)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .put('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'Updated User Test'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.displayName).toBe('Updated User Test');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put('/v1/users/me')
        .send({
          displayName: 'Unauthorized Update'
        })
        .expect(401);
    });
  });
});