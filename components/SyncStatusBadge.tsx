import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { type SyncState } from '@/lib/scan-log';

type Props = {
  syncState: SyncState;
};

export function SyncStatusBadge({ syncState }: Props) {
  const synced = syncState === 'synced';

  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, synced ? styles.dotSynced : styles.dotPending]} />
      <Text style={styles.text}>{synced ? 'Synced' : 'Pending'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotSynced: {
    backgroundColor: '#12b76a',
  },
  dotPending: {
    backgroundColor: '#f79009',
  },
  text: {
    fontWeight: '600',
    fontSize: 12,
  },
});
