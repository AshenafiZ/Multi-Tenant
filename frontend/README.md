# PropertyHub Frontend

A modern Next.js frontend for the Multi-Tenant Property Listing Platform.

## Features

- ✅ Authentication (Login/Register) with JWT
- ✅ Public property listing page (Server-Side Rendered)
- ✅ Property detail page
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

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) (or next available port)

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Role-based dashboards
│   ├── login/             # Authentication pages
│   ├── register/
│   ├── properties/        # Property detail pages
│   └── page.tsx           # Home page (SSR property listing)
├── components/             # React components
│   ├── protected-route.tsx
│   ├── property-card.tsx
│   └── ...
├── lib/                    # Utilities and API clients
│   ├── api/               # API functions
│   ├── auth-store.ts      # Zustand auth store
│   ├── favorites-store.ts  # Zustand favorites store
│   └── types.ts           # TypeScript types
└── providers/             # React context providers
```

## Key Features Implementation

### Authentication
- JWT tokens stored in HTTP-only cookies
- Zustand store for user state persistence
- Automatic token refresh handling
- Protected routes with role-based access

### Favorites
- Optimistic UI updates
- Cross-tab synchronization using localStorage events
- Zustand persist middleware for state persistence

### Property Management
- Server-side rendered listing page for SEO
- Client-side dashboards for interactivity
- Image upload with Cloudinary integration
- Draft → Published workflow

### State Management Decision

**TanStack Query (React Query)** was chosen for:
- Automatic caching and background refetching
- Built-in loading and error states
- Optimistic updates support
- Server state synchronization

**Zustand** was chosen for:
- Simple client state management (auth, favorites)
- Lightweight compared to Redux
- Built-in persistence middleware
- Easy cross-tab synchronization

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy


## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (required)

## API Integration

The frontend communicates with the NestJS backend through:
- Base URL: `NEXT_PUBLIC_API_URL` or `http://localhost:3000`
- Authentication: JWT Bearer tokens
- All API functions are in `lib/api/`

## Notes

- The home page is server-side rendered for better SEO
- Dashboards are client-side rendered for interactivity
- Images are handled via Cloudinary (configured in backend)
- Favorites sync across browser tabs automatically
