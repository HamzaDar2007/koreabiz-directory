# KoreaBiz Directory Backend - Production Ready

A comprehensive NestJS backend for the KoreaBiz Directory platform, featuring enterprise listings, reviews, claims management, and subscription-based monetization.

## 🚀 Features

- **Enterprise Management**: Full CRUD operations with ownership and verification
- **Advanced Search**: Meilisearch integration with filtering and ranking
- **Review System**: Moderated reviews with automatic rating aggregation
- **Claims Workflow**: Business ownership verification process
- **Subscription Tiers**: Feature-based monetization (Free, Basic, Pro, Enterprise)
- **Media Upload**: S3-compatible storage with subscription limits
- **RBAC**: Role-based access control with granular permissions
- **Analytics**: Privacy-first daily aggregation
- **Production Ready**: Health checks, logging, rate limiting, security

## 🛠 Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL with TypeORM
- **Search**: Meilisearch
- **Cache**: Redis
- **Storage**: AWS S3 / Cloudflare R2
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, CORS, rate limiting, Argon2 hashing

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Meilisearch 1.5+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Start services with Docker
docker-compose up -d postgres redis meilisearch

# Run migrations
npm run migration:run
```

### 4. Development

```bash
# Start in development mode
npm run start:dev

# API will be available at http://localhost:3001/v1
# Documentation at http://localhost:3001/api/docs
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Copy production environment
cp .env.example .env.production

# Deploy with production config
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/v1/health

## 🔧 Configuration

### Key Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=koreabiz

# JWT Security
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret

# External Services
REDIS_HOST=localhost
MEILISEARCH_HOST=http://localhost:7700

# AWS S3 / R2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=koreabiz-media
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Monitoring

### Health Endpoints
- `GET /v1/health` - Overall system health
- `GET /v1/health/ready` - Readiness probe
- `GET /v1/health/live` - Liveness probe

### Logging
Structured JSON logging with different levels:
- Development: Console output
- Production: JSON format for log aggregation

## 🔒 Security Features

- **Authentication**: JWT with 15min access + 7day refresh tokens
- **Authorization**: RBAC with granular permissions
- **Rate Limiting**: Configurable per endpoint
- **Input Validation**: Class-validator with DTOs
- **Security Headers**: Helmet.js integration
- **CORS**: Configurable origins
- **Password Hashing**: Argon2id

## 📈 Performance

- **Database**: Optimized queries with proper indexing
- **Search**: Meilisearch for fast full-text search
- **Caching**: Redis for session and rate limiting
- **CDN**: S3/R2 with CDN for media delivery

## ✅ Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring setup (health checks)
- [ ] Log aggregation configured
- [ ] Backup strategy implemented
- [ ] Rate limits configured
- [ ] CORS origins restricted

## 📝 API Endpoints

### Public Endpoints
- `GET /v1/enterprises` - List enterprises
- `GET /v1/enterprises/:id` - Get enterprise details
- `GET /v1/search` - Search enterprises
- `GET /v1/categories` - List categories
- `GET /v1/cities` - List cities

### Authentication
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh token

### Enterprise Management
- `POST /v1/enterprises` - Create enterprise (Owner)
- `PUT /v1/enterprises/:id` - Update enterprise (Owner)
- `POST /v1/claims` - Submit ownership claim

### Admin Endpoints
- `GET /v1/admin/enterprises` - Admin enterprise list
- `POST /v1/admin/enterprises` - Admin create enterprise
- `PUT /v1/admin/enterprises/:id/verify` - Verify enterprise
- `GET /v1/admin/claims` - Review claims

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@koreabiz.com or create an issue in the repository.