# Smart Bookmark App

A real-time bookmark management application built as a take-home assignment, featuring secure per-user data isolation and live synchronization across multiple browser sessions.

## Project Overview

Smart Bookmark App is a production-ready web application that allows authenticated users to manage their personal bookmarks with automatic real-time synchronization. The application implements strict database-level security through Row Level Security (RLS) policies, ensuring complete data isolation between users. All bookmark operations (create, read, update, delete) are synchronized in real-time across multiple browser tabs without requiring manual page refreshes.

Key features:
- Google OAuth authentication (no email/password authentication)
- Private bookmark management per user
- Real-time updates using WebSocket connections
- Database-level security with Supabase RLS
- Responsive UI built with Tailwind CSS
- Server-side rendering with Next.js App Router

## Tech Stack & Rationale

### Next.js 15 (App Router)
The App Router was chosen over the Pages Router for several technical advantages:
- **Server Components by default**: Reduced client-side JavaScript bundle size
- **Built-in layouts**: Simplified authentication wrapper implementation
- **Streaming and Suspense**: Better loading states and progressive rendering
- **Route handlers**: Clean API endpoint implementation for OAuth callbacks
- **Middleware support**: Centralized session refresh logic

### Supabase
Supabase provides an integrated backend solution that eliminates the need for separate services:
- **Authentication**: Production-ready OAuth implementation with session management
- **PostgreSQL**: Reliable relational database with advanced querying
- **Row Level Security**: Database-level authorization that cannot be bypassed client-side
- **Realtime**: WebSocket-based database change notifications without managing infrastructure
- **Type-safe client**: Auto-generated TypeScript types from database schema

### Tailwind CSS
Tailwind was selected for rapid UI development while maintaining design consistency:
- **Utility-first approach**: Faster iteration without context switching to CSS files
- **Design tokens**: Built-in spacing, color, and typography scales
- **Responsive design**: Mobile-first breakpoints with minimal code
- **Production optimization**: Automatic unused CSS purging

### Vercel
Chosen as the deployment platform for seamless Next.js integration:
- **Zero-configuration deployments**: Automatic build detection and optimization
- **Edge network**: Global CDN with automatic SSL
- **Preview deployments**: Per-branch deployment URLs for testing
- **Environment variables**: Secure management of API keys

## Application Architecture

### Authentication Flow
1. User clicks "Continue with Google" button
2. Client initiates OAuth flow via `supabase.auth.signInWithOAuth()`
3. User redirects to Google's OAuth consent screen
4. Google redirects back to `/auth/callback` with authorization code
5. Callback route exchanges code for Supabase session
6. Session stored in HTTP-only cookies via middleware
7. User redirects to protected `/dashboard` route

### Protected Routes
Authentication is enforced at the layout level:
```
app/
├── page.tsx                  # Public (redirects if authenticated)
├── auth/callback/route.ts    # OAuth callback handler
└── dashboard/
    ├── layout.tsx            # Server Component with auth check
    └── page.tsx              # Protected dashboard content
```

The dashboard layout performs server-side authentication:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/')
```

### Client-Side Supabase Usage
The application uses `@supabase/ssr` for proper cookie handling:
- **Browser client**: Used in Client Components for mutations and subscriptions
- **Server client**: Used in Server Components and Server Actions for data fetching
- **Middleware client**: Refreshes auth tokens on every request

### Database Structure
Single table design with user-scoped data:
```
bookmarks
├── id (uuid, primary key, auto-generated)
├── user_id (uuid, foreign key → auth.users.id)
├── title (text, required)
├── url (text, required)
└── created_at (timestamptz, auto-generated)
```

The `user_id` column is critical for RLS policy enforcement and data isolation.

## Database Schema

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
```

### Why user_id is Required
The `user_id` column serves multiple purposes:
1. **Data ownership**: Links each bookmark to its creator
2. **RLS filtering**: Enables automatic row-level filtering in policies
3. **Query optimization**: Indexed for fast user-specific lookups
4. **Cascade deletion**: Automatically removes user data on account deletion
5. **Realtime filtering**: Allows WebSocket subscriptions to filter by user

## Row Level Security (RLS) Strategy

RLS is enabled on the `bookmarks` table to enforce database-level authorization:

```sql
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
```

### Implemented Policies

**SELECT Policy**: Users can only view their own bookmarks
```sql
CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);
```

**INSERT Policy**: Users can only insert bookmarks with their own user_id
```sql
CREATE POLICY "Users can insert own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**UPDATE Policy**: Users can only update their own bookmarks
```sql
CREATE POLICY "Users can update own bookmarks"
ON bookmarks FOR UPDATE
USING (auth.uid() = user_id);
```

**DELETE Policy**: Users can only delete their own bookmarks
```sql
CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);
```

### Security Guarantees
RLS policies are enforced at the database layer, meaning:
- Client-side code cannot bypass these restrictions
- Malicious requests with manipulated user_id values are automatically rejected
- Even if an attacker gains API access, they cannot read other users' data
- The database itself validates every query against the authenticated user's JWT

This provides defense-in-depth security beyond application-layer authorization.

## Realtime Implementation

Real-time synchronization is implemented using Supabase's PostgreSQL replication-based Realtime feature.

### Subscription Setup
```typescript
const channel = supabase
  .channel('bookmarks-realtime')
  .on(
    'postgres_changes',
    {
      event: '*',                    // Listen to all events
      schema: 'public',
      table: 'bookmarks',
      filter: `user_id=eq.${user.id}` // Critical: filter by current user
    },
    handleRealtimeEvent
  )
  .subscribe()
```

### Event Handling
The application handles three event types:

**INSERT**: New bookmarks added in other tabs
```typescript
if (payload.eventType === 'INSERT') {
  setBookmarks(prev => [payload.new, ...prev])
}
```

**UPDATE**: Bookmark edits from other sessions
```typescript
if (payload.eventType === 'UPDATE') {
  setBookmarks(prev => 
    prev.map(b => b.id === payload.new.id ? payload.new : b)
  )
}
```

**DELETE**: Bookmark removals from other tabs
```typescript
if (payload.eventType === 'DELETE') {
  setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
}
```

### Cleanup
The subscription is properly cleaned up to prevent memory leaks:
```typescript
useEffect(() => {
  // ... setup subscription
  
  return () => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}, [])
```

### Why Polling Was Not Used
Polling was deliberately avoided because:
- Unnecessary server load from repeated queries
- Higher latency (polling interval creates delay)
- Increased database costs at scale
- Poor user experience compared to instant WebSocket updates

The Realtime implementation provides sub-second update propagation with minimal infrastructure overhead.

## Deployment

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### Google OAuth Configuration
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
3. Configure OAuth consent screen with required scopes
4. Add Client ID and Secret to Supabase Dashboard under Authentication > Providers > Google

### Vercel Deployment Steps
1. Push code to GitHub repository
2. Import project in Vercel dashboard
3. Configure environment variables in project settings
4. Deploy automatically on git push
5. Verify OAuth callback URL matches production domain

### Post-Deployment Verification
- Test Google OAuth login flow
- Verify RLS policies block unauthorized access
- Confirm Realtime updates work across multiple sessions
- Check that middleware refreshes sessions correctly

## Problems Faced & Solutions

### Problem 1: RLS Blocking Initial Inserts
**Issue**: After enabling RLS, all INSERT operations failed with "new row violates row-level security policy" error, even when providing the correct user_id.

**Root Cause**: The INSERT policy was using `USING` clause instead of `WITH CHECK`. The `USING` clause evaluates against existing rows (which don't exist for inserts), while `WITH CHECK` validates the new row being inserted.

**Solution**: Changed the INSERT policy from:
```sql
CREATE POLICY "..." ON bookmarks FOR INSERT USING (auth.uid() = user_id);
```
to:
```sql
CREATE POLICY "..." ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Problem 2: Realtime Not Triggering
**Issue**: Realtime subscriptions were established successfully (status: SUBSCRIBED), but no events were received when performing database operations in other tabs.

**Root Cause**: The filter syntax `user_id=${user.id}` was incorrect. PostgreSQL filters require the `eq.` operator prefix for equality checks.

**Solution**: Updated the filter from:
```typescript
filter: `user_id=${user.id}`
```
to:
```typescript
filter: `user_id=eq.${user.id}`
```

### Problem 3: Session Handling in App Router
**Issue**: User authentication state was inconsistent between page navigations. Server Components showed authenticated state while Client Components showed unauthenticated, causing hydration mismatches.

**Root Cause**: The App Router requires explicit session refresh via middleware. Without it, server-side auth checks used stale tokens while client-side checks used current session.

**Solution**: Implemented middleware to refresh session on every request:
```typescript
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

### Problem 4: OAuth Redirect Mismatch in Production
**Issue**: Google OAuth worked locally but failed in production with "redirect_uri_mismatch" error after deployment to Vercel.

**Root Cause**: The OAuth callback URL was hardcoded to `http://localhost:3000/auth/callback` in the Supabase configuration, which didn't match the production URL.

**Solution**: Updated the redirect URL to use dynamic origin:
```typescript
redirectTo: `${window.location.origin}/auth/callback`
```
And added both localhost and production URLs to Google OAuth allowed redirect URIs.

### Problem 5: OAuth Worked Locally but Failed After Deployment
**Issue**: Google OAuth authentication worked correctly during local development, but after deploying to Vercel, login failed once the localhost server was turned off. Users were redirected incorrectly and the session was not established.

**Root Cause**: The Supabase and Google OAuth redirect URLs were configured only for `http://localhost:3000`. After deployment, the application was hosted on a Vercel domain, but this production callback URL was not added to Supabase Authentication settings.

**Solution**: Updated Supabase Authentication URL configuration to include both development and production callback URLs:
- `http://localhost:3000/auth/callback`
- `https://smart-bookmark-app-beta.vercel.app/auth/callback`

This ensured the OAuth flow correctly redirected back to the deployed application and worked in both local and production environments.

## Future Improvements

### Search Functionality
Implement full-text search across bookmark titles and URLs using PostgreSQL's `tsvector` and `tsquery` features. This would allow users to quickly find bookmarks in large collections without manual scrolling.

### Bookmark Categorization
Add a tagging or folder system to organize bookmarks by topic or project. This would require a many-to-many relationship with a separate `tags` table and junction table for flexibility.

### Improved Caching Strategy
Implement React Query or SWR for client-side caching to reduce redundant database queries. This would improve perceived performance, especially on slower connections.

### Pagination
Add cursor-based pagination for users with large bookmark collections (100+). Current implementation loads all bookmarks, which could cause performance issues at scale.

### Bookmark Metadata Enrichment
Automatically fetch and display favicon, page title, and description when a URL is added. This would improve visual recognition and provide context without opening each bookmark.

### Export Functionality
Allow users to export their bookmarks in standard formats (HTML, JSON, CSV) for backup or migration to other services. This improves data portability and user trust.

---


