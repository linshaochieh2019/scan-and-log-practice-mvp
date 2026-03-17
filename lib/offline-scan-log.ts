// Deprecated: kept as compatibility shim during module split.
// Use lib/database.ts, lib/sync.ts, and lib/network.ts directly.
export { createLocalLog, listLocalLogs } from '@/lib/database';
export { syncPendingLogs } from '@/lib/sync';
export { startNetworkListener as subscribeConnectivitySync } from '@/lib/network';
export { _resetDatabaseForTests as _resetOfflineStoreForTests } from '@/lib/database';
