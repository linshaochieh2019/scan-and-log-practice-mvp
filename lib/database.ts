import * as SQLite from 'expo-sqlite';

import { type LocalScanLog, type ScanLogItem, type ScanType } from '@/lib/scan-log';

type NewLocalLogInput = {
  barcode: string;
  scan_type: ScanType;
  status: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('scan_log.db');
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
    })();
  }

  return dbPromise;
}

function mapRowToScanLog(row: LocalScanLog): ScanLogItem {
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

export async function listLocalLogs() {
  const db = await initDatabase();
  const rows = await db.getAllAsync<LocalScanLog>(`SELECT * FROM local_scan_logs ORDER BY created_at DESC, local_id DESC;`);
  return rows.map(mapRowToScanLog);
}

export async function createLocalLog(input: NewLocalLogInput) {
  const db = await initDatabase();
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

  const inserted = await db.getFirstAsync<LocalScanLog>(`SELECT * FROM local_scan_logs WHERE local_id = ?;`, result.lastInsertRowId);

  if (!inserted) {
    throw new Error('Failed to read saved local scan log.');
  }

  return mapRowToScanLog(inserted);
}

export async function listPendingRows() {
  const db = await initDatabase();
  return db.getAllAsync<LocalScanLog>(
    `SELECT * FROM local_scan_logs WHERE sync_state = 'pending' ORDER BY created_at ASC, local_id ASC;`
  );
}

export async function countPendingRows() {
  const db = await initDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM local_scan_logs WHERE sync_state = 'pending';`
  );
  return result?.count ?? 0;
}

export async function markRowSynced(localId: number, remoteId: string) {
  const db = await initDatabase();
  await db.runAsync(
    `UPDATE local_scan_logs SET sync_state = 'synced', synced_at = ?, remote_id = ? WHERE local_id = ?;`,
    new Date().toISOString(),
    remoteId,
    localId
  );
}

export function _resetDatabaseForTests() {
  dbPromise = null;
}
