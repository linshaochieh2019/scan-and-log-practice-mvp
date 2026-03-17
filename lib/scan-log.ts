export const SCAN_TYPES = ['receive', 'dispatch', 'check'] as const;
export type ScanType = (typeof SCAN_TYPES)[number];

export type SyncState = 'pending' | 'synced';

export type ScanLogItem = {
  id: string;
  barcode: string;
  scan_type: ScanType;
  status: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  sync_state: SyncState;
};
