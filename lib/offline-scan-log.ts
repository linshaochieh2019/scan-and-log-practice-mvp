import NetInfo from '@react-native-community/netinfo';
import * as SQLite from 'expo-sqlite';

import { type ScanLogItem, type ScanType, type SyncState } from '@/lib/scan-log';
import { supabase } from '@/lib/supabase';

type NewLocalLogInput = {
  barcode: string;
  scan_type: ScanType;
  status: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
};

type LocalScanLogRow = {
  local_id: number;
  remote_id: string | null;
  barcode: string;
  scan_type: ScanType;
  status: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  sync_state: SyncState;
  synced_at: string | null;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let syncPromise: Promise<{ syncedCount: number; pendingCount: number }> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('scan_log.db');
  }

  const db = await dbPromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_scan_logs (
      local_id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id TEXT,
      barcode TEXT NOT NULL,
      scan_type TEXT NOT NULL,
      status TEXT,
      notes TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL,
      sync_state TEXT NOT NULL DEFAULT 'pending',
      synced_at TEXT
    );
  `);

  return db;
}

function mapRowToScanLog(row: LocalScanLogRow): ScanLogItem {
  return {
    id: row.remote_id ?? `local-${row.local_id}`,
    barcode: row.barcode,
    scan_type: row.scan_type,
    status: row.status,
    notes: row.notes,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
    sync_state: row.sync_state,
  };
}

async function getPendingRows() {
  const db = await getDb();
  return db.getAllAsync<LocalScanLogRow>(
    `SELECT * FROM local_scan_logs WHERE sync_state = 'pending' ORDER BY created_at ASC, local_id ASC;`
  );
}

export async function listLocalLogs() {
  const db = await getDb();
  const rows = await db.getAllAsync<LocalScanLogRow>(`SELECT * FROM local_scan_logs ORDER BY created_at DESC, local_id DESC;`);
  return rows.map(mapRowToScanLog);
}

export async function createLocalLog(input: NewLocalLogInput) {
  const db = await getDb();
  const createdAt = new Date().toISOString();

  const result = await db.runAsync(
    `INSERT INTO local_scan_logs (barcode, scan_type, status, notes, latitude, longitude, created_at, sync_state)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending');`,
    input.barcode,
    input.scan_type,
    input.status,
    input.notes,
    input.latitude,
    input.longitude,
    createdAt
  );

  const inserted = await db.getFirstAsync<LocalScanLogRow>(`SELECT * FROM local_scan_logs WHERE local_id = ?;`, result.lastInsertRowId);

  if (!inserted) {
    throw new Error('Failed to read saved local scan log.');
  }

  return mapRowToScanLog(inserted);
}

export async function syncPendingLogs() {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = (async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      return { syncedCount: 0, pendingCount: (await getPendingRows()).length };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { syncedCount: 0, pendingCount: (await getPendingRows()).length };
    }

    const db = await getDb();
    const pendingRows = await getPendingRows();

    let syncedCount = 0;

    for (const row of pendingRows) {
      const { data, error } = await supabase
        .from('scan_logs')
        .insert({
          user_id: user.id,
          barcode: row.barcode,
          scan_type: row.scan_type,
          status: row.status,
          notes: row.notes,
          latitude: row.latitude,
          longitude: row.longitude,
        })
        .select('id')
        .single();

      if (error) {
        continue;
      }

      await db.runAsync(
        `UPDATE local_scan_logs SET sync_state = 'synced', synced_at = ?, remote_id = ? WHERE local_id = ?;`,
        new Date().toISOString(),
        data.id,
        row.local_id
      );

      syncedCount += 1;
    }

    return {
      syncedCount,
      pendingCount: (await getPendingRows()).length,
    };
  })();

  try {
    return await syncPromise;
  } finally {
    syncPromise = null;
  }
}

export function subscribeConnectivitySync(onSynced?: () => void) {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void syncPendingLogs().then(({ syncedCount }) => {
        if (syncedCount > 0) {
          onSynced?.();
        }
      });
    }
  });
}
