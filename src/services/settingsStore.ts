import { AutoCleanPreferences } from '../types';

const SETTINGS_KEY = 'cleanpulse_settings_datastore_v1';
const THEME_KEY = 'cleanpulse_theme_v1';
const ONBOARDED_KEY = 'cleanpulse_onboarded_v1';

export const DEFAULT_AUTOCLEAN_SETTINGS: AutoCleanPreferences = {
  enabled: true,
  frequency: 'weekly',
  storageThresholdPercent: 80, // Review when storage is 80%+ full
  maxFileAgeDays: 60, // Files older than 60 days in downloads
  largeFileThresholdMb: 50,
  categories: {
    appCache: true,
    tmpFiles: true,
    tempFiles: true,
    oldDownloads: false, // Off by default for scheduled to safeguard user files
    emptyDirs: true,
    duplicateFiles: false, // Off by default for automated background deletion
    apks: true,
  },
  requireBatteryNotLow: true,
  requireDeviceIdle: true,
  lastExecutionTimestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
  lastExecutionStatus: 'SUCCESS',
  lastReclaimedBytes: 382 * 1024 * 1024,
};

export function getStoredSettings(): AutoCleanPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_AUTOCLEAN_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUTOCLEAN_SETTINGS,
      ...parsed,
      categories: {
        ...DEFAULT_AUTOCLEAN_SETTINGS.categories,
        ...(parsed.categories || {}),
      },
    };
  } catch {
    return DEFAULT_AUTOCLEAN_SETTINGS;
  }
}

export function saveSettings(settings: AutoCleanPreferences): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === 'true';
}

export function setOnboardingCompleted(completed: boolean): void {
  localStorage.setItem(ONBOARDED_KEY, completed ? 'true' : 'false');
}

export function getStoredTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(THEME_KEY, theme);
}
