# Public client configuration baked into production builds.
# These are PUBLIC values (they ship in every browser bundle) — safe to commit.
# On Render, real environment variables take precedence over this file, so the
# website deploy is unaffected. This file exists so LOCAL production builds
# (`npm run build:app` — this mode file outranks .env.local) can sign in.
VITE_SUPABASE_URL=https://wsqgxmckonsfvvfhmbbq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_cMuLJgjoWO78Ro2AlvvMPA_aVjaUQc1
