import NetInfo from '@react-native-community/netinfo';

import { listPendingRows, markRowSynced } from '@/lib/database';
import { supabase } from '@/lib/supabase';

let syncPromise: Promise<{ syncedCount: number; pendingCount: number }> | null = null;

export async function syncPendingLogs() {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = (async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      return { syncedCount: 0, pendingCount: (await listPendingRows()).length };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { syncedCount: 0, pendingCount: (await listPendingRows()).length };
    }

    const pendingRows = await listPendingRows();

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
          created_at: row.created_at,
        })
        .select('id')
        .single();

      if (error) {
        continue;
      }

      await markRowSynced(row.local_id, data.id);
      syncedCount += 1;
    }

    return {
      syncedCount,
      pendingCount: (await listPendingRows()).length,
    };
  })();

  try {
    return await syncPromise;
  } finally {
    syncPromise = null;
  }
}

export function _resetSyncForTests() {
  syncPromise = null;
}
