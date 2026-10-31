import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  BatteryCharging,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Clock,
  Shield,
} from 'lucide-react';
import { AutoCleanPreferences } from '../../types';
import { formatBytes, formatTimestamp, triggerHaptic } from '../../utils/formatters';
import { calculateNextExecutionWindow } from '../../services/workManagerSimulator';
import { M3Button, M3Card } from '../common/MaterialComponents';
import { CleanPulseLogo } from '../common/CleanPulseLogo';

export function AutoCleanSettingsScreen({
  settings,
  onSaveSettings,
  onSimulateWorkManagerJob,
  onNavigateToHistory,
  onNavigateToPrivacy,
  onBack,
}: {
  settings: AutoCleanPreferences;
  onSaveSettings: (updated: AutoCleanPreferences) => void;
  onSimulateWorkManagerJob: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToPrivacy?: () => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<AutoCleanPreferences>({ ...settings });
  const [testResult, setTestResult] = useState<string | null>(null);

  const nextWindow = calculateNextExecutionWindow(form);

  const handleToggleEnable = () => {
    triggerHaptic('light');
    const updated = { ...form, enabled: !form.enabled };
    setForm(updated);
    onSaveSettings(updated);
  };

  const handleUpdate = (updates: Partial<AutoCleanPreferences>) => {
    triggerHaptic('light');
    const updated = { ...form, ...updates };
    setForm(updated);
    onSaveSettings(updated);
  };

  const handleCategoryToggle = (key: keyof AutoCleanPreferences['categories']) => {
    triggerHaptic('light');
    const updated = {
      ...form,
      categories: {
        ...form.categories,
        [key]: !form.categories[key],
      },
    };
    setForm(updated);
    onSaveSettings(updated);
  };

  const handleRunSimulation = () => {
    triggerHaptic('medium');
    setTestResult('Running WorkManager AutoCleanWorker with battery constraints...');
    setTimeout(() => {
      onSimulateWorkManagerJob();
      setTestResult('Worker succeeded: Periodic maintenance completed & recorded.');
      setTimeout(() => setTestResult(null), 4000);
    }, 1200);
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
            <h1 className="text-base font-bold text-slate-100">Auto Maintenance</h1>
            <p className="text-[11px] text-slate-400">WorkManager Periodic Scheduling</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Main Master Switch Card */}
          <M3Card className="flex items-center justify-between bg-slate-900 border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Automatic Storage Maintenance
              </span>
              <span className="text-[11px] text-slate-400">
                Periodically clean safe caches in the background
              </span>
            </div>
            <button
              onClick={handleToggleEnable}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                form.enabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  form.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </M3Card>

          {/* Schedule Frequency */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Maintenance Interval
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'three_days', label: 'Every 3 Days' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  disabled={!form.enabled}
                  onClick={() => handleUpdate({ frequency: opt.id as any })}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-colors ${
                    form.frequency === opt.id
                      ? 'bg-slate-800 border-emerald-500/60 text-emerald-400 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Pressure Trigger Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Storage Threshold Review
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                {form.storageThresholdPercent}% Used
              </span>
            </div>
            <M3Card className="space-y-2 bg-slate-900 border-slate-800">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                disabled={!form.enabled}
                value={form.storageThresholdPercent}
                onChange={(e) =>
                  handleUpdate({ storageThresholdPercent: parseInt(e.target.value, 10) })
                }
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                Only triggers review notifications when device storage usage exceeds this threshold.
              </p>
            </M3Card>
          </div>

          {/* Max File Age */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Max Age for Downloads
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                {form.maxFileAgeDays} Days
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  disabled={!form.enabled}
                  onClick={() => handleUpdate({ maxFileAgeDays: days })}
                  className={`p-2.5 rounded-xl border text-xs font-mono text-center transition-colors ${
                    form.maxFileAgeDays === days
                      ? 'bg-slate-800 border-emerald-500/60 text-emerald-400 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Eligible Categories Independent Toggles */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Eligible Scheduled Categories
            </span>
            <M3Card className="space-y-3 bg-slate-900 border-slate-800">
              {[
                {
                  key: 'appCache' as const,
                  label: 'CleanPulse Internal Cache',
                  desc: 'Rebuilt automatically.',
                  safe: true,
                },
                {
                  key: 'tmpFiles' as const,
                  label: 'Temporary Files (.tmp)',
                  desc: 'Stale video buffers, camera caches, and .tmp files.',
                  safe: true,
                },
                {
                  key: 'tempFiles' as const,
                  label: 'Residual & Log Files',
                  desc: 'Orphan crash logs and partial downloads.',
                  safe: true,
                },
                {
                  key: 'emptyDirs' as const,
                  label: 'Empty Directories',
                  desc: 'Clean 0-byte orphan folders.',
                  safe: true,
                },
                {
                  key: 'apks' as const,
                  label: 'Old APK Installers',
                  desc: 'Leftover packages in Downloads.',
                  safe: true,
                },
                {
                  key: 'oldDownloads' as const,
                  label: 'Old Downloads Review',
                  desc: 'Never auto-deleted silently.',
                  safe: false,
                },
                {
                  key: 'duplicateFiles' as const,
                  label: 'Duplicate Files Queue',
                  desc: 'Requires explicit user review.',
                  safe: false,
                },
              ].map((cat) => (
                <div key={cat.key} className="flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-200">{cat.label}</span>
                      {!cat.safe && (
                        <span className="text-[10px] text-amber-400">· Review Only</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{cat.desc}</span>
                  </div>
                  <button
                    disabled={!form.enabled}
                    onClick={() => handleCategoryToggle(cat.key)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      form.categories[cat.key]
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold text-xs'
                        : 'border-slate-700 bg-slate-800 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </M3Card>
          </div>

          {/* WorkManager Battery & Idle Constraints */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Android WorkManager Constraints
            </span>
            <M3Card className="space-y-2 text-xs bg-slate-900 border-slate-800">
              <div className="flex items-center justify-between">
                <span>Requires Battery Not Low</span>
                <span className="text-emerald-400 font-mono">Enforced (≥ 20%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Requires Device Idle</span>
                <span className="text-emerald-400 font-mono">Enforced</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                WorkManager delays execution if device is experiencing heavy thermal throttling, Doze
                mode, or low battery.
              </div>
            </M3Card>
          </div>

          {/* Next Execution Window */}
          <M3Card className="text-xs bg-slate-900 border-slate-800 space-y-1.5">
            <span className="text-slate-400 text-[11px]">Next Estimated Window</span>
            <div className="font-mono text-emerald-400 font-semibold">{nextWindow.formattedText}</div>
            <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
              <span>Last Execution Status</span>
              <span className="font-mono text-slate-200">{form.lastExecutionStatus}</span>
            </div>
          </M3Card>

          {/* Audit History & Privacy Section */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Data & Privacy
            </span>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/60 overflow-hidden text-xs">
              {onNavigateToHistory && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigateToHistory();
                  }}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 text-left transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">Audit History & Logs</span>
                    <span className="text-[11px] text-slate-400">View past scans and reclaimed storage logs</span>
                  </div>
                  <span className="text-emerald-400 font-medium">View →</span>
                </button>
              )}
              {onNavigateToPrivacy && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigateToPrivacy();
                  }}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-850 text-left transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">Privacy & Scoped Storage</span>
                    <span className="text-[11px] text-slate-400">Review 100% on-device local guarantees</span>
                  </div>
                  <span className="text-emerald-400 font-medium">View →</span>
                </button>
              )}
            </div>
          </div>

          {/* About CleanPulse Brand Card */}
          <div className="pt-1">
            <M3Card className="bg-slate-900/80 border-slate-800/80 p-3.5 flex items-center gap-3">
              <CleanPulseLogo size="lg" variant="icon" />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-slate-200 block">CleanPulse Android</span>
                <span className="text-[10px] text-emerald-400 font-semibold block">smart. fresh. lived.</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  v2.4.0 · Native Jetpack Compose &amp; Room
                </span>
              </div>
            </M3Card>
          </div>
        </div>
      </div>
    </div>
  );
}
