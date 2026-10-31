import React, { useState } from 'react';
import { ArrowLeft, Trash2, Calendar, CheckCircle2, Search, Sparkles } from 'lucide-react';
import { ScanHistoryRecord, CleanupHistoryRecord } from '../../types';
import { formatBytes, formatDuration, formatTimestamp, formatNumber, triggerHaptic } from '../../utils/formatters';
import { M3Card } from '../common/MaterialComponents';
import { ReclaimedStorageChart } from '../dashboard/ReclaimedStorageChart';

export function HistoryScreen({
  scanHistory,
  cleanupHistory,
  onClearHistory,
  onBack,
}: {
  scanHistory: ScanHistoryRecord[];
  cleanupHistory: CleanupHistoryRecord[];
  onClearHistory: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'cleanups' | 'scans'>('cleanups');

  const totalReclaimedEver = cleanupHistory.reduce((sum, item) => sum + item.bytesReclaimed, 0);

  return (
    <div className="flex-1 flex flex-col justify-between pb-6">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-100">Audit History</h1>
              <p className="text-[11px] text-slate-400">Room Database Persistent Log</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('warning');
              onClearHistory();
            }}
            title="Clear History"
            className="p-2 text-slate-500 hover:text-rose-400 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Total Reclaimed Header Strip */}
        <div className="p-5 pb-3">
          <M3Card className="bg-slate-900 border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Lifetime Reclaimed Storage</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatBytes(totalReclaimedEver)}
            </div>
            <p className="text-[11px] text-slate-400">
              Verified physical byte releases across {cleanupHistory.length} cleanup runs.
            </p>
          </M3Card>
        </div>

        {/* Tab Switcher */}
        <div className="px-5">
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                triggerHaptic('light');
                setTab('cleanups');
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'cleanups'
                  ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cleanup Runs ({cleanupHistory.length})
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setTab('scans');
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'scans'
                  ? 'bg-slate-800 text-slate-100 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Scan Records ({scanHistory.length})
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-5 space-y-3">
          {tab === 'cleanups' ? (
            cleanupHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No cleanup records logged yet.
              </div>
            ) : (
              <>
                <ReclaimedStorageChart history={cleanupHistory} />
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">
                  Recent Runs
                </div>
                {cleanupHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Reclaimed {formatBytes(item.bytesReclaimed)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <span>{item.itemsCount} items removed</span>
                    <span>·</span>
                    <span className="capitalize">
                      {item.triggeredBy === 'workmanager_scheduled'
                        ? 'WorkManager Scheduled'
                        : 'Manual'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Categories: {item.categoriesCleaned.join(', ')}
                  </div>
                </div>
              ))}
              </>
            )
          ) : scanHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No scan history logged yet.
            </div>
          ) : (
            scanHistory.map((scan) => (
              <div
                key={scan.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    Scanned {formatNumber(scan.filesScanned)} files
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatTimestamp(scan.timestamp)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                  <div>Duration: {formatDuration(scan.durationMs)}</div>
                  <div>Duplicates: {scan.duplicatesFoundCount}</div>
                  <div>Cleanable: {formatBytes(scan.cleanableFoundBytes)}</div>
                  <div>Examined: {formatBytes(scan.totalBytesScanned)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
