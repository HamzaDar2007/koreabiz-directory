# KoreaBiz Directory Backend

Production-ready NestJS API for Korean business directory with comprehensive features.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with RBAC
- **Business Management**: Full CRUD with ownership & verification
- **Review System**: Moderated reviews with rating aggregation
- **Claims Workflow**: Business ownership claiming system
- **Subscriptions**: Tiered plans with feature entitlements
- **Search**: Meilisearch integration with ranking
- **Analytics**: Privacy-first daily aggregation
- **Media Management**: S3-compatible file uploads
- **Audit Logging**: Comprehensive system auditing
- **Rate Limiting**: Built-in request throttling

## 🛠 Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Search**: Meilisearch
- **Storage**: S3-compatible (AWS S3/Cloudflare R2)
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 🐳 Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
```

## 🔧 Environment Variables

See `.env.example` for all configuration options.

## 📚 API Documentation

Once running, visit: `http://localhost:3001/api/docs`

## 🗄 Database Schema

- **19 Tables**: Users, Enterprises, Reviews, Claims, etc.
- **Full RBAC**: Role-based permissions system
- **Audit Trail**: All sensitive operations logged
- **Soft Deletes**: Data preservation with recovery

## 🔐 Security Features

- Argon2id password hashing
- JWT token rotation
- Rate limiting
- Input validation
- CORS protection
- Environment-based secrets

## 📈 Production Ready

- Health check endpoints
- Structured logging
- Error handling
- Docker containerization
- Migration-driven schema
- Horizontal scaling support

## 🚦 API Endpoints

### Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

### Enterprises
- `GET /api/v1/enterprises`
- `POST /api/v1/enterprises`
- `GET /api/v1/enterprises/:id`
- `PATCH /api/v1/enterprises/:id`

### Reviews
- `POST /api/v1/reviews`
- `GET /api/v1/reviews/enterprise/:id`
- `PATCH /api/v1/admin/reviews/:id/moderate`

### Claims
- `POST /api/v1/claims`
- `GET /api/v1/admin/claims`
- `PATCH /api/v1/admin/claims/:id/review`

## 📊 Monitoring

- Health: `GET /api/v1/health`
- Metrics: Built-in performance monitoring
- Audit: `GET /api/v1/admin/audit`