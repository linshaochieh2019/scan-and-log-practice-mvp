# Scan & Log — Practice MVP

**Goal:** Learn mobile development fundamentals needed for 3PL apps by building a barcode scan-and-log tool.
**Time:** 1-2 weeks
**Stack:** Expo (React Native) + Supabase

---

## Phase 1: Hello Scanner (Day 1-2)

**Goal:** Get a working barcode scanner on your phone.

- [ ] Set up Expo project (`npx create-expo-app scan-and-log`)
- [ ] Install Expo Go on your phone for live preview
- [ ] Add `expo-camera` and `expo-barcode-scanner` (or `expo-camera` with barcode scanning built-in)
- [ ] Build a single screen: tap to scan → display scanned barcode value
- [ ] Test with real barcodes (any product packaging works)

**Learn:** Expo dev workflow, camera permissions, device testing via Expo Go.

## Phase 2: Scan + Log (Day 3-4)

**Goal:** Each scan creates a log entry with metadata.

- [ ] Set up Supabase project with a `scan_logs` table:
  ```sql
  create table scan_logs (
    id uuid primary key default gen_random_uuid(),
    barcode text not null,
    scan_type text, -- e.g. 'receive', 'dispatch', 'check'
    status text default 'scanned',
    latitude float,
    longitude float,
    notes text,
    scanned_at timestamptz default now(),
    synced boolean default false
  );
  ```
- [ ] Add `expo-location` for GPS capture on each scan
- [ ] After scanning, show a quick form: select status (Receive / Dispatch / Check) + optional notes
- [ ] Save to Supabase
- [ ] Build a history screen: list of recent scans, sorted by time

**Learn:** Supabase + Expo integration, GPS permissions, basic form UI on mobile.

## Phase 3: Offline-First (Day 5-7)

**Goal:** App works without internet and syncs when back online.

- [ ] Add local storage using `expo-sqlite` or `@react-native-async-storage/async-storage`
- [ ] Change flow: scan → save locally first → sync to Supabase in background
- [ ] Add sync indicator (green dot = synced, yellow = pending)
- [ ] Add `NetInfo` listener to auto-sync when connectivity returns
- [ ] Test: turn on airplane mode → scan several items → turn off → verify sync

**Learn:** Offline-first architecture, local DB, background sync — the #1 technical challenge for warehouse apps.

## Phase 4: Warehouse UX Polish (Day 8-10)

**Goal:** Make it feel like a real warehouse tool.

- [ ] Large tap targets (minimum 48px, ideally 64px) — workers wear gloves
- [ ] Vibration + sound feedback on successful scan (`expo-haptics`)
- [ ] Auto-focus back to scanner after logging (no extra taps for rapid scanning)
- [ ] Batch mode: continuous scanning without dismissing camera
- [ ] Dark mode (warehouse lighting varies)
- [ ] Pull-to-refresh on history
- [ ] Add a simple stats bar: "Today: 47 scans | 3 pending sync"

**Learn:** Mobile UX for field workers — this is what separates a toy from a tool.

## Phase 5: Photo Capture (Day 11-12)

**Goal:** Attach a photo to a scan (needed for POD, damage documentation).

- [ ] Add photo capture option after scan (using `expo-image-picker` or `expo-camera`)
- [ ] Compress image before upload (warehouse workers will take hundreds)
- [ ] Upload to Supabase Storage, link URL to scan_log record
- [ ] Show thumbnail in history list
- [ ] Handle offline: queue photos for upload, show placeholder

**Learn:** Image handling on mobile — capture, compress, upload, offline queue.

## Stretch: Build for PDA (Day 13-14)

**Goal:** Verify the app works on actual PDA hardware.

- [ ] Build an APK using `eas build --platform android`
- [ ] If you can get a Zebra/Honeywell PDA: sideload and test
- [ ] If not: test on a cheap Android phone as a proxy
- [ ] Test hardware barcode scanner integration (PDA scanners inject as keyboard input — may need different handling than camera scan)
- [ ] Document differences between phone camera scan vs PDA hardware scan

**Learn:** Android build process, PDA-specific quirks, hardware scanner behavior.

---

## Key Libraries Reference

| Need | Library |
|------|---------|
| Barcode scanning | `expo-camera` (built-in barcode support) |
| GPS | `expo-location` |
| Local DB | `expo-sqlite` |
| Network detection | `@react-native-community/netinfo` |
| Haptic feedback | `expo-haptics` |
| Image capture | `expo-image-picker` |
| Image compression | `expo-image-manipulator` |
| Navigation | `expo-router` (file-based routing, similar to Next.js) |

## What This Prepares You For

| Practice MVP skill | Watson's/Hongli need | Lianqun need |
|---|---|---|
| Barcode scanning | Waybill scan at DC intake, linehaul load/receive, delivery POD | Box receive scan, pallet scan, location scan |
| GPS capture | Delivery location proof | Driver pickup location |
| Offline + sync | Warehouse WiFi is unreliable, drivers are on the road | Same |
| Photo capture | POD photos, exception documentation | Damage documentation, inspection photos |
| Status selection | SCANNED_AT_DC → LOADED → RECEIVED → DELIVERED | CREATED → COLLECTED → RECEIVED → PALLETIZED |
| Batch scanning | High-volume DC intake (hundreds of items/hour) | Warehouse receiving |
