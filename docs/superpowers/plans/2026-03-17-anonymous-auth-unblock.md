# Anonymous Auth Unblock — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase anonymous auth so scan saving and history work without a login screen — unblocking Phase 2 QA on device.

**Architecture:** Call `supabase.auth.signInAnonymously()` once on app startup in the root layout, gating child route rendering until auth is ready (prevents History tab from mounting before the session exists). Persist the session with `expo-secure-store` so the token survives app restarts. Enable anonymous sign-ins in both the Supabase local config and the remote dashboard.

**Note:** `expo-secure-store` v15 is already installed in `package.json` — no new dependency needed.

**Tech Stack:** @supabase/supabase-js v2, expo-secure-store v15, Expo Router root layout

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `supabase/config.toml:171` | Enable anonymous sign-ins for local dev |
| Modify | `lib/supabase.ts` | Add expo-secure-store auth adapter for session persistence |
| Create | `lib/auth.ts` | `ensureAnonymousSession()` helper — sign in only if no existing session |
| Create | `__tests__/auth.test.ts` | Unit test for `ensureAnonymousSession` logic |
| Modify | `app/_layout.tsx` | Call `ensureAnonymousSession()` on app startup |

---

## Chunk 1: Enable Anonymous Auth + Persistent Session

### Task 1: Enable anonymous sign-ins in Supabase config

**Files:**
- Modify: `supabase/config.toml:171`

- [ ] **Step 1: Set `enable_anonymous_sign_ins = true`**

In `supabase/config.toml`, line 171, change:

```toml
enable_anonymous_sign_ins = true
```

- [ ] **Step 2: Enable anonymous sign-ins in Supabase dashboard (manual)**

Go to your Supabase project → Authentication → Settings → User Signups → toggle "Allow anonymous sign-ins" ON.

**This is a manual step** — config.toml only affects local dev.

- [ ] **Step 3: Commit**

```bash
git add supabase/config.toml
git commit -m "feat: enable anonymous sign-ins in Supabase config"
```

---

### Task 2: Add expo-secure-store auth adapter to Supabase client

**Files:**
- Modify: `lib/supabase.ts`

- [ ] **Step 1: Write the updated Supabase client with SecureStore adapter**

Replace `lib/supabase.ts` with:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const storage =
  Platform.OS === 'web'
    ? undefined
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 2: Verify the app still starts without errors**

Run: `npx expo start` — confirm no import or runtime errors on launch.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add expo-secure-store adapter for Supabase auth persistence"
```

---

### Task 3: Create `ensureAnonymousSession` helper with test

**Files:**
- Create: `lib/auth.ts`
- Create: `__tests__/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/auth.test.ts`:

```typescript
import { ensureAnonymousSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInAnonymously: jest.fn(),
    },
  },
}));

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockSignIn = supabase.auth.signInAnonymously as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ensureAnonymousSession', () => {
  it('does nothing when a session already exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'existing-user' } } },
      error: null,
    });

    await ensureAnonymousSession();

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in anonymously when no session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSignIn.mockResolvedValue({
      data: { session: { user: { id: 'new-anon' } } },
      error: null,
    });

    await ensureAnonymousSession();

    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('throws when getSession fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'storage error' },
    });

    await expect(ensureAnonymousSession()).rejects.toThrow('storage error');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('throws when signInAnonymously fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSignIn.mockResolvedValue({
      data: { session: null },
      error: { message: 'Anonymous sign-ins are disabled' },
    });

    await expect(ensureAnonymousSession()).rejects.toThrow(
      'Anonymous sign-ins are disabled'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/auth.test.ts -v`
Expected: FAIL — `Cannot find module '@/lib/auth'` (4 tests failing)

- [ ] **Step 3: Write the implementation**

Create `lib/auth.ts`:

```typescript
import { supabase } from '@/lib/supabase';

export async function ensureAnonymousSession(): Promise<void> {
  const { data, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw new Error(sessionError.message);
  if (data.session) return;

  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/auth.test.ts -v`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts __tests__/auth.test.ts
git commit -m "feat: add ensureAnonymousSession helper with tests"
```

---

### Task 4: Wire auth into app startup

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add anonymous auth call to RootLayout, gating child rendering**

In `app/_layout.tsx`, add imports at the top:

```typescript
import { useState } from 'react';
import { ensureAnonymousSession } from '@/lib/auth';
```

Add `useState` + `useEffect` inside `RootLayout`, after the existing font-loading effects:

```typescript
const [authReady, setAuthReady] = useState(false);

useEffect(() => {
  ensureAnonymousSession()
    .catch((err) => console.warn('Anonymous auth failed:', err.message))
    .finally(() => setAuthReady(true));
}, []);
```

Update the early-return guard to also wait for auth:

```typescript
if (!loaded || !authReady) {
  return null;
}
```

This prevents the History tab from mounting and calling `getUser()` before the anonymous session exists.

- [ ] **Step 2: Test on device**

Run: `npx expo start` → open in Expo Go → tap Scan → scan a barcode → fill form → tap Save Log.
Expected: "Saved to Supabase." message appears. Switch to History tab — the scan appears in the list.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: all tests pass (smoke test + auth tests).

- [ ] **Step 4: Run lint + typecheck**

Run: `npx expo lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: sign in anonymously on app startup to unblock scan logging"
```
