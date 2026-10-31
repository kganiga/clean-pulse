import React, { useState } from 'react';
import {
  Sparkles,
  FolderOpen,
  Copy,
  Clock,
  Package,
  FileText,
  ChevronRight,
  Layers,
  FolderArchive,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Trash2,
  Info,
  FileCode,
  Zap,
} from 'lucide-react';
import { StorageBreakdown, StorageCandidate, AutoCleanPreferences, CleanupHistoryRecord, SmartSuggestion } from '../../types';
import { formatBytes, formatRelativeTime, triggerHaptic } from '../../utils/formatters';
import { M3Button, M3Card, M3StorageDial } from '../common/MaterialComponents';
import { calculateNextExecutionWindow } from '../../services/workManagerSimulator';
import { ReclaimedStorageChart } from '../dashboard/ReclaimedStorageChart';
import { SmartSuggestCard } from '../dashboard/SmartSuggestCard';
import { StorageTipsCard } from '../dashboard/StorageTipsCard';
import { CleanPulseLogo } from '../common/CleanPulseLogo';
import { getCleanupHistory } from '../../services/historyStore';

export function DashboardScreen({
  breakdown,
  candidates,
  lastScanTime,
  lastCleanupTime,
  autoCleanSettings,
  cleanupHistory,
  onStartScan,
  onCleanSelected,
  onQuickClean,
  onSelectCategory,
  onPickRealFolder,
  onOpenScreen,
  onDeleteCandidates,
  onArchiveCandidates,
}: {
  breakdown: StorageBreakdown;
  candidates: StorageCandidate[];
  lastScanTime: number | null;
  lastCleanupTime: number | null;
  autoCleanSettings: AutoCleanPreferences;
  cleanupHistory?: CleanupHistoryRecord[];
  onStartScan: () => void;
  onCleanSelected: () => void;
  onQuickClean?: () => number;
  onSelectCategory: (cat: string) => void;
  onPickRealFolder: () => void;
  onOpenScreen: (screen: 'history' | 'health' | 'settings' | 'privacy' | 'review' | 'impact') => void;
  onDeleteCandidates?: (ids: string[]) => void;
  onArchiveCandidates?: (archivedFiles: SmartSuggestion[], zipFileName: string) => void;
}) {
  const [quickCleanSuccessMsg, setQuickCleanSuccessMsg] = useState<string | null>(null);
  const usedRatio = breakdown.totalBytes > 0 ? breakdown.usedBytes / breakdown.totalBytes : 0;
  const usedPercent = Math.round(usedRatio * 100);
  const nextScheduled = calculateNextExecutionWindow(autoCleanSettings);
  const selectedCandidates = candidates.filter((c) => c.selected);
  const selectedBytes = selectedCandidates.reduce((acc, c) => acc + c.size, 0);

  // Quick Clean candidates: app_cache and temporary files (temp_files + tmp_files)
  const quickCleanCandidates = candidates.filter(
    (c) => c.category === 'app_cache' || c.category === 'temp_files' || c.category === 'tmp_files'
  );
  const quickCleanBytes = quickCleanCandidates.reduce((acc, c) => acc + c.size, 0);
  const quickCleanCount = quickCleanCandidates.length;

  const handleQuickCleanTap = () => {
    if (!onQuickClean || quickCleanCount === 0) return;
    triggerHaptic('medium');
    const freed = onQuickClean();
    setQuickCleanSuccessMsg(`Quick Cleaned ${formatBytes(freed)}!`);
    setTimeout(() => setQuickCleanSuccessMsg(null), 3500);
  };

  const categoryList: {
    key: string;
    label: string;
    count: number;
    bytes: number;
    icon: React.ReactNode;
    subtitle: string;
  }[] = [
    {
      key: 'duplicates',
      label: 'Duplicate Files',
      count: breakdown.duplicateCount,
      bytes: breakdown.duplicateBytes,
      icon: <Copy className="w-4 h-4 text-cyan-400" />,
      subtitle: 'Byte-for-byte SHA-256 matches',
    },
    {
      key: 'tmp_files',
      label: 'Temporary Files (.tmp)',
      count: breakdown.tmpFilesCount,
      bytes: breakdown.tmpFilesBytes,
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      subtitle: 'Stale buffers & transcode .tmp files',
    },
    {
      key: 'temp_files',
      label: 'Residual & Log Files',
      count: breakdown.tempFilesCount,
      bytes: breakdown.tempFilesBytes,
      icon: <FileText className="w-4 h-4 text-violet-400" />,
      subtitle: 'Crash logs & partial downloads',
    },
    {
      key: 'app_apks',
      label: 'Old APK Installers',
      count: breakdown.apksCount,
      bytes: breakdown.apksBytes,
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      subtitle: 'Packages left in Downloads folder',
    },
    {
      key: 'old_downloads',
      label: 'Old Downloads',
      count: breakdown.oldDownloadsCount,
      bytes: breakdown.oldDownloadsBytes,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      subtitle: 'Unaccessed for over 60 days',
    },
    {
      key: 'empty_dirs',
      label: 'Empty Directories',
      count: breakdown.emptyDirsCount,
      bytes: 0,
      icon: <FolderOpen className="w-4 h-4 text-slate-400" />,
      subtitle: 'Zero-byte abandoned directories',
    },
    {
      key: 'large_files',
      label: 'Large Media Review',
      count: breakdown.largeFilesCount,
      bytes: breakdown.largeFilesBytes,
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      subtitle: 'Videos & large files for manual check',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Refined Top App Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <CleanPulseLogo size="sm" variant="icon" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>CleanPulse</span>
              <span className="text-[9px] text-emerald-400 font-normal px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Android 15 Storage Optimizer</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Offline</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Dominant Hero Storage Card */}
        <M3Card className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 border-slate-800/90 text-center flex flex-col items-center pt-2 pb-5">
          {/* Circular Storage Dial */}
          <M3StorageDial
            usedPercent={usedPercent}
            usedLabel={formatBytes(breakdown.usedBytes, 1)}
            totalLabel={formatBytes(breakdown.totalBytes, 0)}
            freeLabel={formatBytes(breakdown.freeBytes, 1)}
            size={180}
          />

          {/* Differentiated Metrics Strip */}
          <div className="w-full mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-left">
            <div className="px-2">
              <span className="text-[11px] text-slate-400 block font-medium">
                Guaranteed Safe
              </span>
              <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                {formatBytes(breakdown.guaranteedReclaimableBytes)}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight block">
                App cache & temporary files
              </span>
            </div>
            <div className="px-2 border-l border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">
                Cleanable Candidates
              </span>
              <span className="text-base font-bold font-mono text-slate-200 mt-0.5 block">
                {formatBytes(breakdown.cleanableBytes)}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight block">
                Duplicate copies & old downloads
              </span>
            </div>
          </div>

          {/* Action CTAs: One-tap Quick Clean & Deep Scan / Clean Selected */}
          <div className="w-full mt-4 px-1 space-y-2">
            {quickCleanSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in slide-in-from-top-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {quickCleanSuccessMsg}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">Immediate Recovery</span>
              </div>
            )}

            {/* Prominent One-Tap Quick Clean Button */}
            {quickCleanBytes > 0 && !quickCleanSuccessMsg ? (
              <button
                onClick={handleQuickCleanTap}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-between px-4 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-950/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs leading-tight">Quick Clean</span>
                    <span className="text-[10px] font-normal text-slate-900 block leading-none">
                      App cache &amp; temporary files
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-sm">+{formatBytes(quickCleanBytes)}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ) : null}

            {selectedBytes > 0 ? (
              <M3Button
                onClick={() => {
                  triggerHaptic('medium');
                  onCleanSelected();
                }}
                variant="filled"
                icon={<Trash2 className="w-4 h-4" />}
                className="w-full h-11 text-xs font-semibold shadow-lg shadow-emerald-500/10"
              >
                Clean Selected Candidates ({formatBytes(selectedBytes, 1)})
              </M3Button>
            ) : (
              <M3Button
                onClick={() => {
                  triggerHaptic('medium');
                  onStartScan();
                }}
                variant={quickCleanBytes > 0 ? 'tonal' : 'filled'}
                icon={<Sparkles className="w-4 h-4" />}
                className="w-full h-11 text-xs font-semibold shadow-lg shadow-emerald-500/10"
              >
                Scan Device Storage
              </M3Button>
            )}

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenScreen('impact');
              }}
              className="w-full pt-1 inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Which files are ready to clean and why? View Impact Guide →</span>
            </button>
          </div>
        </M3Card>

        {/* Dedicated Smart Suggest Card (>90 Days Dormancy) */}
        <SmartSuggestCard
          candidates={candidates}
          onDeleteCandidates={(ids) => {
            if (onDeleteCandidates) {
              onDeleteCandidates(ids);
            }
          }}
          onArchiveCandidates={(archivedFiles, zipName) => {
            if (onArchiveCandidates) {
              onArchiveCandidates(archivedFiles, zipName);
            }
          }}
        />

        {/* 30-Day Daily Reclaimed Storage Chart */}
        <ReclaimedStorageChart
          history={cleanupHistory && cleanupHistory.length > 0 ? cleanupHistory : getCleanupHistory()}
          onOpenHistory={() => onOpenScreen('history')}
        />

        {/* Actionable Storage Tip of the Day */}
        <StorageTipsCard />

        {/* Candidate Categories: Clean Ergonomic List */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cleanup Categories
            </h2>
            <button
              onClick={() => onOpenScreen('review')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              Review All ({candidates.length})
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl divide-y divide-slate-800/60 overflow-hidden">
            {categoryList.map((item) => (
              <div
                key={item.key}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectCategory(item.key);
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-850 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-2">
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-emerald-400 block">
                      {item.bytes > 0 ? formatBytes(item.bytes) : `${item.count} items`}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {item.count} {item.count === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auxiliary Action: SAF Real Folder Scan */}
        <div
          onClick={onPickRealFolder}
          className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <span className="font-medium text-slate-200 block">
                Scan Custom Folder (SAF Picker)
              </span>
              <span className="text-[11px] text-slate-400 block">
                Authorize a real directory on this device
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
        </div>

        {/* Status & Maintenance Schedule Strip */}
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Next auto cleanup:</span>
            <span className="text-slate-300 font-medium">
              {autoCleanSettings.enabled ? autoCleanSettings.frequency : 'Disabled'}
            </span>
          </div>
          <button
            onClick={() => onOpenScreen('settings')}
            className="text-emerald-400 hover:underline cursor-pointer"
          >
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}
