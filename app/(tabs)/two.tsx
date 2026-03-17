import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { type ScanLogItem } from '@/lib/scan-log';
import { listLocalLogs, subscribeConnectivitySync, syncPendingLogs } from '@/lib/offline-scan-log';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const unsubscribe = subscribeConnectivitySync(() => {
      void loadLogs();
    });

    return unsubscribe;
  }, [loadLogs]);

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

      {loading ? <Text>Loading scan history...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error ? (
        <ScrollView contentContainerStyle={styles.list}>
          {logs.length === 0 ? <Text>No scan logs yet.</Text> : null}

          {logs.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.barcode}>{log.barcode}</Text>
                <View style={styles.syncBadgeWrap}>
                  <View style={[styles.syncDot, log.sync_state === 'synced' ? styles.syncDotSynced : styles.syncDotPending]} />
                  <Text style={styles.syncBadgeText}>{log.sync_state === 'synced' ? 'Synced' : 'Pending'}</Text>
                </View>
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
  syncBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  syncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncDotSynced: {
    backgroundColor: '#12b76a',
  },
  syncDotPending: {
    backgroundColor: '#f79009',
  },
  syncBadgeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  time: {
    marginTop: 4,
    opacity: 0.7,
  },
});