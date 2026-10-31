import { ScanHistoryRecord, CleanupHistoryRecord } from '../types';

const SCAN_HISTORY_KEY = 'cleanpulse_scan_history_v1';
const CLEANUP_HISTORY_KEY = 'cleanpulse_cleanup_history_v1';

export function getScanHistory(): ScanHistoryRecord[] {
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY);
    if (!raw) return getInitialScanHistory();
    return JSON.parse(raw);
  } catch {
    return getInitialScanHistory();
  }
}

export function saveScanRecord(record: Omit<ScanHistoryRecord, 'id'>): ScanHistoryRecord {
  const newRecord: ScanHistoryRecord = {
    ...record,
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  const list = getScanHistory();
  list.unshift(newRecord);
  try {
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // fallback
  }
  return newRecord;
}

export function getCleanupHistory(): CleanupHistoryRecord[] {
  try {
    const raw = localStorage.getItem(CLEANUP_HISTORY_KEY);
    if (!raw) return getInitialCleanupHistory();
    return JSON.parse(raw);
  } catch {
    return getInitialCleanupHistory();
  }
}

export function saveCleanupRecord(record: Omit<CleanupHistoryRecord, 'id'>): CleanupHistoryRecord {
  const newRecord: CleanupHistoryRecord = {
    ...record,
    id: `cleanup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  const list = getCleanupHistory();
  list.unshift(newRecord);
  try {
    localStorage.setItem(CLEANUP_HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // fallback
  }
  return newRecord;
}

export function clearAllHistory() {
  localStorage.removeItem(SCAN_HISTORY_KEY);
  localStorage.removeItem(CLEANUP_HISTORY_KEY);
}

export interface DailyCleanupPoint {
  dateKey: string; // YYYY-MM-DD
  dayLabel: string; // 'Oct 24' or 'D 24'
  shortLabel: string; // '24' or 'Mon'
  timestamp: number;
  bytesReclaimed: number;
  itemsCount: number;
  cleanupsCount: number;
}

/**
 * Aggregates cleanup history by day for the last N days (defaults to 30)
 */
export function getDailyCleanupTrend(
  history: CleanupHistoryRecord[],
  totalDays: number = 30
): DailyCleanupPoint[] {
  const result: DailyCleanupPoint[] = [];
  const now = new Date();
  
  // Create a map of day key -> accumulated data
  const dayMap = new Map<string, { bytes: number; items: number; count: number }>();

  history.forEach((record) => {
    const d = new Date(record.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const curr = dayMap.get(key) || { bytes: 0, items: 0, count: 0 };
    curr.bytes += record.bytesReclaimed || 0;
    curr.items += record.itemsCount || 0;
    curr.count += 1;
    dayMap.set(key, curr);
  });

  // Generate continuous timeline for the last `totalDays` days (oldest to newest)
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = dayMap.get(key) || { bytes: 0, items: 0, count: 0 };

    result.push({
      dateKey: key,
      dayLabel: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      shortLabel: d.getDate().toString(),
      timestamp: d.getTime(),
      bytesReclaimed: entry.bytes,
      itemsCount: entry.items,
      cleanupsCount: entry.count,
    });
  }

  return result;
}

function getInitialScanHistory(): ScanHistoryRecord[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'scan_init_1',
      timestamp: now - 1 * dayMs,
      durationMs: 3410,
      filesScanned: 14890,
      totalBytesScanned: 56.4 * 1024 * 1024 * 1024,
      cleanableFoundBytes: 650 * 1024 * 1024,
      duplicatesFoundCount: 3,
    },
    {
      id: 'scan_init_2',
      timestamp: now - 3 * dayMs,
      durationMs: 3820,
      filesScanned: 14280,
      totalBytesScanned: 54.2 * 1024 * 1024 * 1024,
      cleanableFoundBytes: 812 * 1024 * 1024,
      duplicatesFoundCount: 4,
    },
    {
      id: 'scan_init_3',
      timestamp: now - 8 * dayMs,
      durationMs: 4120,
      filesScanned: 13910,
      totalBytesScanned: 51.8 * 1024 * 1024 * 1024,
      cleanableFoundBytes: 1.4 * 1024 * 1024 * 1024,
      duplicatesFoundCount: 8,
    },
  ];
}

function getInitialCleanupHistory(): CleanupHistoryRecord[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'clean_init_0',
      timestamp: now - 1 * dayMs + 3600000 * 2,
      bytesReclaimed: 420 * 1024 * 1024,
      itemsCount: 9,
      categoriesCleaned: ['tmp_files', 'app_cache'],
      triggeredBy: 'manual',
    },
    {
      id: 'clean_init_1',
      timestamp: now - 3 * dayMs,
      bytesReclaimed: 754 * 1024 * 1024,
      itemsCount: 14,
      categoriesCleaned: ['app_cache', 'temp_files', 'app_apks'],
      triggeredBy: 'manual',
    },
    {
      id: 'clean_init_2',
      timestamp: now - 6 * dayMs,
      bytesReclaimed: 310 * 1024 * 1024,
      itemsCount: 7,
      categoriesCleaned: ['tmp_files', 'empty_dirs'],
      triggeredBy: 'workmanager_scheduled',
    },
    {
      id: 'clean_init_3',
      timestamp: now - 10 * dayMs,
      bytesReclaimed: 1.25 * 1024 * 1024 * 1024,
      itemsCount: 19,
      categoriesCleaned: ['app_cache', 'temp_files', 'duplicates', 'empty_dirs'],
      triggeredBy: 'workmanager_scheduled',
    },
    {
      id: 'clean_init_4',
      timestamp: now - 14 * dayMs,
      bytesReclaimed: 580 * 1024 * 1024,
      itemsCount: 11,
      categoriesCleaned: ['old_downloads', 'app_cache'],
      triggeredBy: 'manual',
    },
    {
      id: 'clean_init_5',
      timestamp: now - 19 * dayMs,
      bytesReclaimed: 890 * 1024 * 1024,
      itemsCount: 16,
      categoriesCleaned: ['duplicates', 'temp_files', 'tmp_files'],
      triggeredBy: 'workmanager_scheduled',
    },
    {
      id: 'clean_init_6',
      timestamp: now - 23 * dayMs,
      bytesReclaimed: 460 * 1024 * 1024,
      itemsCount: 8,
      categoriesCleaned: ['app_cache', 'app_apks'],
      triggeredBy: 'manual',
    },
    {
      id: 'clean_init_7',
      timestamp: now - 27 * dayMs,
      bytesReclaimed: 1.6 * 1024 * 1024 * 1024,
      itemsCount: 22,
      categoriesCleaned: ['duplicates', 'app_apks', 'old_downloads', 'empty_dirs'],
      triggeredBy: 'manual',
    },
  ];
}

