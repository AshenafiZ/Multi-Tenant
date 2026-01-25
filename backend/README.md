# PropertyHub Backend API

A production-ready NestJS backend for the Multi-Tenant Property Listing Platform.

## Features

- ✅ JWT-based authentication with role-based access control
- ✅ Property management (create, update, publish, delete)
- ✅ Image upload with Cloudinary integration
- ✅ Favorites system
- ✅ Messaging between users
- ✅ User management (admin only)
- ✅ Soft deletes for all entities
- ✅ Pagination and filtering
- ✅ Transactional property publishing
- ✅ Swagger API documentation
- ✅ Comprehensive error handling

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Passport.js)
- **File Upload**: Multer + Cloudinary
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Cloudinary account (for image uploads)
- npm or yarn

## Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` (if exists) or create `.env` file
   - Fill in all required variables (see Environment Variables section)

4. **Set up database:**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database with initial admin
npx prisma db seed
```

5. **Start development server:**
```bash
npm run start:dev
```

6. **Access the application:**
   - API: [http://localhost:3000](http://localhost:3000)
   - Swagger UI: [http://localhost:3000/api](http://localhost:3000/api)

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/propertyhub?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/propertyhub?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# CORS
FRONTEND_URL="http://localhost:3001"
API_URL="http://localhost:3000"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Server
PORT=3000
NODE_ENV=development
```

**⚠️ Security Notes:**
- Use strong, random secrets for JWT tokens in production
- Never commit `.env` file to version control
- Use environment-specific values for dev/staging/prod
- Generate secure secrets: `openssl rand -base64 32`

## Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── guards/        # JWT guards, role guards
│   │   ├── strategies/    # Passport strategies
│   │   ├── decorators/    # @CurrentUser, @Roles decorators
│   │   └── dto/          # Auth DTOs
│   ├── properties/        # Property management
│   │   ├── dto/          # Property DTOs
│   │   ├── entities/     # Response entities
│   │   └── ...
│   ├── images/           # Image upload service
│   ├── favorites/        # Favorites management
│   ├── messages/         # Messaging system
│   ├── users/            # User management
│   ├── prisma/           # Prisma service
│   ├── common/           # Shared utilities
│   │   ├── guards/       # Owner guard
│   │   ├── filters/      # Exception filters
│   │   ├── pipes/        # Validation pipes
│   │   └── decorators/   # Custom decorators
│   └── main.ts           # Application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seeding
└── test/                 # E2E tests
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Using psql
createdb propertyhub

# Or using SQL
psql -U postgres
CREATE DATABASE propertyhub;
```

### 2. Run Migrations

```bash
# Development (creates migration files)
npx prisma migrate dev --name init

# Production (applies migrations)
npx prisma migrate deploy
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Seed Database (Optional)

```bash
npx prisma db seed
```

This creates the first admin user. Default credentials:
- Email: `admin@example.com`
- Password: `admin123` (change in production!)

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/bootstrap` - Create first admin (one-time)
- `GET /auth/current-user` - Get current user

### Properties
- `GET /properties` - List properties (public, role-based)
- `GET /properties/:id` - Get property details
- `POST /properties` - Create property (owner/admin)
- `PATCH /properties/:id` - Update property (owner/admin, draft only)
- `POST /properties/:id/publish` - Publish property (owner/admin)
- `POST /properties/:id/disable` - Archive property (admin only)
- `DELETE /properties/:id` - Soft delete property (owner/admin)

### Images
- `POST /images` - Upload images for property
- `DELETE /images/:id` - Delete image

### Favorites
- `GET /favorites` - Get user's favorites
- `POST /favorites` - Add to favorites
- `DELETE /favorites/:propertyId` - Remove from favorites

### Messages
- `GET /messages` - Get messages (inbox/sent)
- `POST /messages` - Send message
- `PATCH /messages/:id/read` - Mark as read

### Users (Admin Only)
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `DELETE /users/:id` - Soft delete user

## Swagger Documentation

Once the server is running, access Swagger UI at:
- **URL**: [http://localhost:3000/api](http://localhost:3000/api)

**Features:**
- Interactive API testing
- Request/response schemas
- Authentication support (click "Authorize" button)
- All endpoints documented

## Available Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server (watch mode)
- `npm run build` - Build for production
- `npm run start:prod` - Start production server (after build)
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:cov` - Run tests with coverage

## Role-Based Access Control

### Roles
- **admin**: Full access to all features
- **owner**: Can create and manage own properties
- **user**: Can view published properties, save favorites, send messages

### Implementation
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `OwnerGuard`
- **Decorators**: `@Roles()`, `@CurrentUser()`
- **Usage**: Applied at controller level

Example:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-only')
```

## Key Features

### Transactional Publishing
- Properties are validated before publishing
- Status change is atomic (transaction)
- Prevents race conditions

### Soft Deletes
- All entities use `deletedAt` field
- Deleted records are hidden by default
- Admins can view deleted records

### Image Upload
- Validates file type (JPEG, PNG, WEBP)
- Validates file size (max 5MB)
- Uploads to Cloudinary
- Supports multiple images per property

### Pagination & Filtering
- Server-side pagination
- Filter by location, price range, status
- Search functionality
- Configurable page size

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Deployment

See [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) for detailed deployment instructions.

### Quick Deploy (Railway)

1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
FRONTEND_URL="https://your-frontend.com"
API_URL="https://your-api.com"
NODE_ENV=production
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Ensure database exists
- Check network/firewall settings

### Prisma Client Errors
```bash
npx prisma generate
```

### Migration Issues
```bash
# Reset database (development only!)
npx prisma migrate reset

# Apply migrations
npx prisma migrate deploy
```

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process using port 3000

### Cloudinary Upload Fails
- Verify Cloudinary credentials
- Check API key permissions
- Verify cloud name is correct

## Security Best Practices

1. **Never commit `.env` files**
2. **Use strong JWT secrets** (32+ characters, random)
3. **Enable HTTPS in production**
4. **Set proper CORS origins**
5. **Validate all inputs** (DTOs with class-validator)
6. **Use parameterized queries** (Prisma handles this)
7. **Implement rate limiting** (consider adding)
8. **Regular security updates** (`npm audit`)

## API Response Format

### Success Response
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation error",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/properties"
}
```

## Support

For issues or questions:
1. Check Swagger documentation: `/api`
2. Review error logs
3. Check database connection
4. Verify environment variables

