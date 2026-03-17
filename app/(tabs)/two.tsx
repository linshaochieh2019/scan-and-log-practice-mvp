import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import { Text, View } from '@/components/Themed';
import { listLocalLogs } from '@/lib/database';
import { useIsConnected, subscribeSyncCompleted } from '@/lib/network';
import { type ScanLogItem } from '@/lib/scan-log';
import { syncPendingLogs } from '@/lib/sync';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConnected = useIsConnected();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listLocalLogs();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void syncPendingLogs().then(loadLogs);
  }, [loadLogs]);

  useEffect(() => {
    const unsubscribe = subscribeSyncCompleted(() => {
      void loadLogs();
    });

    return unsubscribe;
  }, [loadLogs]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todayCount = logs.filter((log) => log.created_at.slice(0, 10) === todayDate).length;
    const pendingCount = logs.filter((log) => log.sync_state === 'pending').length;

    return { todayCount, pendingCount };
  }, [logs]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Pressable
          style={styles.refreshButton}
          onPress={() => {
            void syncPendingLogs().then(loadLogs);
          }}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statText}>Today: {stats.todayCount}</Text>
        <Text style={styles.statText}>Pending: {stats.pendingCount}</Text>
        <Text style={[styles.statText, !isConnected && styles.offlineText]}>{isConnected ? 'Online' : 'Offline (sync paused)'}</Text>
      </View>

      {loading ? <Text>Loading scan history...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error ? (
        <ScrollView contentContainerStyle={styles.list}>
          {logs.length === 0 ? <Text>No scan logs yet.</Text> : null}

          {logs.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.barcode}>{log.barcode}</Text>
                <SyncStatusBadge syncState={log.sync_state} />
              </View>
              <Text>Type: {log.scan_type}</Text>
              <Text>Status: {log.status ?? '-'}</Text>
              <Text>Notes: {log.notes ?? '-'}</Text>
              <Text>
                GPS: {log.latitude ?? '-'}, {log.longitude ?? '-'}
              </Text>
              <Text style={styles.time}>{new Date(log.created_at).toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  refreshButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 64,
    justifyContent: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statText: {
    fontWeight: '600',
    fontSize: 12,
  },
  offlineText: {
    color: '#b54708',
  },
  errorText: {
    color: '#b42318',
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  barcode: {
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  time: {
    marginTop: 4,
    opacity: 0.7,
  },
});
