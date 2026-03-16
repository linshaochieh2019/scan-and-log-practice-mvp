# Scan & Log Practice MVP — Infrastructure Scaffolding Design

**Date:** 2026-03-15
**Project:** scan-and-log-practice-mvp
**Status:** Approved

## Overview

Infrastructure scaffolding for a standalone Expo (React Native) + Supabase barcode scan-and-log practice MVP. This is a 1-2 week learning project to build mobile development skills needed for real 3PL logistics customer projects (Watson's/Hongli and Lianqun Logistics).

## Components

### 1. GitHub Repository

- **Name:** `scan-and-log-practice-mvp`
- **Visibility:** standalone repo (not monorepo under 3pl-ai-os)
- **Branch protection:** none
- **Contents scaffolded:**
  - `CLAUDE.md` with project-specific instructions
  - `.gitignore` (Expo/React Native template)
  - `.env.local.example` with Supabase + Expo environment variables
  - `docs/PLAN.md` (existing plan moved in)

### 2. GitHub Actions (CI/CD)

Three workflows (`claude-code-review.yml` and `pr-review-notifier.yml` mirror taiwan-teacher-talent; `ci.yml` is new for this project):

1. **`claude-code-review.yml`** (mirrored from taiwan-teacher-talent)
   - Triggers on PR open/sync/ready_for_review/reopened
   - Uses `anthropics/claude-code-action@v1`
   - Skips draft PRs
   - Requires secret: `ANTHROPIC_API_KEY`

2. **`ci.yml`** (new — replaces e2e-tests.yml since this is a mobile app)
   - Triggers on PR open/sync/reopened
   - Runs ESLint (with Expo plugin) + TypeScript type-check (`npx tsc --noEmit`)
   - Node 20, npm cache
   - Extensible for Jest/Vitest unit tests later

3. **`pr-review-notifier.yml`** (mirrored from taiwan-teacher-talent)
   - Triggers after `claude-code-review` completes (or manual dispatch)
   - Sends Discord webhook notification with PR status
   - Determines merge-ready (✅) vs action-needed (⚠️)
   - Requires secret: `DISCORD_WEBHOOK_URL`

### 3. Discord

- **Channel:** `#scan-and-log-mvp` in existing Discord server
- **Webhook:** new webhook for the channel, stored as GitHub repo secret
- **Notification format:** same as taiwan-teacher-talent (PR #, status, links)
- **Manual setup required:** create channel + webhook in Discord UI

### 4. Notion

- **Parent page:** "3PL AI OS" under "Research and Side Projects" database
- **Sub-page:** "Scan & Log Practice MVP" with sub-pages:
  - Planning
  - Progress / Log
  - Notes
- Links back to GitHub repo and Discord channel

### 5. Supabase

- **Local dev config:** `supabase/config.toml` (same structure as taiwan-teacher-talent but with project-specific name and non-conflicting ports)
- **Initial migration:** `supabase/migrations/<timestamp>_create_scan_logs.sql` (timestamp-based naming per Supabase CLI convention)
  - Table: `scan_logs`
  - Columns: id, user_id, barcode, scan_type (enum: receive/dispatch/check), status, latitude, longitude, notes, photo_url, synced (boolean), created_at, updated_at
  - RLS policies for authenticated users
- **`.env.local.example`:**
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` — **for server-side scripts and seed scripts only; never reference in Expo app code**
- **Seed script template:** `scripts/seed-scan-logs.mjs`
- **Manual setup required:** create Supabase project in dashboard

### 6. Expo Project Scaffold

- **Created via:** `npx create-expo-app` with Expo Router template
- **TypeScript:** enabled, with `tsconfig.json`
- **Linting:** ESLint with Expo plugin
- **Base dependencies:**
  - `expo-camera` (barcode scanning)
  - `expo-location` (GPS)
  - `expo-sqlite` (offline storage)
  - `expo-haptics` (vibration feedback)
  - `expo-image-picker` (photo capture)
  - `expo-image-manipulator` (image compression)
  - `expo-secure-store` (secure auth token storage)
  - `@react-native-community/netinfo` (connectivity detection)
  - `@supabase/supabase-js` (backend)
- **`eas.json`:** development/preview/production build profiles (EAS project created via `eas init`)
- **`app.json` / `app.config.js`:** app name, camera + location permissions
- **.gitignore:** Expo/React Native template + explicit `.env.local` entry
- **Offline sync:** `expo-sqlite` + `synced` flag scaffolded; sync service and conflict resolution deferred to implementation (Phase 3 of PLAN.md)

## Secrets to Configure Manually

| Secret | Where | Purpose |
|--------|-------|---------|
| `ANTHROPIC_API_KEY` | GitHub repo secret | Claude code review |
| `DISCORD_WEBHOOK_URL` | GitHub repo secret | PR notifications |

## Manual Steps (instructions provided)

1. Create `#scan-and-log-mvp` Discord channel + webhook
2. Create Supabase project in dashboard
3. Add secrets to GitHub repo settings

## Decisions Made

- **Standalone repo** over monorepo — simpler, mirrors taiwan-teacher-talent pattern
- **GitHub Actions + EAS Build** — fast PR checks in CI, real APK builds via EAS when ready
- **Same Discord server** — new channel with dedicated webhook, avoids notification mixing
- **Notion parent page "3PL AI OS"** — future-proofs for Watson's/Lianqun sub-projects
- **No branch protection** — lightweight for a learning project
