import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

import { syncPendingLogs } from '@/lib/sync';

type ConnectivityListener = (isConnected: boolean) => void;
type SyncListener = () => void;

const connectivityListeners = new Set<ConnectivityListener>();
const syncListeners = new Set<SyncListener>();

let isConnectedState = true;
let started = false;
let unsubscribeNetInfo: (() => void) | null = null;

function notifyConnectivity(isConnected: boolean) {
  isConnectedState = isConnected;
  connectivityListeners.forEach((listener) => listener(isConnected));
}

function notifySync() {
  syncListeners.forEach((listener) => listener());
}

export function startNetworkListener() {
  if (started) {
    return () => {};
  }

  started = true;

  void NetInfo.fetch().then((state) => {
    notifyConnectivity(Boolean(state.isConnected));
  });

  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    const isConnected = Boolean(state.isConnected);
    notifyConnectivity(isConnected);

    if (isConnected) {
      void syncPendingLogs().then(({ syncedCount }) => {
        if (syncedCount > 0) {
          notifySync();
        }
      });
    }
  });

  return () => {
    unsubscribeNetInfo?.();
    unsubscribeNetInfo = null;
    started = false;
  };
}

export function useIsConnected() {
  const [isConnected, setIsConnected] = useState(isConnectedState);

  useEffect(() => {
    const listener: ConnectivityListener = (state) => {
      setIsConnected(state);
    };

    connectivityListeners.add(listener);
    return () => {
      connectivityListeners.delete(listener);
    };
  }, []);

  return isConnected;
}

export function subscribeSyncCompleted(listener: SyncListener) {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export function _resetNetworkForTests() {
  connectivityListeners.clear();
  syncListeners.clear();
  isConnectedState = true;
  started = false;
  unsubscribeNetInfo = null;
}
