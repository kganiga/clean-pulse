export type FileCategory =
  | 'duplicates'
  | 'old_downloads'
  | 'temp_files'
  | 'tmp_files'
  | 'app_apks'
  | 'large_files'
  | 'empty_dirs'
  | 'app_cache';

export interface DuplicateMember {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: number;
  isOriginal: boolean;
  selectedForDeletion: boolean;
  locationCategory: 'CAMERA_DCIM' | 'DOCUMENTS' | 'DOWNLOADS' | 'SHARED_TRANSIT' | 'CACHE' | 'CUSTOM';
  realFileHandle?: FileSystemFileHandle;
  initialModifiedTimestamp: number;
  hasMutated: boolean;
  previewUrl?: string;
}

export interface DuplicateGroup {
  groupId: string;
  sha256: string;
  exactByteSize: number;
  members: DuplicateMember[];
  totalGroupBytes: number;
  reclaimableBytes: number;
  recommendedKeepId: string;
  recommendedKeepReason: string;
  verificationStatus: 'VERIFIED_STREAMED_SHA256' | 'BYTE_VERIFIED' | 'UNVERIFIED_MUTATED' | 'INACCESSIBLE';
  mimeType: string;
  samplePrefixMatched: boolean;
}

export interface DuplicateTestResult {
  id: string;
  name: string;
  passed: boolean;
  scenario: string;
  expectedBehavior: string;
  actualOutcome: string;
}

export interface StorageCandidate {
  id: string;
  name: string;
  path: string;
  size: number;
  category: FileCategory;
  mimeType: string;
  lastModified: number;
  lastAccessed?: number; // Timestamp of last file open/read event (Android atime)
  flagReason: string;
  sha256?: string;
  isSafeToDelete: boolean;
  requiresSafPrompt: boolean;
  duplicateGroupId?: string;
  isOriginal?: boolean;
  selected: boolean;
  realFileHandle?: FileSystemFileHandle;
  duplicateGroup?: DuplicateGroup;
}

export type SmartSuggestAction = 'ARCHIVE' | 'DELETE';

export interface SmartSuggestion {
  candidateId: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  lastAccessed: number;
  daysDormant: number;
  suggestedAction: SmartSuggestAction;
  confidenceScore: number; // 0 to 100
  reason: string;
  category: FileCategory;
  selected: boolean;
  canArchive: boolean;
}

export interface SmartSuggestSummary {
  totalDormantFiles: number;
  totalDormantBytes: number;
  archiveSuggestedBytes: number;
  deleteSuggestedBytes: number;
  archiveCount: number;
  deleteCount: number;
  suggestions: SmartSuggestion[];
}

export interface StorageBreakdown {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  cleanableBytes: number;
  guaranteedReclaimableBytes: number;
  largeFilesCount: number;
  largeFilesBytes: number;
  duplicateCount: number;
  duplicateBytes: number;
  oldDownloadsCount: number;
  oldDownloadsBytes: number;
  tempFilesCount: number;
  tempFilesBytes: number;
  tmpFilesCount: number;
  tmpFilesBytes: number;
  apksCount: number;
  apksBytes: number;
  emptyDirsCount: number;
  appCacheBytes: number;
}

export interface ScanProgressState {
  isScanning: boolean;
  currentPath: string;
  filesScanned: number;
  totalEstimatedFiles: number;
  bytesExamined: number;
  percent: number;
  phase: 'indexing' | 'hashing_duplicates' | 'evaluating_policies' | 'completed' | 'cancelled';
  duplicatesFound: number;
  cleanableFound: number;
}

export interface CleanupExecutionResult {
  timestamp: number;
  bytesReclaimed: number;
  filesDeletedCount: number;
  failedCount: number;
  freedByAppCache: number;
  freedByUserFiles: number;
  details: {
    fileName: string;
    size: number;
    category: FileCategory;
    success: boolean;
    errorReason?: string;
  }[];
}

export interface ScanHistoryRecord {
  id: string;
  timestamp: number;
  durationMs: number;
  filesScanned: number;
  totalBytesScanned: number;
  cleanableFoundBytes: number;
  duplicatesFoundCount: number;
}

export interface CleanupHistoryRecord {
  id: string;
  timestamp: number;
  bytesReclaimed: number;
  itemsCount: number;
  categoriesCleaned: FileCategory[];
  triggeredBy: 'manual' | 'workmanager_scheduled';
}

export interface AutoCleanPreferences {
  enabled: boolean;
  frequency: 'daily' | 'three_days' | 'weekly' | 'monthly';
  storageThresholdPercent: number; // e.g. 80 means only run review if used >= 80%
  maxFileAgeDays: number; // e.g. 30, 60, 90
  largeFileThresholdMb: number; // e.g. 25, 50, 100
  categories: {
    appCache: boolean;
    tmpFiles: boolean;
    tempFiles: boolean;
    oldDownloads: boolean;
    emptyDirs: boolean;
    duplicateFiles: boolean;
    apks: boolean;
  };
  requireBatteryNotLow: boolean;
  requireDeviceIdle: boolean;
  lastExecutionTimestamp: number | null;
  lastExecutionStatus: 'SUCCESS' | 'SKIPPED_THRESHOLD' | 'FAILED' | 'NEVER_RUN';
  lastReclaimedBytes: number;
}

export interface DeviceHealthMetrics {
  storagePressureLevel: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  batteryLevel: number;
  isBatteryCharging: boolean;
  batteryHealth: string;
  osVersion: string;
  sdkInt: number;
  deviceModel: string;
  totalRamGb: number;
  availableRamGb: number;
  storageUsageRatio: number;
}
