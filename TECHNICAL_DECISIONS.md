# Technical Decisions

This document outlines the key technical decisions made during the development of the Multi-Tenant Property Listing Platform, including framework choices, architecture patterns, and scalability considerations.

---

## Backend Framework: NestJS

### Why NestJS?

**NestJS** was chosen as the backend framework for the following reasons:

1. **Type Safety & Developer Experience**
   - Built-in TypeScript support with excellent type inference
   - Strong typing throughout the application reduces runtime errors
   - Better IDE support and autocomplete

2. **Modular Architecture**
   - Clear separation of concerns with modules, controllers, and services
   - Dependency injection makes code testable and maintainable
   - Easy to scale and organize as the application grows

3. **Built-in Features**
   - **Authentication**: Integrated Passport.js for JWT authentication
   - **Validation**: class-validator and class-transformer for DTO validation
   - **Documentation**: Swagger/OpenAPI integration out of the box
   - **Guards & Interceptors**: Built-in support for authorization and request transformation

4. **Enterprise-Ready**
   - Designed for scalable, production applications
   - Excellent error handling with exception filters
   - Supports microservices architecture if needed in the future

5. **Ecosystem & Community**
   - Rich ecosystem with Prisma integration
   - Decorators make role-based access control cleaner (`@Roles()`, `@UseGuards()`)
   - Active community and comprehensive documentation

### Alternative Considered: Express.js

Express.js was considered but rejected because:
- Requires more boilerplate code for similar functionality
- Less structured approach makes team collaboration harder
- No built-in dependency injection
- Would need to manually integrate Passport, validation, Swagger, etc.
- NestJS decorators make RBAC implementation much cleaner

**Conclusion**: NestJS provides better structure, type safety, and built-in features that significantly reduce development time and improve code quality.

---

## State Management: TanStack Query + Zustand

### TanStack Query (React Query) for Server State

**Why TanStack Query?**

1. **Automatic Caching**
   - Reduces unnecessary API calls
   - Intelligent cache invalidation
   - Background refetching keeps data fresh

2. **Built-in Async State Management**
   - Handles loading, error, and success states automatically
   - No need to manually manage `isLoading`, `error` flags
   - Reduces boilerplate significantly

3. **Optimistic Updates**
   - Built-in support for optimistic UI updates
   - Immediate user feedback before server confirmation
   - Automatic rollback on error

4. **Server State Synchronization**
   - Perfect for API data that needs to stay in sync
   - Automatic refetching on window focus
   - Query invalidation for cache updates

5. **Developer Experience**
   - Simple API: `useQuery`, `useMutation`
   - Less boilerplate than Redux for server state
   - Excellent TypeScript support

**Alternatives Considered:**
- **Redux Toolkit**: More boilerplate, overkill for server state management
- **SWR**: Similar to TanStack Query but less feature-rich
- **Apollo Client**: Only needed for GraphQL, unnecessary overhead for REST

### Zustand for Client State

**Why Zustand?**

1. **Simplicity**
   - Minimal API, easy to learn
   - No actions, reducers, or providers needed
   - Direct state updates with `set()`

2. **Performance**
   - Lightweight: ~1KB gzipped vs Redux's ~10KB+
   - Selective subscriptions prevent unnecessary re-renders
   - No context provider overhead

3. **Persistence**
   - Built-in middleware for localStorage persistence
   - Easy to implement custom storage adapters
   - Handles serialization automatically

4. **Cross-Tab Synchronization**
   - Easy to implement with storage events
   - Used for favorites sync across browser tabs
   - Minimal code required

5. **TypeScript Support**
   - Excellent TypeScript support
   - Type inference works out of the box
   - No need for separate type definitions

**Use Cases:**
- Authentication state (user info, tokens)
- Favorites (client-side cache with server sync)
- UI state that doesn't need server synchronization

**Alternatives Considered:**
- **Redux Toolkit**: Too much boilerplate for simple client state
- **Context API**: Performance issues with frequent updates, prop drilling
- **Jotai**: Similar to Zustand but less mature ecosystem

**Conclusion**: The combination of TanStack Query for server state and Zustand for client state provides the best balance of simplicity, performance, and developer experience.

---

## Access Control Implementation

### Multi-Layer Security Approach

Access control is enforced at **three levels**:

#### 1. Frontend Protection (User Experience)

**Protected Routes Component** (`components/protected-route.tsx`):
- Checks authentication status before rendering
- Validates user roles against required roles
- Redirects to login if not authenticated
- Shows loading state during auth check

```typescript
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

**Purpose**: Provides immediate feedback and prevents unnecessary API calls.

#### 2. Backend Guards (Security Enforcement)

**JWT Authentication Guard** (`auth/guards/jwt-auth.guard.ts`):
- Validates JWT token on every request
- Extracts user information from token
- Attaches user to request object

**Roles Guard** (`auth/guards/roles.guard.ts`):
- Checks if user has required role(s)
- Applied via `@Roles()` decorator
- Returns 403 Forbidden if role doesn't match

**Owner Guard** (`common/guards/owner.guard.ts`):
- Verifies user owns the resource (e.g., property)
- Admins bypass ownership check
- Used for property update/delete operations

**Implementation:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, OwnerGuard)
@Roles('owner', 'admin')
@Patch(':id')
updateProperty(@Param('id') id: string, @CurrentUser() user: any) {
  // Only owner or admin can update
}
```

#### 3. Service Layer Validation (Business Logic)

**Service-Level Checks**:
- Additional validation in service methods
- Re-checks permissions inside transactions
- Prevents race conditions
- Validates business rules (e.g., only draft properties can be edited)

**Example:**
```typescript
async publish(id: string, user: { userId: string; role: string }) {
  const property = await this.prisma.property.findUnique({ where: { id } });
  
  // Verify ownership
  const isOwner = property.ownerId === user.userId;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('Not authorized');
  }
  
  // Validate business rules
  if (property.status !== 'draft') {
    throw new BadRequestException('Only draft properties can be published');
  }
  
  // Transactional update
  await this.prisma.$transaction(async (tx) => {
    // Atomic status change
  });
}
```

### Security Principles

1. **Never Trust the Client**: Frontend checks are for UX only; backend always validates
2. **Defense in Depth**: Multiple layers of security
3. **Principle of Least Privilege**: Users only get access to what they need
4. **Fail Secure**: Default to denying access if uncertain

---

## Hardest Technical Challenge

### Challenge: Cross-Tab Favorites Synchronization with Optimistic Updates

**Problem Statement:**
When a user adds or removes a favorite in one browser tab, all other open tabs should update immediately without manual refresh, while maintaining consistency with the server and handling edge cases like network failures and race conditions.

**Complexity Factors:**
1. **Optimistic Updates**: UI must update immediately for good UX
2. **Server Sync**: Server is the source of truth
3. **Cross-Tab Communication**: Changes in one tab must propagate to others
4. **Race Conditions**: Multiple tabs updating simultaneously
5. **Error Handling**: Rollback on failure, handle offline scenarios
6. **State Persistence**: Favorites must persist across browser sessions

**Solution Architecture:**

#### 1. Optimistic UI Updates
```typescript
toggleFavorite: async (propertyId: string) => {
  // 1. Update UI immediately (optimistic)
  const newSet = new Set(current);
  newSet.add(propertyId);
  set({ favoriteIds: newSet });
  
  // 2. Broadcast to other tabs
  localStorage.setItem('favorites-updated', Date.now().toString());
  
  // 3. Sync with server (async)
  try {
    await favoritesApi.addFavorite(propertyId);
  } catch (error) {
    // Revert on error
    set({ favoriteIds: current });
  }
}
```

#### 2. Cross-Tab Synchronization
```typescript
// Listen for storage events (other tabs)
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === 'favorites-updated') {
    // Re-fetch from server to get latest state
    syncFavorites();
  }
});
```

#### 3. State Persistence
- Zustand persist middleware stores favorites in localStorage
- Custom storage adapter handles Set serialization
- Automatic rehydration on page load

#### 4. Server Synchronization
- Sync on component mount
- Sync after local changes
- Periodic sync to catch external changes

**Challenges Overcome:**

1. **Set Serialization**: Sets don't serialize to JSON
   - **Solution**: Custom storage adapter converts Set ↔ Array

2. **Race Conditions**: Multiple tabs updating simultaneously
   - **Solution**: Server is source of truth; sync after local changes

3. **Offline Scenarios**: User adds favorite while offline
   - **Solution**: Queue updates, sync when online (future enhancement)

4. **State Consistency**: Ensuring UI matches server state
   - **Solution**: Periodic sync + sync after mutations

5. **Performance**: Avoiding unnecessary re-renders
   - **Solution**: Selective Zustand subscriptions, memoization

**Result**: Seamless cross-tab synchronization with immediate UI feedback and server consistency.

---

## What Would Break First at Scale

### 1. Database Connection Pool (Most Likely)

**Current State:**
- Prisma connection pool: 10 max connections
- No connection pooling strategy for high concurrency
- Single database instance

**Break Point:** ~500-1000 concurrent users making database queries

**Why It Breaks First:**
- Every API request requires a database connection
- Property listings, user queries, favorites all hit the database
- Connection pool exhaustion causes requests to queue or fail
- No connection retry logic

**Symptoms:**
- Slow response times
- "Too many connections" database errors
- Request timeouts
- Application crashes

**Solutions:**
1. **Increase Connection Pool Size**
   ```typescript
   const pool = new Pool({
     max: 50, // Increase from 10
     min: 10,
   });
   ```

2. **Implement Connection Pooling at Application Level**
   - Use PgBouncer for connection pooling
   - Separate read/write connections

3. **Database Read Replicas**
   - Route read queries to replicas
   - Master database handles writes only

4. **Query Optimization**
   - Add database indexes
   - Optimize slow queries
   - Implement query result caching (Redis)

### 2. Image Upload/Storage Bandwidth

**Current State:**
- Cloudinary free tier: 25GB storage, 25GB bandwidth/month
- Direct upload from client to Cloudinary
- No image compression before upload
- No CDN optimization

**Break Point:** ~5,000 properties with 5 images each = 25,000 images

**Why It Breaks:**
- Bandwidth limits exceeded
- Storage costs increase
- Upload failures during high traffic
- Slow image loading

**Solutions:**
1. **Image Compression**
   - Compress images before upload
   - Use WebP format
   - Implement client-side compression

2. **CDN Optimization**
   - Use Cloudinary's CDN features
   - Implement lazy loading
   - Responsive image sizes

3. **Alternative Storage**
   - Migrate to S3 + CloudFront for cost efficiency
   - Implement image optimization pipeline

### 3. Server-Side Rendering (SSR) Performance

**Current State:**
- Property listing page is server-side rendered
- No caching for SSR responses
- Database query on every page load

**Break Point:** ~10,000+ page views per day

**Why It Breaks:**
- Every page load hits database
- No response caching
- Slow page loads under load
- Server CPU/memory exhaustion

**Solutions:**
1. **Incremental Static Regeneration (ISR)**
   ```typescript
   export const revalidate = 60; // Revalidate every 60 seconds
   ```

2. **Redis Caching**
   - Cache API responses
   - Cache rendered pages
   - TTL-based invalidation

3. **Static Generation with Revalidation**
   - Pre-render pages at build time
   - Revalidate on-demand or scheduled

### 4. Authentication Token Management

**Current State:**
- JWT tokens in cookies
- No token blacklisting
- No refresh token rotation
- Token expiration causes re-login

**Break Point:** High concurrent users, frequent token refreshes

**Why It Breaks:**
- No way to invalidate tokens (logout issues)
- Token refresh race conditions
- Security concerns with long-lived tokens

**Solutions:**
1. **Redis Token Blacklist**
   - Store invalidated tokens in Redis
   - Check blacklist on every request

2. **Refresh Token Rotation**
   - Rotate refresh tokens on use
   - Implement token family tracking

3. **Session Management**
   - Consider session-based auth for better control
   - Implement proper logout mechanism

### 5. Real-Time Features (Polling)

**Current State:**
- No real-time updates
- Client polls for messages/favorites
- No WebSocket implementation

**Break Point:** 1,000+ concurrent users polling every few seconds

**Why It Breaks:**
- Excessive API calls
- Server load increases linearly with users
- Bandwidth waste
- Battery drain on mobile devices

**Solutions:**
1. **WebSockets (Socket.io)**
   - Real-time bidirectional communication
   - Push updates to clients
   - Reduce polling overhead

2. **Server-Sent Events (SSE)**
   - One-way server-to-client updates
   - Simpler than WebSockets
   - Good for notifications

3. **Message Queues**
   - RabbitMQ/Kafka for high throughput
   - Decouple real-time updates from API

### Priority Order for Scaling

1. **Database Connection Pool** (Immediate)
   - Easiest to fix
   - Highest impact
   - Prevents application crashes

2. **Query Optimization & Caching** (Short-term)
   - Add Redis caching
   - Optimize database queries
   - Add missing indexes

3. **Image Storage Optimization** (Medium-term)
   - Implement compression
   - Migrate to cost-effective storage
   - CDN optimization

4. **Real-Time Infrastructure** (Long-term)
   - Implement WebSockets
   - Message queue for notifications
   - Reduce polling overhead

---

## Additional Technical Decisions

### Database: PostgreSQL with Prisma

**Why PostgreSQL?**
- ACID compliance for transactional operations
- Excellent JSON support
- Strong typing and constraints
- Mature ecosystem
- Free and open-source

**Why Prisma?**
- Type-safe database access
- Excellent migration system
- Auto-generated TypeScript types
- Great developer experience
- Handles connection pooling

### Image Storage: Cloudinary

**Why Cloudinary?**
- Reliable CDN for image delivery
- Automatic image optimization
- Transformations (resize, crop, format conversion)
- Free tier sufficient for MVP
- Easy integration with NestJS

**Future Consideration**: Migrate to S3 + CloudFront for cost efficiency at scale

### Deployment Strategy

**Frontend**: Vercel/Netlify
- Zero-config deployment
- Automatic HTTPS
- CDN included
- Easy environment variable management

**Backend**: Railway/Render/Fly.io
- PostgreSQL database included
- Easy environment variable setup
- Automatic deployments from GitHub
- Cost-effective for MVP

---

## Conclusion

The technical decisions made prioritize:
1. **Developer Experience**: Tools that reduce boilerplate and improve productivity
2. **Type Safety**: TypeScript throughout for fewer runtime errors
3. **Scalability**: Architecture that can grow with the application
4. **Security**: Multi-layer access control and validation
5. **Performance**: Optimistic updates, caching, and efficient state management

The platform is production-ready and can handle initial scale, with clear paths for scaling each component as needed.

