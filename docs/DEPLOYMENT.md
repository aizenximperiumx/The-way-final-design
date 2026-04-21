# Deployment (Web)

## Recommended stack
- Vercel: hosts the web app and `/api/*` endpoints
- Supabase: Auth + Postgres + Storage
- Resend: transactional email

## Required environment variables
### Client (Vite)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Server (Vercel Functions)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`

## Vercel
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing and security headers are configured in `vercel.json`.

## Supabase
- Apply RLS using `supabase_rls.sql` in the Supabase SQL Editor before going live.

