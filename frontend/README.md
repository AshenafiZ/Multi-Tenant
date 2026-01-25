# PropertyHub Frontend

A modern Next.js frontend for the Multi-Tenant Property Listing Platform.

## Features

- ✅ Authentication (Login/Register) with JWT
- ✅ Public property listing page (Server-Side Rendered)
- ✅ Property detail page with image gallery
- ✅ User Dashboard (favorites, messages)
- ✅ Owner Dashboard (create, edit, publish properties)
- ✅ Admin Dashboard (view all properties, metrics, disable properties)
- ✅ Protected routes with role-based access control
- ✅ Favorites with cross-tab synchronization
- ✅ Optimistic UI updates
- ✅ Image upload functionality
- ✅ Messaging system
- ✅ Responsive design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **State Management**: 
  - TanStack Query (React Query) for server state
  - Zustand for client state (auth, favorites)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **UI**: Tailwind CSS + Lucide Icons
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)
- Backend API URL

## Installation

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env.local` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Run development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Frontend: [http://localhost:3001](http://localhost:3001) (or next available port)
   - Backend should be running on: [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Role-based dashboards
│   │   ├── admin/         # Admin dashboard
│   │   ├── owner/         # Owner dashboard
│   │   └── user/          # User dashboard
│   ├── login/             # Authentication pages
│   ├── register/
│   ├── properties/        # Property detail pages
│   │   └── [id]/         # Dynamic property detail route
│   ├── messages/          # Messages page
│   ├── page.tsx           # Home page (SSR property listing)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── protected-route.tsx      # Route protection component
│   ├── property-card.tsx         # Property card component
│   ├── property-image-gallery.tsx # Image gallery with navigation
│   ├── property-actions.tsx       # Property management actions
│   ├── confirmation-modal.tsx    # Confirmation dialogs
│   ├── create-property-modal.tsx  # Create property form
│   ├── edit-property-modal.tsx    # Edit property form
│   ├── navbar.tsx                # Navigation bar
│   └── ...
├── lib/                    # Utilities and API clients
│   ├── api/               # API functions
│   │   ├── auth.ts        # Authentication API
│   │   ├── properties.ts  # Properties API (client-side)
│   │   ├── properties-server.ts # Properties API (server-side)
│   │   ├── favorites.ts   # Favorites API
│   │   ├── messages.ts    # Messages API
│   │   └── users.ts       # Users API
│   ├── api-client.ts      # Axios client (client-side)
│   ├── api-server.ts      # Axios client (server-side)
│   ├── auth-store.ts      # Zustand auth store
│   ├── favorites-store.ts # Zustand favorites store
│   └── types.ts           # TypeScript types
└── providers/             # React context providers
    └── query-provider.tsx # TanStack Query provider
```

## Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Production:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Features Implementation

### Authentication
- JWT tokens stored in cookies (via js-cookie)
- Zustand store for user state persistence
- Automatic token injection via Axios interceptors
- Protected routes with role-based access
- Automatic redirect to login on 401 errors

### Favorites
- Optimistic UI updates (immediate feedback)
- Cross-tab synchronization using localStorage events
- Zustand persist middleware for state persistence
- Server sync on mount and after changes

### Property Management
- Server-side rendered listing page for SEO
- Client-side dashboards for interactivity
- Image upload with Cloudinary integration
- Draft → Published workflow
- Image gallery with next/previous navigation

### State Management

**TanStack Query (React Query)** for server state:
- Automatic caching and background refetching
- Built-in loading and error states
- Optimistic updates support
- Server state synchronization

**Zustand** for client state:
- Simple client state management (auth, favorites)
- Lightweight (~1KB gzipped)
- Built-in persistence middleware
- Easy cross-tab synchronization

## API Integration

The frontend communicates with the NestJS backend through:
- **Base URL**: `NEXT_PUBLIC_API_URL` or `http://localhost:3000`
- **Authentication**: JWT Bearer tokens (automatically added via interceptors)
- **All API functions**: Located in `lib/api/`

### API Client Structure

- **Client-side**: `lib/api-client.ts` - Includes auth interceptors, error handling
- **Server-side**: `lib/api-server.ts` - Simple Axios instance for SSR

## Development

### Running in Development Mode

1. Ensure backend is running on `http://localhost:3000`
2. Start frontend:
```bash
npm run dev
```
3. Open [http://localhost:3001](http://localhost:3001)

### Common Issues

**CORS Errors:**
- Ensure backend CORS is configured to allow your frontend URL
- Check `NEXT_PUBLIC_API_URL` matches backend URL

**Authentication Issues:**
- Clear browser cookies and localStorage
- Check backend JWT_SECRET is set
- Verify token expiration settings

**Build Errors:**
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

### Netlify

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

### Environment Variables for Production

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

## Notes

- The home page (`app/page.tsx`) is server-side rendered for better SEO
- Dashboards are client-side rendered for interactivity
- Images are handled via Cloudinary (configured in backend)
- Favorites sync across browser tabs automatically
- All API calls include proper error handling and loading states

## Troubleshooting

### Property cards not showing favorite state
- Clear browser cache and localStorage
- Check if user is authenticated
- Verify favorites API is working in backend

### Images not loading
- Check Cloudinary configuration in backend
- Verify image URLs are accessible
- Check CORS settings

### Authentication not persisting
- Check cookie settings
- Verify JWT token expiration
- Check browser console for errors
