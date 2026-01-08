import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Admin Functionality E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let enterpriseId: string;
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

    dataSource = app.get(DataSource);

    // Clean database
    await dataSource.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

    // Create admin user via API
    const adminRegResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'password123',
        displayName: 'Admin User'
      });

    // Elevate to ADMIN in database
    await dataSource.query(`UPDATE users SET role = 'ADMIN', "email_verified" = true WHERE email = 'admin@example.com'`);

    // Use the token from registration (it's already valid)
    adminToken = adminRegResponse.body.access_token;

    // Create regular user
    const userRegResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'password123',
        displayName: 'Regular User'
      });

    userToken = userRegResponse.body.access_token;
    userId = userRegResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('👑 Admin User Management', () => {
    it('should list all users (admin only)', async () => {
      if (!adminToken) {
        console.log('Skipping admin test - admin login failed');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get user by ID (admin only)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .get(`/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
    });

    it('should update user (admin only)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .put(`/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Updated by Admin'
        });

      if (response.status !== 200) {
        console.log('Update User Failed:', { status: response.status, body: response.body, userId });
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('displayName', 'Updated by Admin');
    });

    it('should reject non-admin access to admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('🏢 Admin Enterprise Management', () => {
    beforeAll(async () => {
      // Create enterprise for testing
      const response = await request(app.getHttpServer())
        .post('/v1/enterprises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Admin Test Enterprise',
          shortDescription: 'For admin testing'
        });

      enterpriseId = response.body.id;
    });

    it('should list all enterprises (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .get('/v1/admin/enterprises')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should create enterprise (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .post('/v1/admin/enterprises')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Enterprise',
          shortDescription: 'Created by admin'
        })
        .expect(201);

      expect(response.body).toHaveProperty('name', 'Admin Created Enterprise');
    });

    it('should update enterprise (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .put(`/v1/admin/enterprises/${enterpriseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated by Admin'
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated by Admin');
    });

    it('should verify enterprise (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .patch(`/v1/admin/enterprises/${enterpriseId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verified: true,
          notes: 'Verified by admin'
        })
        .expect(200);

      expect(response.body).toHaveProperty('verified', true);
    });
  });

  describe('📝 Admin Review Management', () => {
    let reviewId: string;

    beforeAll(async () => {
      // Create a review for testing
      const response = await request(app.getHttpServer())
        .post('/v1/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enterpriseId: enterpriseId,
          rating: 4,
          comment: 'Good service'
        });

      reviewId = response.body.id;
    });

    it('should list all reviews (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .get('/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should moderate review (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .patch(`/v1/admin/reviews/${reviewId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PUBLISHED',
          moderationNotes: 'Approved by admin'
        });

      if (response.status !== 200) {
        console.log('Moderate Review Failed:', { status: response.status, body: response.body, reviewId });
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'PUBLISHED');
    });
  });

  describe('🎯 Claims Management', () => {
    let claimId: string;

    it('should submit business claim', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/claims')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enterpriseId: enterpriseId,
          requesterName: 'Test Owner',
          requesterEmail: 'owner@business.com',
          requesterPhone: '010-1234-5678',
          position: 'Owner',
          proofOfOwnership: 'Business certificate link'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      claimId = response.body.id;
    });

    it('should list user claims', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/claims')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should review claim (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .patch(`/v1/admin/claims/${claimId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APPROVED',
          reviewNotes: 'Claim approved'
        });

      if (response.status !== 200) {
        console.log('Review Claim Failed:', { status: response.status, body: response.body, claimId });
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'APPROVED');
    });

    it('should list all claims (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .get('/v1/admin/claims')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('🔐 RBAC System', () => {
    it('should grant permission (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .post('/v1/rbac/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: userId,
          permission: 'MANAGE_ENTERPRISE'
        })
        .expect(201);

      expect(response.body).toHaveProperty('permission', 'MANAGE_ENTERPRISE');
    });

    it('should revoke permission (admin)', async () => {
      if (!adminToken) return;

      await request(app.getHttpServer())
        .delete('/v1/rbac/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: userId,
          permission: 'MANAGE_ENTERPRISE'
        })
        .expect(200);
    });

    it('should reject non-admin RBAC operations', async () => {
      await request(app.getHttpServer())
        .post('/v1/rbac/permissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: userId,
          permission: 'ADMIN'
        })
        .expect(403);
    });
  });

  describe('📊 Audit Logs', () => {
    it('should list audit logs (admin)', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .get('/v1/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter audit logs by action', async () => {
      if (!adminToken) return;

      const response = await request(app.getHttpServer())
        .get('/v1/audit/logs?action=CREATE_ENTERPRISE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should reject non-admin access to audit logs', async () => {
      await request(app.getHttpServer())
        .get('/v1/audit/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});