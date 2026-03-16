# Scan & Log Practice MVP

## Project Overview
Expo (React Native) + Supabase barcode scan-and-log practice app for 3PL logistics.
This is a 1-2 week learning project to build mobile development skills needed for real 3PL client apps.

## Stack
- **Frontend:** Expo (React Native) with Expo Router (file-based routing)
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Language:** TypeScript

## Key Directories
- `app/` — Expo Router pages and layouts
- `components/` — Reusable React Native components
- `supabase/` — Supabase config, migrations, and seeds
- `scripts/` — Utility scripts (seed data, etc.)
- `docs/` — Project plan and design specs

## Database
- Main table: `scan_logs` with RLS policies (users can only access their own data)
- Enum type: `scan_type` ('receive', 'dispatch', 'check')
- See `supabase/migrations/` for schema

## Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (safe for client)
- `SUPABASE_SERVICE_ROLE_KEY` — **server-side only, NEVER use in Expo app code**
- Copy `.env.local.example` to `.env.local` and fill in values

## Commands
- `npm start` — Start Expo dev server
- `npx expo lint` — Run ESLint
- `npx tsc --noEmit` — Type check
- `npx supabase db push` — Push migrations to remote
- `node scripts/seed-scan-logs.mjs` — Seed sample data (requires .env.local)

## Conventions
- Use functional components with hooks
- Use Expo SDK APIs (expo-camera, expo-location, etc.) instead of bare React Native equivalents
- Offline-first: save to local SQLite first, sync to Supabase in background
- Large tap targets (64px min) for warehouse UX
