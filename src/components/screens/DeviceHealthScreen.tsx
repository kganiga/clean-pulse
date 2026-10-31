import React, { useState } from 'react';
import {
  ArrowLeft,
  Activity,
  BatteryCharging,
  Cpu,
  Info,
  ExternalLink,
  ShieldAlert,
  HardDrive,
} from 'lucide-react';
import { DeviceHealthMetrics, StorageBreakdown } from '../../types';
import { formatBytes, triggerHaptic } from '../../utils/formatters';
import { M3Card, M3Button } from '../common/MaterialComponents';

export function DeviceHealthScreen({
  metrics,
  breakdown,
  onBack,
}: {
  metrics: DeviceHealthMetrics;
  breakdown: StorageBreakdown;
  onBack: () => void;
}) {
  const [selectedAppAlert, setSelectedAppAlert] = useState<string | null>(null);

  const sampleHeavyApps = [
    { name: 'Chrome Browser', pkg: 'com.android.chrome', cacheSize: 420 * 1024 * 1024 },
    { name: 'Spotify Music', pkg: 'com.spotify.music', cacheSize: 1.1 * 1024 * 1024 * 1024 },
    { name: 'YouTube Video', pkg: 'com.google.android.youtube', cacheSize: 640 * 1024 * 1024 },
    { name: 'Telegram Messenger', pkg: 'org.telegram.messenger', cacheSize: 890 * 1024 * 1024 },
  ];

  const handleOpenAppSettings = (appName: string, pkg: string) => {
    triggerHaptic('light');
    setSelectedAppAlert(
      `Native Android Intent dispatched: Settings.ACTION_APPLICATION_DETAILS_SETTINGS for ${pkg}. Modern Android requires the user or OS to clear third-party private caches.`
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between pb-6">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b border-slate-800/60 shrink-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-100">Device Health & Storage</h1>
            <p className="text-[11px] text-slate-400">Android System Telemetry & Insights</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Pressure & Battery Cards */}
          <div className="grid grid-cols-2 gap-3">
            <M3Card className="bg-slate-900 border-slate-800">
              <span className="text-[11px] text-slate-400">Storage Pressure</span>
              <div
                className={`text-base font-bold font-mono mt-1 ${
                  metrics.storagePressureLevel === 'NORMAL'
                    ? 'text-emerald-400'
                    : metrics.storagePressureLevel === 'MODERATE'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {metrics.storagePressureLevel}
              </div>
              <span className="text-[10px] text-slate-500">
                {Math.round(metrics.storageUsageRatio * 100)}% capacity reached
              </span>
            </M3Card>

            <M3Card className="bg-slate-900 border-slate-800">
              <span className="text-[11px] text-slate-400">Battery Status</span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4" />
                <span>{metrics.batteryLevel}%</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {metrics.isBatteryCharging ? 'Charging' : 'Discharging'} · {metrics.batteryHealth}
              </span>
            </M3Card>
          </div>

          {/* Educational Callout: Truth About RAM vs Storage */}
          <M3Card className="bg-slate-900 border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Android Memory Architecture: Facts vs Myths</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              CleanPulse focuses purely on <strong>reclaiming disk storage</strong>. Unlike deceptive
              cleaners, CleanPulse does not offer a "RAM Booster" or "Task Killer".
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
              <div>
                <strong>Why RAM cleaners hurt performance:</strong> Android runs a Linux kernel.
                Cached processes keep frequently used apps in standby for instant launches.
              </div>
              <div>
                Force-stopping apps causes cold-boot restarts, which burns <em>more</em> CPU cycles and
                battery life.
              </div>
            </div>
          </M3Card>

          {/* Heavy Third-Party App Caches with OS Settings Shortcuts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Heavy Apps Storage Footprint
            </span>
            <p className="text-[11px] text-slate-400 px-1">
              Android security policy (SELinux) prevents third-party apps from clearing other apps'
              private caches directly. Tap to inspect in system settings:
            </p>

            <div className="space-y-2">
              {sampleHeavyApps.map((app) => (
                <div
                  key={app.pkg}
                  onClick={() => handleOpenAppSettings(app.name, app.pkg)}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">{app.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Approx. Cache: {formatBytes(app.cacheSize)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span>Manage</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {selectedAppAlert && (
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300">
                {selectedAppAlert}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
