import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { type ScanLogItem } from '@/lib/scan-log';
import { supabase } from '@/lib/supabase';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please sign in first. No authenticated Supabase user found.');
      }

      const { data, error: queryError } = await supabase
        .from('scan_logs')
        .select('id, barcode, scan_type, status, notes, latitude, longitude, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setLogs((data ?? []) as ScanLogItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Pressable style={styles.refreshButton} onPress={loadLogs}>
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
              <Text style={styles.barcode}>{log.barcode}</Text>
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
  barcode: {
    fontWeight: '700',
    fontSize: 16,
  },
  time: {
    marginTop: 4,
    opacity: 0.7,
  },
});