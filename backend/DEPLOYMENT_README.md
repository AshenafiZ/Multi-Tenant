# 🚀 Backend Deployment Guide

Production-ready NestJS backend for Multi-Tenant Property Listing Platform.

## ✅ What's Been Fixed & Optimized

### 1. **Swagger Documentation** ✨
- ✅ Fixed login endpoint - now shows email/password fields properly
- ✅ Added comprehensive API documentation with examples
- ✅ Added detailed descriptions for all endpoints
- ✅ Added proper response types and error codes
- ✅ Enhanced Swagger UI with better organization and tags
- ✅ Added persistent authorization (token stays after refresh)

### 2. **Image Upload** 🖼️
- ✅ Fixed "Property ID required" error
- ✅ Properly handles multipart/form-data
- ✅ Validates propertyId as UUID
- ✅ Clear error messages

### 3. **Code Quality** 🏗️
- ✅ Clean, well-structured codebase
- ✅ Proper error handling with consistent HTTP status codes
- ✅ Comprehensive validation using class-validator
- ✅ Type-safe with TypeScript
- ✅ Production-ready error filters

### 4. **Authentication & Authorization** 🔐
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Owner, User)
- ✅ Bootstrap endpoint for first admin creation
- ✅ Proper guards and decorators

### 5. **Property Management** 🏠
- ✅ Draft → Published workflow
- ✅ Transactional publishing with validation
- ✅ Immutable published properties
- ✅ Soft deletes
- ✅ Admin can disable any property

---

## 📦 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Cloudinary account (for image uploads)
- npm or yarn

---

## 🔧 Environment Variables

Create `backend/.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-change-in-production"
JWT_EXPIRES_IN="24h"

# CORS
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3000"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Server
PORT=3000
NODE_ENV=production
```

**⚠️ Security Notes:**
- Use strong, random secrets for JWT tokens in production
- Never commit `.env` file to version control
- Use environment-specific values for dev/staging/prod

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database with initial admin
npx prisma db seed
```

### 3. Start Development Server
```bash
npm run start:dev
```

Server runs on: `http://localhost:3000`
Swagger UI: `http://localhost:3000/api`

---

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Test:**
1. Open Swagger UI: `http://localhost:3000/api`
2. Create first admin: `POST /auth/bootstrap`
3. Login: `POST /auth/login`
4. Authorize with token in Swagger
5. Test endpoints

---

## 📦 Production Build

### 1. Build
```bash
npm run build
```

### 2. Start Production Server
```bash
npm run start:prod
```

### 3. Run Migrations (Production)
```bash
npx prisma migrate deploy
```

---

## 🌐 Deployment Options

### Option 1: Railway
1. Connect your GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Railway auto-detects NestJS and deploys
4. Add PostgreSQL database in Railway
5. Update `DATABASE_URL` in environment variables

### Option 2: Render
1. Create new Web Service on Render
2. Connect GitHub repo
3. Build command: `npm install && npm run build`
4. Start command: `npm run start:prod`
5. Add PostgreSQL database
6. Set environment variables

### Option 3: Fly.io
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Add PostgreSQL: `fly postgres create`
5. Set secrets: `fly secrets set DATABASE_URL=...`

### Option 4: Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql`
5. Set config vars in Heroku dashboard
6. Deploy: `git push heroku main`

---

## 🔒 Security Checklist

- [ ] Change all default secrets in production
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Enable rate limiting (recommended: add `@nestjs/throttler`)
- [ ] Use environment-specific database URLs
- [ ] Enable database connection pooling
- [ ] Set up monitoring and logging
- [ ] Regular security updates: `npm audit fix`

---

## 📊 API Endpoints Summary

### Authentication (`/auth`)
- `POST /auth/bootstrap` - Create first admin (no auth)
- `POST /auth/login` - Login and get JWT token
- `POST /auth/register` - Register new user/owner
- `POST /auth/admin` - Create user (admin only)

### Properties (`/properties`)
- `GET /properties` - List published properties (public)
- `GET /properties/:id` - Get property details
- `POST /properties` - Create property (owner/admin)
- `PATCH /properties/:id` - Update draft property
- `POST /properties/:id/publish` - Publish property
- `POST /properties/:id/disable` - Disable property (admin)
- `DELETE /properties/:id` - Soft delete property

### Images (`/images`)
- `POST /images/upload` - Upload images for property
- `DELETE /images/:id` - Delete image

### Favorites (`/favorites`)
- `GET /favorites` - Get user favorites
- `POST /favorites` - Add to favorites
- `DELETE /favorites/:propertyId` - Remove from favorites
- `GET /favorites/count` - Get favorites count

### Messages (`/messages`)
- `POST /messages` - Send message
- `GET /messages/inbox` - Get received messages
- `GET /messages/sent` - Get sent messages
- `GET /messages/unread-count` - Get unread count
- `PATCH /messages/read` - Mark as read
- `DELETE /messages/:id` - Delete message

### Users (`/users`) - Admin Only
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user
- `GET /users/me` - Get own profile

---

## 🐛 Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure database is accessible
- Check firewall rules
- Verify credentials

### Image Upload Fails
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Check file format (JPEG/PNG/WEBP only)
- Ensure propertyId is valid UUID

### JWT Token Issues
- Check `JWT_SECRET` is set
- Verify token format: `Bearer <token>`
- Check token expiration (default: 24h)
- Re-login to get new token

### CORS Issues
- Set `FRONTEND_URL` in `.env`
- Check CORS configuration in `main.ts`
- Verify frontend URL matches exactly

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Swagger/OpenAPI](https://swagger.io/docs)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

## 🎯 Next Steps

1. ✅ Code is production-ready
2. ✅ Swagger documentation complete
3. ✅ Testing guide available
4. ⏭️ Deploy to your chosen platform
5. ⏭️ Set up monitoring (e.g., Sentry, LogRocket)
6. ⏭️ Configure CI/CD pipeline
7. ⏭️ Set up database backups

---

**Ready for Production! 🚀**

For testing instructions, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)

