import { AutoCleanPreferences, DeviceHealthMetrics } from '../types';

/**
 * Calculates the next estimated WorkManager periodic window.
 * Android WorkManager uses minimum 15-minute intervals for PeriodicWorkRequest.
 */
export function calculateNextExecutionWindow(settings: AutoCleanPreferences): {
  startWindow: number;
  endWindow: number;
  formattedText: string;
} {
  if (!settings.enabled) {
    return {
      startWindow: 0,
      endWindow: 0,
      formattedText: 'Automatic maintenance is disabled',
    };
  }

  const base = settings.lastExecutionTimestamp || Date.now();
  let intervalMs: number;
  switch (settings.frequency) {
    case 'daily':
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case 'three_days':
      intervalMs = 3 * 24 * 60 * 60 * 1000;
      break;
    case 'weekly':
      intervalMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case 'monthly':
      intervalMs = 30 * 24 * 60 * 60 * 1000;
      break;
  }

  const targetTime = base + intervalMs;
  const now = Date.now();
  const adjustedTarget = targetTime < now ? now + 2 * 60 * 60 * 1000 : targetTime;

  // WorkManager flex interval is typically 15-30 minutes window
  const startWindow = adjustedTarget;
  const endWindow = adjustedTarget + 30 * 60 * 1000;

  const date = new Date(startWindow);
  const formatted = `${date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} (~${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})`;

  return {
    startWindow,
    endWindow,
    formattedText: `${formatted} (Subject to Doze & charging state)`,
  };
}

/**
 * Retrieves real or realistic device health telemetry
 */
export async function getDeviceHealthTelemetry(
  storageUsedBytes: number,
  storageTotalBytes: number
): Promise<DeviceHealthMetrics> {
  const usageRatio = storageTotalBytes > 0 ? storageUsedBytes / storageTotalBytes : 0.72;

  let pressure: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'NORMAL';
  if (usageRatio > 0.92) pressure = 'CRITICAL';
  else if (usageRatio > 0.82) pressure = 'HIGH';
  else if (usageRatio > 0.7) pressure = 'MODERATE';

  let batteryLevel = 84;
  let isBatteryCharging = false;

  // Check Web Battery API if available
  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    try {
      // @ts-expect-error getBattery is non-standard but available in Chromium
      const battery = await navigator.getBattery();
      batteryLevel = Math.round(battery.level * 100);
      isBatteryCharging = battery.charging;
    } catch {
      // ignore
    }
  }

  return {
    storagePressureLevel: pressure,
    batteryLevel,
    isBatteryCharging,
    batteryHealth: 'Good (96% Cycle Life)',
    osVersion: 'Android 15 (Vanilla Ice Cream)',
    sdkInt: 35,
    deviceModel: 'Pixel 9 Pro',
    totalRamGb: 12,
    availableRamGb: 4.8,
    storageUsageRatio: usageRatio,
  };
}
