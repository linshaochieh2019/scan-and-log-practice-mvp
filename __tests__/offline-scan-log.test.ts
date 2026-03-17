import { _resetOfflineStoreForTests, createLocalLog, listLocalLogs, syncPendingLogs } from '@/lib/offline-scan-log';
import { supabase } from '@/lib/supabase';

const mockFetch = jest.fn();
const mockOpenDatabaseAsync = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: (...args: unknown[]) => mockFetch(...args),
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: (...args: unknown[]) => mockOpenDatabaseAsync(...args),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

type Row = {
  local_id: number;
  remote_id: string | null;
  barcode: string;
  scan_type: 'receive' | 'dispatch' | 'check';
  status: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  sync_state: 'pending' | 'synced';
  synced_at: string | null;
};

describe('offline scan log', () => {
  let rows: Row[] = [];
  let idSeq = 1;

  beforeEach(() => {
    _resetOfflineStoreForTests();
    rows = [];
    idSeq = 1;

    mockFetch.mockResolvedValue({ isConnected: true });

    mockOpenDatabaseAsync.mockResolvedValue({
      execAsync: jest.fn(),
      getAllAsync: jest.fn(async (query: string) => {
        if (query.includes("WHERE sync_state = 'pending'")) {
          return rows.filter((row) => row.sync_state === 'pending');
        }
        return [...rows].sort((a, b) => b.local_id - a.local_id);
      }),
      getFirstAsync: jest.fn(async (_query: string, localId: number) => rows.find((row) => row.local_id === localId) ?? null),
      runAsync: jest.fn(async (query: string, ...params: unknown[]) => {
        if (query.startsWith('INSERT INTO local_scan_logs')) {
          const [barcode, scanType, status, notes, latitude, longitude, createdAt] = params;
          const row: Row = {
            local_id: idSeq++,
            remote_id: null,
            barcode: barcode as string,
            scan_type: scanType as Row['scan_type'],
            status: status as string,
            notes: notes as string | null,
            latitude: latitude as number | null,
            longitude: longitude as number | null,
            created_at: createdAt as string,
            sync_state: 'pending',
            synced_at: null,
          };
          rows.push(row);
          return { lastInsertRowId: row.local_id };
        }

        if (query.startsWith('UPDATE local_scan_logs SET sync_state =')) {
          const [, remoteId, localId] = params;
          const target = rows.find((row) => row.local_id === Number(localId));
          if (target) {
            target.sync_state = 'synced';
            target.remote_id = String(remoteId);
            target.synced_at = new Date().toISOString();
          }
          return { changes: 1 };
        }

        return { changes: 0 };
      }),
    });

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'remote-1' }, error: null }),
        }),
      }),
    });
  });

  it('stores locally as pending then marks synced after background sync', async () => {
    await createLocalLog({
      barcode: 'ABC-123',
      scan_type: 'receive',
      status: 'Receive',
      notes: null,
      latitude: null,
      longitude: null,
    });

    let listed = await listLocalLogs();
    expect(listed[0]?.sync_state).toBe('pending');

    const syncResult = await syncPendingLogs();
    expect(syncResult.syncedCount).toBe(1);

    listed = await listLocalLogs();
    expect(listed[0]?.sync_state).toBe('synced');
  });
});
