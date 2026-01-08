# KoreaBiz Directory - Deployment Guide

This document outlines the steps to deploy the KoreaBiz Directory backend to a production environment.

## 1. Prerequisites
- Node.js 20.x
- PostgreSQL 15+
- Redis 7+
- Meilisearch 1.x
- AWS S3 Bucket (for media)

## 2. Infrastructure Setup
### Docker (Recommended)
Use the provided `docker-compose.yml` for local testing or as a base for production:
```bash
docker-compose up -d
```

## 3. Environment Configuration
Copy `.env.example` to `.env` and fill in the production secrets:
```bash
cp .env.example .env
```
Key variables to set:
- `JWT_SECRET` & `JWT_REFRESH_SECRET`
- `DB_PASSWORD`
- `MEILISEARCH_API_KEY`
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`

## 4. Initial Deployment
1. **Install Dependencies**:
   ```bash
   npm install --production
   ```
2. **Build the Application**:
   ```bash
   npm run build
   ```
3. **Run Migrations**:
   ```bash
   npm run migration:run
   ```
4. **Sync Meilisearch Index**:
   Invoke the search service sync endpoint (implementation recommended for bulk initial sync).

## 5. Security Checklist
- [ ] Ensure `CORS_ORIGIN` matches your frontend domain.
- [ ] Verify `JWT_EXPIRATION` is set to a short duration (e.g., `15m`).
- [ ] Use a reverse proxy (Nginx/Cloudflare) for SSL termination.
- [ ] Enable rate limiting (built-in) and scale appropriately.

## 6. Monitoring
- **Logs**: Check `logs/combined.log` and `logs/error.log`.
- **Health**: Monitor `/v1/health` endpoint for DB, Redis, and Search status.
